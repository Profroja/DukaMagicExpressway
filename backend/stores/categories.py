"""Store categories: the built-in list plus categories stores add themselves.

Stores can sell any kind of good (food included) or service, so the built-in
list is broad, and when nothing fits a store types its own category, which is
created under Goods or Services and offered to everyone after that.
"""
import re

from .models import BOTH_ROOT, GOODS_ROOT, SERVICES_ROOT, StoreCategory, listing_type_for_category

# Keep in sync with migration 0005_more_categories (migrations can't import this).
GOODS_CATEGORIES = [
    "Food & Drinks",
    "Groceries",
    "Fresh Produce",
    "Meat, Fish & Poultry",
    "Bakery & Snacks",
    "Beverages",
    "Electronics",
    "Phones & Tablets",
    "Computers & Accessories",
    "TV, Audio & Video",
    "Home Appliances",
    "Fashion",
    "Shoes & Bags",
    "Jewelry & Watches",
    "Beauty & Health",
    "Pharmacy & Medical Supplies",
    "Baby & Kids",
    "Toys & Games",
    "Home & Living",
    "Furniture",
    "Kitchen & Dining",
    "Building & Hardware",
    "Tools & Equipment",
    "Agriculture & Farming",
    "Automotive",
    "Motorcycles & Bicycles",
    "Sports & Outdoors",
    "Books & Stationery",
    "Office Supplies",
    "Pet Supplies",
    "Gifts & Crafts",
    "Art & Collectibles",
    "Musical Instruments",
    "Energy & Solar",
    "Industrial & Business",
    "Second-hand Items",
    "Other Goods",
]

SERVICE_CATEGORIES = [
    "Electronics Repair",
    "Home Repair & Maintenance",
    "Plumbing & Electrical",
    "Construction & Renovation",
    "Cleaning",
    "Laundry & Dry Cleaning",
    "Vehicle Services",
    "Car Hire",
    "Transport & Moving",
    "Delivery & Logistics",
    "Catering & Food",
    "Beauty & Spa",
    "Fitness & Wellness",
    "Health & Medical",
    "Education & Tutoring",
    "Professional Services",
    "Legal & Financial",
    "IT & Software",
    "Design & Printing",
    "Photography",
    "Events & Entertainment",
    "Travel & Tours",
    "Real Estate & Rentals",
    "Security Services",
    "Tailoring",
    "Pet Services",
    "Farming Services",
    "Other Services",
]

MAX_NEW_CATEGORIES = 5


class CategoryError(ValueError):
    pass


def root_category(name):
    category, _ = StoreCategory.objects.get_or_create(
        name__iexact=name, parent__isnull=True, defaults={"name": name}
    )
    return category


def clean_category_name(name):
    """Tidy a typed category name: single spaces, first letter capital, max 60 chars."""
    name = re.sub(r"\s+", " ", str(name or "")).strip()[:60]
    if len(name) < 2 or not re.search(r"[^\W\d_]", name):
        raise CategoryError("Category names need at least 2 letters.")
    return name[0].upper() + name[1:]


def add_category(kind, name, user=None):
    """Get or create a category under Goods ("goods") or Services ("services")."""
    parent = root_category(GOODS_ROOT if kind == "goods" else SERVICES_ROOT)
    name = clean_category_name(name)
    category = StoreCategory.objects.filter(parent=parent, name__iexact=name).first()
    if category is None:
        category = StoreCategory.objects.create(name=name, parent=parent, created_by=user, updated_by=user)
    return category


def allowed_kinds(category_type):
    return {"goods": ["goods"], "services": ["services"], "both": ["goods", "services"]}[category_type]


def resolve_store_categories(category_type, selected, new_categories=None, user=None):
    """Main category + chosen categories for a store.

    selected: names from the list; new_categories: [{"name", "type": "goods"|"services"}]
    typed by the store when nothing fits. Raises CategoryError with a user message.
    """
    if category_type not in ("goods", "services", "both"):
        raise CategoryError("Choose what the store sells: goods, services or both.")
    if not isinstance(selected, list) or not isinstance(new_categories or [], list):
        raise CategoryError("Select at least one category.")
    new_categories = new_categories or []
    if len(new_categories) > MAX_NEW_CATEGORIES:
        raise CategoryError(f"Add at most {MAX_NEW_CATEGORIES} new categories.")

    if category_type == "both":
        main = root_category(BOTH_ROOT)
        parents = [root_category(GOODS_ROOT), root_category(SERVICES_ROOT)]
    else:
        main = root_category(GOODS_ROOT if category_type == "goods" else SERVICES_ROOT)
        parents = [main]

    names = [str(n).strip() for n in selected if str(n).strip()]
    chosen = list(
        StoreCategory.objects.filter(parent__in=parents, name__in=names).select_related("parent")
    )
    kinds = allowed_kinds(category_type)
    for item in new_categories:
        if not isinstance(item, dict):
            raise CategoryError("Invalid new category.")
        kind = (item.get("type") or "").strip().lower()
        if kind not in kinds:
            raise CategoryError("A new category doesn't match what the store sells.")
        category = add_category(kind, item.get("name"), user)
        if category not in chosen:
            chosen.append(category)

    if not chosen:
        raise CategoryError("Select at least one category.")
    if category_type == "both" and {listing_type_for_category(c) for c in chosen} != {"product", "service"}:
        raise CategoryError("Select at least one goods category and one services category.")
    return main, chosen
