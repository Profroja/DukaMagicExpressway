import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from auths.models import UserRole
from auths.views import _generate_password, _is_admin
from catalog.models import ListingType
from .models import (
    BOTH_ROOT,
    GOODS_ROOT,
    SERVICES_ROOT,
    Store,
    StoreCategory,
    StoreStatus,
    listing_type_for_category,
)

User = get_user_model()


def _admin_store_payload(store):
    listings = list(store.listings.all())
    product_count = sum(
        1 for l in listings if l.listing_type == ListingType.PRODUCT
    )
    service_count = sum(
        1 for l in listings if l.listing_type == ListingType.SERVICE
    )
    owner = store.owner
    return {
        "id": str(store.pk),
        "name": store.name,
        "slug": store.slug,
        "status": store.status,
        "location_name": store.location_name,
        "listing_kind": store.listing_kind,
        "category": store.category.name if store.category_id else "",
        "additional_categories": [c.name for c in store.categories.all()],
        "rating_avg": str(store.rating_avg),
        "rating_count": store.rating_count,
        "created_at": store.created_at.isoformat() if store.created_at else None,
        "owner": {
            "name": owner.get_full_name() or owner.get_username(),
            "phone_number": owner.phone_number,
            "email": owner.email or "",
        },
        "listing_types": {
            "products": product_count,
            "services": service_count,
            "total": len(listings),
        },
        "listings": [
            {
                "id": str(l.pk),
                "title": l.title,
                "listing_type": l.listing_type,
                "is_active": l.is_active,
            }
            for l in listings
        ],
    }


def _store_queryset():
    return Store.objects.select_related("owner", "category").prefetch_related(
        "categories", "listings"
    )


def _root_category(name):
    category, _ = StoreCategory.objects.get_or_create(
        name__iexact=name, parent__isnull=True, defaults={"name": name}
    )
    return category


def _create_store(request, data):
    """Admin creates a store and its vendor owner account.

    Body: name, location_name, category_type ("goods"|"services"|"both"),
    categories [names], owner_name, owner_phone, owner_email?, owner_password?
    (generated when blank and returned once).
    """
    name = (data.get("name") or "").strip()
    location_name = (data.get("location_name") or "").strip()
    category_type = (data.get("category_type") or "").strip().lower()
    selected = data.get("categories") or []
    owner_name = (data.get("owner_name") or "").strip()
    owner_phone = (data.get("owner_phone") or "").strip()
    owner_email = (data.get("owner_email") or "").strip().lower() or None
    owner_password = data.get("owner_password") or ""

    if not name:
        return JsonResponse({"error": "Enter the store name."}, status=400)
    if len(location_name) > 255:
        return JsonResponse({"error": "Location name is too long."}, status=400)
    if category_type not in ("goods", "services", "both"):
        return JsonResponse({"error": "Choose what the store sells: goods, services or both."}, status=400)
    if not isinstance(selected, list) or not selected:
        return JsonResponse({"error": "Select at least one category."}, status=400)
    if not owner_name or not owner_phone:
        return JsonResponse({"error": "Enter the owner's name and phone number."}, status=400)
    if len(owner_phone) > 15:
        return JsonResponse({"error": "Phone number is too long."}, status=400)
    if owner_email:
        try:
            validate_email(owner_email)
        except ValidationError:
            return JsonResponse({"error": "Enter a valid owner email."}, status=400)

    # Reuse an existing account that has no store yet; never steal another store's owner.
    owner = User.objects.filter(phone_number=owner_phone).first()
    if owner and Store.objects.filter(owner=owner).exists():
        return JsonResponse({"error": "That phone number already owns a store."}, status=409)
    if owner_email and User.objects.filter(email__iexact=owner_email).exclude(
        pk=owner.pk if owner else None
    ).exists():
        return JsonResponse({"error": "An account with this email already exists."}, status=409)

    generated = False
    if not owner:
        if owner_password:
            try:
                validate_password(owner_password)
            except ValidationError as exc:
                return JsonResponse({"error": " ".join(exc.messages)}, status=400)
        else:
            owner_password = _generate_password()
            generated = True

    if category_type == "both":
        main_category = _root_category(BOTH_ROOT)
        parents = [_root_category(GOODS_ROOT), _root_category(SERVICES_ROOT)]
    else:
        main_category = _root_category(GOODS_ROOT if category_type == "goods" else SERVICES_ROOT)
        parents = [main_category]
    selected_categories = list(
        StoreCategory.objects.filter(parent__in=parents, name__in=selected).select_related("parent")
    )
    if not selected_categories:
        return JsonResponse({"error": "Select at least one valid category."}, status=400)
    if category_type == "both" and {listing_type_for_category(c) for c in selected_categories} != {
        "product",
        "service",
    }:
        return JsonResponse(
            {"error": "Select at least one goods category and one services category."}, status=400
        )

    with transaction.atomic():
        if owner is None:
            names = owner_name.split(maxsplit=1)
            owner = User.objects.create_user(
                phone_number=owner_phone,
                password=owner_password,
                email=owner_email,
                role=UserRole.VENDOR_OWNER,
                first_name=names[0],
                last_name=names[1] if len(names) > 1 else "",
                is_active=True,
                is_verified=True,
                email_verified=bool(owner_email),
                created_by=request.user,
            )
        elif owner.role == UserRole.CUSTOMER:
            owner.role = UserRole.VENDOR_OWNER
            owner.save(update_fields=["role"])

        store = Store.objects.create(
            owner=owner,
            name=name,
            location_name=location_name,
            category=main_category,
            # Created by an admin, so it goes live straight away.
            status=StoreStatus.APPROVED,
            approved_at=timezone.now(),
            approved_by=request.user,
            created_by=request.user,
            updated_by=request.user,
        )
        store.categories.set(selected_categories)

    store = _store_queryset().get(pk=store.pk)
    return JsonResponse(
        {
            "success": True,
            "store": _admin_store_payload(store),
            # Shown to the admin once so they can pass it to the owner.
            "owner_password": owner_password if generated else None,
        },
        status=201,
    )


@csrf_exempt
def admin_stores_view(request):
    """Admin: GET every store and what it provides; POST to create a store."""
    if not _is_admin(request.user):
        return JsonResponse({"error": "Forbidden"}, status=403)

    if request.method == "POST":
        try:
            data = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body"}, status=400)
        return _create_store(request, data)

    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    stores = _store_queryset().order_by("-created_at")

    items = [_admin_store_payload(store) for store in stores]
    total_products = sum(s["listing_types"]["products"] for s in items)
    total_services = sum(s["listing_types"]["services"] for s in items)
    return JsonResponse(
        {
            "success": True,
            "stores": items,
            "counts": {
                "total": len(items),
                "approved": sum(
                    1 for s in items if s["status"] == StoreStatus.APPROVED
                ),
                "pending": sum(
                    1 for s in items if s["status"] == StoreStatus.PENDING
                ),
                "suspended": sum(
                    1 for s in items if s["status"] == StoreStatus.SUSPENDED
                ),
                "rejected": sum(
                    1 for s in items if s["status"] == StoreStatus.REJECTED
                ),
                "products": total_products,
                "services": total_services,
            },
        }
    )


@csrf_exempt
def admin_store_update_view(request, store_id):
    """Admin: PATCH {"status": "approved"|"suspended"} and/or {"name", "location_name"}."""
    if not _is_admin(request.user):
        return JsonResponse({"error": "Forbidden"}, status=403)
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    try:
        store = _store_queryset().get(pk=store_id)
    except Store.DoesNotExist:
        return JsonResponse({"error": "Store not found."}, status=404)

    if "status" in data:
        status = data.get("status")
        if status not in (StoreStatus.APPROVED, StoreStatus.SUSPENDED):
            return JsonResponse(
                {"error": "Invalid status. Use 'approved' or 'suspended'."},
                status=400,
            )
        store.status = status
        if status == StoreStatus.APPROVED and store.approved_at is None:
            store.approved_at = timezone.now()
            store.approved_by = request.user

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse({"error": "Store name can't be empty."}, status=400)
        store.name = name[:255]
    if "location_name" in data:
        store.location_name = (data.get("location_name") or "").strip()[:255]

    store.updated_by = request.user
    store.save()

    return JsonResponse(
        {"success": True, "store": _admin_store_payload(store)}
    )
