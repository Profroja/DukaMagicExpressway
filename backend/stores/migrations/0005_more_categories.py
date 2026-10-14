"""Broad worldwide category list (food, any goods, any service).

Existing categories are kept; only missing ones are added. Keep in sync with
stores/categories.py.
"""
from django.db import migrations

GOODS = [
    "Food & Drinks", "Groceries", "Fresh Produce", "Meat, Fish & Poultry", "Bakery & Snacks",
    "Beverages", "Electronics", "Phones & Tablets", "Computers & Accessories", "TV, Audio & Video",
    "Home Appliances", "Fashion", "Shoes & Bags", "Jewelry & Watches", "Beauty & Health",
    "Pharmacy & Medical Supplies", "Baby & Kids", "Toys & Games", "Home & Living", "Furniture",
    "Kitchen & Dining", "Building & Hardware", "Tools & Equipment", "Agriculture & Farming",
    "Automotive", "Motorcycles & Bicycles", "Sports & Outdoors", "Books & Stationery",
    "Office Supplies", "Pet Supplies", "Gifts & Crafts", "Art & Collectibles",
    "Musical Instruments", "Energy & Solar", "Industrial & Business", "Second-hand Items",
    "Other Goods",
]

SERVICES = [
    "Electronics Repair", "Home Repair & Maintenance", "Plumbing & Electrical",
    "Construction & Renovation", "Cleaning", "Laundry & Dry Cleaning", "Vehicle Services",
    "Car Hire", "Transport & Moving", "Delivery & Logistics", "Catering & Food", "Beauty & Spa",
    "Fitness & Wellness", "Health & Medical", "Education & Tutoring", "Professional Services",
    "Legal & Financial", "IT & Software", "Design & Printing", "Photography",
    "Events & Entertainment", "Travel & Tours", "Real Estate & Rentals", "Security Services",
    "Tailoring", "Pet Services", "Farming Services", "Other Services",
]


def seed(apps, schema_editor):
    StoreCategory = apps.get_model("stores", "StoreCategory")

    def root(name):
        found = StoreCategory.objects.filter(name__iexact=name, parent__isnull=True).first()
        return found or StoreCategory.objects.create(name=name, parent=None)

    for parent_name, names in (("Goods", GOODS), ("Services", SERVICES)):
        parent = root(parent_name)
        for name in names:
            if not StoreCategory.objects.filter(parent=parent, name__iexact=name).exists():
                StoreCategory.objects.create(name=name, parent=parent)


class Migration(migrations.Migration):

    dependencies = [
        ("stores", "0004_store_location_name"),
    ]

    operations = [
        migrations.RunPython(seed, migrations.RunPython.noop),
    ]
