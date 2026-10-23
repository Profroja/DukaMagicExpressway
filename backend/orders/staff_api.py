"""API for the mobile app's staff screens.

Staff sign in with their SokoLink account and get a token (the app sends it as
"Authorization: Bearer <token>"). The app lists the orders of the staff's
city and alerts them to new ones; they process orders on the website.
"""
import json

from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from auths.views import _handles_orders
from .cities import CITIES
from .models import QuickOrder, QuickOrderStatus
from .views import _primary_image_url, _visible_orders

User = get_user_model()

TOKEN_SALT = "dukahub-staff-app"
TOKEN_MAX_AGE = 60 * 60 * 24 * 60  # 60 days, then sign in again


def make_token(user):
    return signing.dumps({"u": str(user.pk)}, salt=TOKEN_SALT)


def user_from_request(request):
    """The staff/admin user behind the Bearer token, or None."""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        data = signing.loads(header[7:].strip(), salt=TOKEN_SALT, max_age=TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
    user = User.objects.filter(pk=data.get("u"), is_active=True).first()
    return user if user and _handles_orders(user) else None


def _profile(user):
    return {
        "name": user.get_full_name() or user.get_username(),
        "phone": user.phone_number,
        "role": user.role,
        "city": user.city,
    }


@csrf_exempt
def staff_login_view(request):
    """POST {"username": phone or email, "password"} -> {"token", "user"}."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)
    identifier = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not identifier or not password:
        return JsonResponse({"error": "Enter your phone number or email and password."}, status=400)

    user = authenticate(request, username=identifier, password=password)
    if user is None:
        matched = User.objects.filter(email__iexact=identifier).first()
        if matched:
            user = authenticate(request, username=matched.get_username(), password=password)
    if user is None or not user.is_active:
        return JsonResponse({"error": "Wrong phone/email or password."}, status=401)
    if not _handles_orders(user):
        return JsonResponse({"error": "This account is not a SokoLink staff account."}, status=403)
    return JsonResponse({"token": make_token(user), "user": _profile(user)})


def staff_me_view(request):
    user = user_from_request(request)
    if user is None:
        return JsonResponse({"error": "Please sign in again."}, status=401)
    return JsonResponse({"user": _profile(user)})


def _order_payload(order):
    status = QuickOrderStatus(order.status)
    return {
        "id": str(order.pk),
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "status": order.status,
        "status_label": str(status.label),
        "product_title": order.listing.title,
        "product_image": _primary_image_url(order.listing),
        "listing_type": order.listing.listing_type,
        "quantity": order.quantity,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "delivery_address": order.delivery_address,
        "latitude": str(order.delivery_latitude) if order.delivery_latitude is not None else None,
        "longitude": str(order.delivery_longitude) if order.delivery_longitude is not None else None,
        "distance_km": str(order.delivery_distance_km) if order.delivery_distance_km is not None else None,
        "total": str(order.total_amount),
        "delivery_fee": str(order.delivery_fee),
        "grand_total": str(order.total_amount + order.delivery_fee),
        "currency": order.currency,
        "city": order.city,
    }


def staff_orders_view(request):
    """GET: the latest orders this staff member handles (their city), newest first."""
    user = user_from_request(request)
    if user is None:
        return JsonResponse({"error": "Please sign in again."}, status=401)
    orders = (
        _visible_orders(user, QuickOrder.objects.select_related("listing").prefetch_related("listing__images"))
        .order_by("-created_at")[:60]
    )
    return JsonResponse({"user": _profile(user), "orders": [_order_payload(o) for o in orders]})


def cities_view(request):
    """GET: city names staff can be assigned to."""
    return JsonResponse({"cities": sorted(CITIES)})
