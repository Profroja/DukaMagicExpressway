"""Delivery fees: distance from our main store to the customer, priced by km ranges.

The distance is the driving distance from the Google Routes API when
GOOGLE_MAPS_API_KEY is set (same API the Shabiby Cargo app uses), otherwise
the straight-line distance.
"""
import json
import logging
import math
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from auths.views import _is_admin
from .models import DeliveryFeeRange, DeliverySettings

logger = logging.getLogger(__name__)

ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes"
MAX_KM = Decimal("9999")


def parse_coordinates(lat, lng):
    """(Decimal lat, Decimal lng) or None when missing/invalid."""
    if lat in (None, "") or lng in (None, ""):
        return None
    try:
        lat, lng = Decimal(str(lat)), Decimal(str(lng))
    except (InvalidOperation, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return lat.quantize(Decimal("0.000001")), lng.quantize(Decimal("0.000001"))


def straight_line_km(lat1, lng1, lat2, lng2):
    lat1, lng1, lat2, lng2 = (math.radians(float(v)) for v in (lat1, lng1, lat2, lng2))
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def road_km(lat1, lng1, lat2, lng2):
    """Driving distance in km from Google Routes, or None if unavailable."""
    key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")
    if not key:
        return None
    body = {
        "origin": {"location": {"latLng": {"latitude": float(lat1), "longitude": float(lng1)}}},
        "destination": {"location": {"latLng": {"latitude": float(lat2), "longitude": float(lng2)}}},
        "travelMode": "DRIVE",
    }
    request = urllib.request.Request(
        ROUTES_URL,
        data=json.dumps(body).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "routes.distanceMeters",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            data = json.loads(response.read().decode())
        meters = (data.get("routes") or [{}])[0].get("distanceMeters")
        return meters / 1000 if meters else None
    except Exception:  # network/API errors fall back to straight-line distance
        logger.warning("Google Routes distance failed", exc_info=True)
        return None


def is_configured(hub=None, ranges=None):
    hub = hub or DeliverySettings.load()
    if ranges is None:
        ranges = DeliveryFeeRange.objects.exists()
    return hub.latitude is not None and hub.longitude is not None and bool(ranges)


def quote(lat, lng):
    """Delivery quote for a customer location.

    Returns {"configured", "deliverable", "distance_km", "fee", "max_km"}.
    """
    hub = DeliverySettings.load()
    ranges = list(DeliveryFeeRange.objects.order_by("min_km", "max_km"))
    if not is_configured(hub, ranges):
        return {"configured": False, "deliverable": True, "distance_km": None, "fee": Decimal("0"), "max_km": None}

    distance = road_km(hub.latitude, hub.longitude, lat, lng)
    if distance is None:
        distance = straight_line_km(hub.latitude, hub.longitude, lat, lng)
    distance = Decimal(str(round(distance, 2)))
    max_km = max(r.max_km for r in ranges)
    match = next((r for r in ranges if r.min_km <= distance <= r.max_km), None)
    if match is None and distance < ranges[0].min_km:
        match = ranges[0]  # closer than the first band starts: cheapest fee
    return {
        "configured": True,
        "deliverable": match is not None,
        "distance_km": distance,
        "fee": match.fee if match else None,
        "max_km": max_km,
    }


def _money(value):
    return str(value) if value is not None else None


@csrf_exempt
def delivery_quote_view(request):
    """Public: GET ?lat=&lng= -> distance and delivery fee from our main store."""
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    coords = parse_coordinates(request.GET.get("lat"), request.GET.get("lng"))
    if coords is None:
        return JsonResponse({"error": "Share a valid location."}, status=400)
    result = quote(*coords)
    return JsonResponse(
        {
            "configured": result["configured"],
            "deliverable": result["deliverable"],
            "distance_km": _money(result["distance_km"]),
            "fee": _money(result["fee"]),
            "max_km": _money(result["max_km"]),
            "currency": "TZS",
        }
    )


STATIC_MAP_URL = "https://maps.googleapis.com/maps/api/staticmap"


def delivery_map_view(request):
    """Public: GET ?lat=&lng= -> PNG map with the customer's pin.

    The mobile app shows this on its location step; fetching it here keeps the
    Google key on the server.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    coords = parse_coordinates(request.GET.get("lat"), request.GET.get("lng"))
    key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")
    if coords is None or not key:
        return JsonResponse({"error": "Map not available."}, status=404)
    lat, lng = coords
    params = urllib.parse.urlencode({
        "center": f"{lat},{lng}",
        "zoom": "16",
        "size": "640x400",
        "scale": "2",
        "markers": f"color:0xFF5A14|{lat},{lng}",
        "key": key,
    })
    try:
        with urllib.request.urlopen(f"{STATIC_MAP_URL}?{params}", timeout=8) as response:
            image = response.read()
            content_type = response.headers.get("Content-Type", "image/png")
    except Exception:
        logger.warning("Google Static Maps failed", exc_info=True)
        return JsonResponse({"error": "Map not available."}, status=502)
    result = HttpResponse(image, content_type=content_type)
    result["Cache-Control"] = "public, max-age=86400"
    return result


def _settings_payload():
    hub = DeliverySettings.load()
    ranges = DeliveryFeeRange.objects.order_by("min_km", "max_km")
    return {
        "success": True,
        "hub": {
            "name": hub.hub_name,
            "address": hub.hub_address,
            "latitude": _money(hub.latitude),
            "longitude": _money(hub.longitude),
            "updated_at": hub.updated_at.isoformat() if hub.updated_at else None,
        },
        "ranges": [
            {"id": str(r.id), "min_km": str(r.min_km), "max_km": str(r.max_km), "fee": str(r.fee)}
            for r in ranges
        ],
        "configured": is_configured(hub),
        "road_distance": bool(getattr(settings, "GOOGLE_MAPS_API_KEY", "")),
    }


def _decimal(value, field):
    try:
        number = Decimal(str(value).replace(",", "").strip())
    except (InvalidOperation, ValueError):
        raise ValueError(f"Enter a valid {field}.")
    if not number.is_finite() or number < 0:
        raise ValueError(f"Enter a valid {field}.")
    return number


@csrf_exempt
def admin_delivery_view(request):
    """Admin: GET the main store location and km price ranges; PUT to replace them.

    PUT body: {"hub": {"name", "address", "latitude", "longitude"},
               "ranges": [{"min_km", "max_km", "fee"}, ...]}
    """
    if not _is_admin(request.user):
        return JsonResponse({"error": "Forbidden"}, status=403)
    if request.method == "GET":
        return JsonResponse(_settings_payload())
    if request.method != "PUT":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    hub_data = data.get("hub") or {}
    coords = parse_coordinates(hub_data.get("latitude"), hub_data.get("longitude"))
    if coords is None and (hub_data.get("latitude") not in (None, "") or hub_data.get("longitude") not in (None, "")):
        return JsonResponse({"error": "The main store location is not valid."}, status=400)

    ranges = []
    try:
        for item in data.get("ranges") or []:
            min_km = _decimal(item.get("min_km"), "from km")
            max_km = _decimal(item.get("max_km"), "to km")
            fee = _decimal(item.get("fee"), "fee")
            if max_km <= min_km:
                raise ValueError(f"Range {min_km}-{max_km} km: 'to' must be more than 'from'.")
            if max_km > MAX_KM or fee > Decimal("9999999999"):
                raise ValueError("A range or fee is too large.")
            ranges.append((min_km, max_km, fee))
    except ValueError as exc:
        return JsonResponse({"error": str(exc)}, status=400)

    ranges.sort()
    for (a_min, a_max, _), (b_min, b_max, _) in zip(ranges, ranges[1:]):
        if b_min < a_max:
            return JsonResponse(
                {"error": f"Ranges {a_min}-{a_max} km and {b_min}-{b_max} km overlap."}, status=400
            )

    with transaction.atomic():
        hub = DeliverySettings.load()
        hub.hub_name = (hub_data.get("name") or "").strip()[:120]
        hub.hub_address = (hub_data.get("address") or "").strip()[:255]
        hub.latitude, hub.longitude = coords if coords else (None, None)
        hub.updated_by = request.user
        hub.save()
        DeliveryFeeRange.objects.all().delete()
        DeliveryFeeRange.objects.bulk_create(
            DeliveryFeeRange(min_km=a, max_km=b, fee=f) for a, b, f in ranges
        )

    return JsonResponse(_settings_payload())
