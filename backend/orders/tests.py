import json

from django.core import mail
from django.test import Client, TestCase, override_settings

from auths.models import User, UserRole
from catalog.models import Listing, ProductCategory
from stores.models import Store, StoreCategory, StoreStatus

from .models import PurchaseOrderStatus, QuickOrder, QuickOrderStatus, StorePurchaseOrder


class PlatformBuyerFlowTests(TestCase):
    """Customer -> admin -> store purchase order -> pickup -> delivery,
    with the store never seeing the customer's details."""

    def setUp(self):
        self.admin = User.objects.create_user("+255700000001", "pw", role=UserRole.ADMIN)
        self.vendor = User.objects.create_user("+255700000002", "pw", role=UserRole.VENDOR_OWNER)
        self.other_vendor = User.objects.create_user("+255700000003", "pw", role=UserRole.VENDOR_OWNER)

        store_cat = StoreCategory.objects.create(name="Electronics")
        product_cat = ProductCategory.objects.create(name="Phones")
        self.store = Store.objects.create(
            owner=self.vendor, name="Kariakoo Phones", category=store_cat, status=StoreStatus.APPROVED
        )
        self.other_store = Store.objects.create(
            owner=self.other_vendor, name="Mlimani Gadgets", category=store_cat, status=StoreStatus.APPROVED
        )
        self.listing = Listing.objects.create(
            store=self.store, category=product_cat, title="Samsung Galaxy A15",
            description="Phone", price="450000",
        )
        self.cheaper = Listing.objects.create(
            store=self.other_store, category=product_cat, title="Samsung Galaxy A15 128GB",
            description="Phone", price="420000",
        )

    def _json(self, method, url, user=None, body=None):
        if user:
            self.client.force_login(user)
        else:
            self.client.logout()
        if method == "get":
            return self.client.get(url)
        return getattr(self.client, method)(
            url, data=json.dumps(body or {}), content_type="application/json"
        )

    def _place_customer_order(self):
        res = self._json("post", "/api/orders/quick/", body={
            "listing_id": str(self.listing.pk), "quantity": 2,
            "name": "Amina Juma", "phone": "0712345678", "address": "Sinza, Dar",
        })
        self.assertEqual(res.status_code, 201)
        self.assertNotIn("store", res.json())
        return res.json()["order_id"]

    def test_full_flow_hides_customer_from_vendor(self):
        """Admin/staff do every step themselves: buy, pay the store, pick up, deliver."""
        order_id = self._place_customer_order()

        # Vendor sees nothing until the admin buys from them.
        res = self._json("get", "/api/vendor/orders/", self.vendor)
        self.assertEqual(res.json()["orders"], [])

        # Admin sees the customer and sourcing options, original listing first.
        res = self._json("get", "/api/admin/orders/", self.admin)
        self.assertEqual(res.json()["orders"][0]["customer_phone"], "0712345678")
        res = self._json("get", f"/api/admin/orders/{order_id}/sourcing/", self.admin)
        options = res.json()["options"]
        self.assertEqual(options[0]["listing_id"], str(self.listing.pk))
        self.assertIn(str(self.cheaper.pk), [o["listing_id"] for o in options])
        self.assertEqual(options[0]["store_phone"], "+255700000002")

        # Admin buys from the cheaper store at the price agreed with it: no store approval needed.
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.cheaper.pk), "unit_price": "415000"})
        self.assertEqual(res.status_code, 201)
        order = res.json()["order"]
        self.assertEqual(order["status"], QuickOrderStatus.SOURCING)
        self.assertEqual(order["margin"], "70000.00")
        po = order["purchase_orders"][0]
        self.assertEqual((po["status"], po["price_status"], po["payment_status"]), ("accepted", "agreed", "unpaid"))
        po_id = res.json()["purchase_order_id"]

        # The store's record shows SokoLink as buyer, never the customer.
        raw = json.dumps(self._json("get", "/api/vendor/orders/", self.other_vendor).json())
        self.assertIn("SokoLink", raw)
        for secret in ("Amina", "0712345678", "Sinza", order_id):
            self.assertNotIn(secret, raw)

        # Pick-up waits for the payment to the store, recorded by the admin.
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"status": "picked_up"})
        self.assertEqual(res.status_code, 400)
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin,
                         {"payment": {"amount": "830,000", "method": "bitcoin"}})
        self.assertEqual(res.status_code, 400)
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin,
                         {"payment": {"amount": "830,000", "method": "mpesa", "reference": "QJ12AB34"}})
        self.assertEqual(res.status_code, 200, res.content)
        po = res.json()["order"]["purchase_orders"][0]
        self.assertEqual((po["payment_status"], po["amount_received"]), ("paid", "830000.00"))
        self.assertEqual((po["payment_method"], po["payment_reference"]), ("mpesa", "QJ12AB34"))
        # Paid once only.
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin,
                         {"payment": {"amount": "1", "method": "cash"}})
        self.assertEqual(res.status_code, 400)

        # Pick up, deliver, close.
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"status": "picked_up"})
        self.assertEqual(res.json()["order"]["status"], QuickOrderStatus.PICKED_UP)
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "delivered"})
        self.assertEqual(res.json()["order"]["status"], QuickOrderStatus.DELIVERED)
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin,
                         {"status": "closed", "amount_paid": "900000"})
        self.assertEqual(res.json()["order"]["status"], QuickOrderStatus.CLOSED)
        self.assertEqual(self.client.get(f"/api/orders/quick/{order_id}/").json()["status"], "delivered")

    def test_rejection_returns_order_to_admin_queue(self):
        order_id = self._place_customer_order()
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk)})
        po_id = res.json()["purchase_order_id"]

        # Only one active purchase order at a time.
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.cheaper.pk)})
        self.assertEqual(res.status_code, 400)

        self._json("patch", "/api/vendor/orders/", self.vendor,
                   {"order_id": po_id, "status": "rejected", "note": "Out of stock"})
        self.assertEqual(QuickOrder.objects.get(pk=order_id).status, QuickOrderStatus.CONFIRMED)

        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.cheaper.pk)})
        self.assertEqual(res.status_code, 201)

    def test_cancelling_customer_order_cancels_store_po(self):
        order_id = self._place_customer_order()
        self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                   {"listing_id": str(self.listing.pk)})
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "cancelled"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            StorePurchaseOrder.objects.get(customer_order_id=order_id).status,
            PurchaseOrderStatus.CANCELLED,
        )

    def test_vendor_cannot_mark_paid_before_accepting(self):
        order_id = self._place_customer_order()
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk)})
        po_id = res.json()["purchase_order_id"]
        res = self._json("patch", "/api/vendor/orders/", self.vendor,
                         {"order_id": po_id, "payment_status": "paid"})
        self.assertEqual(res.status_code, 400)

    def test_subscription_plans(self):
        from subscriptions.models import SubscriptionInvoice
        from subscriptions.views import _current_month

        # Free stores cannot be billed and the vendor sees their plan.
        res = self._json("post", "/api/admin/revenue/", self.admin, {
            "month": _current_month().isoformat(),
            "entries": [{"store_id": str(self.store.pk), "amount": "20000"}],
        })
        self.assertEqual(res.status_code, 400)
        sub = self._json("get", "/api/vendor/dashboard/", self.vendor).json()["subscription"]
        self.assertEqual(sub["plan"], "free")

        # Admin switches the store to monthly; it can now be billed.
        res = self._json("patch", f"/api/admin/revenue/stores/{self.store.pk}/plan/", self.admin,
                         {"plan": "monthly", "monthly_fee": "25000"})
        self.assertEqual(res.status_code, 200, res.content)
        res = self._json("post", "/api/admin/revenue/", self.admin, {
            "month": _current_month().isoformat(),
            "entries": [{"store_id": str(self.store.pk), "amount": "25000"}],
        })
        self.assertEqual(res.status_code, 200)
        dash = self._json("get", "/api/vendor/dashboard/", self.vendor).json()
        self.assertEqual(dash["subscription"]["plan"], "monthly")
        self.assertEqual(dash["subscription"]["monthly_fee"], "25000.00")
        self.assertEqual(dash["subscription"]["status"], "unpaid")
        self.assertEqual(dash["summary"]["platform_subscription"], "Monthly plan")

        # Unpaid monthly store is hidden; switching to free makes it visible again.
        def visible():
            res = self.client.get("/api/catalog/")
            return str(self.listing.pk) in res.content.decode()
        self.assertFalse(visible())
        self._json("patch", f"/api/admin/revenue/stores/{self.store.pk}/plan/", self.admin, {"plan": "free"})
        self.assertTrue(visible())
        self.assertEqual(SubscriptionInvoice.objects.filter(store=self.store).count(), 1)

        # Vendors cannot change plans.
        res = self._json("patch", f"/api/admin/revenue/stores/{self.store.pk}/plan/", self.vendor, {"plan": "free"})
        self.assertEqual(res.status_code, 403)

    @override_settings(ORDER_EMAILS_ASYNC=False, ORDER_NOTIFY_EMAILS=[])
    def test_order_emails(self):
        """Admins hear about new orders; stores get no emails (staff do the buying)."""
        self.admin.email = "boss@example.com"
        self.admin.save()
        self.other_vendor.email = "gadgets@example.com"
        self.other_vendor.save()

        def emails_during(fn):
            mail.outbox.clear()
            with self.captureOnCommitCallbacks(execute=True):
                result = fn()
            return result, list(mail.outbox)

        order_id, sent = emails_during(self._place_customer_order)
        self.assertEqual([m.to for m in sent], [["boss@example.com"]])
        self.assertIn("0712345678", sent[0].body)

        res, sent = emails_during(lambda: self._json(
            "post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
            {"listing_id": str(self.cheaper.pk)},
        ))
        po_id = res.json()["purchase_order_id"]
        self.assertEqual(sent, [])
        _, sent = emails_during(lambda: self._json(
            "patch", f"/api/admin/purchase-orders/{po_id}/", self.admin,
            {"payment": {"amount": "420000", "method": "cash"}}))
        self.assertEqual(sent, [])
        _, sent = emails_during(lambda: self._json(
            "patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "cancelled"}))
        self.assertEqual(sent, [])

    @override_settings(ORDER_EMAILS_ASYNC=False, ORDER_NOTIFY_EMAILS=["Owner@Example.com"])
    def test_configured_email_replaces_admin_accounts(self):
        self.admin.email = "boss@example.com"
        self.admin.save()
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            self._place_customer_order()
        self.assertEqual([m.to for m in mail.outbox], [["owner@example.com"]])

    def test_admin_changes_negotiated_price(self):
        order_id = self._place_customer_order()
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk)})
        po_id = res.json()["purchase_order_id"]

        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"unit_price": "430,000"})
        self.assertEqual(res.status_code, 200, res.content)
        po = self._json("get", "/api/vendor/orders/", self.vendor).json()["orders"][0]
        self.assertEqual((po["unit_price"], po["total"], po["listing_price"]),
                         ("430000.00", "860000.00", "450000.00"))

        # Locked once the store has been paid.
        self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin,
                   {"payment": {"amount": "860000", "method": "cash"}})
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"unit_price": "1"})
        self.assertEqual(res.status_code, 400)

    @override_settings(ORDER_EMAILS_ASYNC=False, ORDER_NOTIFY_EMAILS=["owner@example.com"])
    def test_admin_deletes_order_with_purchase_orders(self):
        self.vendor.email = "kariakoo@example.com"
        self.vendor.save()
        order_id = self._place_customer_order()
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk)})
        po_id = res.json()["purchase_order_id"]

        # Vendors cannot delete.
        self.assertEqual(self._json("delete", f"/api/admin/orders/{order_id}/", self.vendor).status_code, 403)

        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            res = self._json("delete", f"/api/admin/orders/{order_id}/", self.admin)
        self.assertEqual(res.status_code, 200, res.content)
        self.assertFalse(QuickOrder.objects.filter(pk=order_id).exists())
        self.assertFalse(StorePurchaseOrder.objects.filter(pk=po_id).exists())
        self.assertEqual(self._json("get", "/api/vendor/orders/", self.vendor).json()["orders"], [])
        # Stores are not involved in buying, so they get no email.
        self.assertEqual(mail.outbox, [])

    def test_service_booking_price_negotiation(self):
        """Bookings: the admin sets both prices; the provider's price can be corrected before paying."""
        order_id = self._place_customer_order()
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"customer_total": "1,000,000"})
        self.assertEqual(res.json()["order"]["total"], "1000000.00")

        # A price is required (no waiting on the provider for a quote).
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk), "unit_price": "0"})
        self.assertEqual(res.status_code, 400)
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk), "unit_price": "450000"})
        self.assertEqual(res.status_code, 201, res.content)
        po_id = res.json()["purchase_order_id"]

        # Correcting the price keeps it agreed.
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"unit_price": "460000"})
        po = res.json()["order"]["purchase_orders"][0]
        self.assertEqual((po["price_status"], po["total"]), ("agreed", "920000.00"))
        self.assertEqual(res.json()["order"]["margin"], "80000.00")

        # After paying, the price is locked.
        self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin,
                   {"payment": {"amount": "920000", "method": "bank"}})
        res = self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"unit_price": "1"})
        self.assertEqual(res.status_code, 400)

    def test_customer_choice_from_pending_store_can_be_booked(self):
        """What customers can order, the admin can buy from the same store."""
        self.store.status = StoreStatus.PENDING
        self.store.save()
        order_id = self._place_customer_order()  # public ordering allows pending stores

        options = self._json("get", f"/api/admin/orders/{order_id}/sourcing/", self.admin).json()
        first = options["options"][0]
        self.assertTrue(first["is_original"])
        self.assertEqual(first["store_status"], "pending")
        self.assertIsNone(options["original_unavailable"])

        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk)})
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(len(self._json("get", "/api/vendor/orders/", self.vendor).json()["orders"]), 1)

    def test_admin_told_when_customer_choice_unavailable(self):
        order_id = self._place_customer_order()
        self.store.status = StoreStatus.SUSPENDED
        self.store.save()
        options = self._json("get", f"/api/admin/orders/{order_id}/sourcing/", self.admin).json()
        self.assertNotIn(str(self.listing.pk), [o["listing_id"] for o in options["options"]])
        self.assertEqual(options["original_unavailable"]["store"], "Kariakoo Phones")
        self.assertIn("suspended", options["original_unavailable"]["reason"])

    def test_monthly_finance_summary(self):
        from subscriptions.models import SubscriptionInvoice
        from subscriptions.views import _current_month

        # Customer pays 900,000; we pay the store 830,000 (store says it received 800,000).
        order_id = self._place_customer_order()
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.cheaper.pk), "unit_price": "415000"})
        po_id = res.json()["purchase_order_id"]
        self._json("patch", "/api/vendor/orders/", self.other_vendor, {"order_id": po_id, "status": "accepted"})
        self._json("patch", "/api/vendor/orders/", self.other_vendor,
                   {"order_id": po_id, "payment_status": "paid", "amount_received": "800000"})

        month = _current_month().strftime("%Y-%m")
        summary = self._json("get", f"/api/admin/finance/?month={month}", self.admin).json()["summary"]
        # Paid to the store already counts; the order isn't delivered so no customer money yet.
        self.assertEqual(summary["paid_to_vendors"], "800000.00")
        self.assertEqual(summary["received_from_customers"], "0")
        self.assertEqual(summary["delivered_orders"], 0)

        self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"status": "picked_up"})
        self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "delivered"})
        # Delivered but not closed: no customer money counted yet.
        pending = self._json("get", f"/api/admin/finance/?month={month}", self.admin).json()["summary"]
        self.assertEqual((pending["received_from_customers"], pending["awaiting_close"]), ("0", 1))
        self._json("patch", f"/api/admin/orders/{order_id}/", self.admin,
                   {"status": "closed", "amount_paid": "900000"})
        SubscriptionInvoice.objects.create(
            store=self.store, period_month=_current_month(), amount="25000", status="paid"
        )

        data = self._json("get", f"/api/admin/finance/?month={month}", self.admin).json()
        s = data["summary"]
        self.assertEqual(s["received_from_customers"], "900000.00")
        self.assertEqual(s["order_profit"], "100000.00")
        self.assertEqual(s["subscription_income"], "25000.00")
        self.assertEqual(s["total_revenue"], "125000.00")
        self.assertEqual(data["orders"][0]["stores"], ["Mlimani Gadgets"])

        # Another month is empty; vendors are forbidden.
        empty = self._json("get", "/api/admin/finance/?month=2020-01", self.admin).json()["summary"]
        self.assertEqual(empty["total_revenue"], "0")
        self.assertEqual(self._json("get", "/api/admin/finance/", self.vendor).status_code, 403)

    def test_closing_records_exact_amount_customer_paid(self):
        from subscriptions.views import _current_month

        order_id = self._place_customer_order()  # starting price 900,000
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk), "unit_price": "470000"})
        po_id = res.json()["purchase_order_id"]
        self._json("patch", "/api/vendor/orders/", self.vendor, {"order_id": po_id, "status": "accepted"})
        self._json("patch", "/api/vendor/orders/", self.vendor,
                   {"order_id": po_id, "payment_status": "paid", "amount_received": "940000"})
        self._json("patch", f"/api/admin/purchase-orders/{po_id}/", self.admin, {"status": "picked_up"})

        # Can't close before delivery, nor close without the amount.
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin,
                         {"status": "closed", "amount_paid": "1000000"})
        self.assertEqual(res.status_code, 400)
        self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "delivered"})
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "closed"})
        self.assertEqual(res.status_code, 400)
        # A delivered order can't go anywhere but closed.
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "cancelled"})
        self.assertEqual(res.status_code, 400)

        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin,
                         {"status": "closed", "amount_paid": "1,000,000"})
        order = res.json()["order"]
        self.assertEqual((order["status"], order["amount_paid"], order["margin"]),
                         ("closed", "1000000.00", "60000.00"))
        month = _current_month().strftime("%Y-%m")
        s = self._json("get", f"/api/admin/finance/?month={month}", self.admin).json()["summary"]
        self.assertEqual((s["received_from_customers"], s["order_profit"], s["awaiting_close"]),
                         ("1000000.00", "60000.00", 0))

        # The customer still just sees "delivered".
        self.assertEqual(self.client.get(f"/api/orders/quick/{order_id}/").json()["status"], "delivered")

        # A wrong amount can be corrected on the closed order; agreed price is locked.
        self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"amount_paid": "990000"})
        s = self._json("get", f"/api/admin/finance/?month={month}", self.admin).json()["summary"]
        self.assertEqual(s["order_profit"], "50000.00")
        res = self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"customer_total": "1"})
        self.assertEqual(res.status_code, 400)

    def test_admin_dashboard(self):
        order_id = self._place_customer_order()
        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"listing_id": str(self.listing.pk)})
        po_id = res.json()["purchase_order_id"]
        self._json("patch", "/api/vendor/orders/", self.vendor, {"order_id": po_id, "status": "accepted"})

        data = self._json("get", "/api/admin/dashboard/", self.admin).json()
        cards = data["cards"]
        self.assertEqual(cards["stores_total"], 2)
        self.assertEqual(cards["customers"], 1)
        self.assertEqual(cards["orders_this_month"], 1)
        self.assertEqual(cards["orders_at_stores"], 1)
        # Accepted but not paid yet -> we owe the store the agreed total.
        self.assertEqual(cards["owed_to_vendors"], "900000.00")
        self.assertEqual(len(data["stats"]["monthly"]), 6)
        self.assertEqual(sum(d["orders"] for d in data["stats"]["daily_orders"]), 1)
        self.assertEqual(
            {s["status"]: s["orders"] for s in data["stats"]["orders_by_status"]}["sourcing"], 1
        )
        self.assertEqual(self._json("get", "/api/admin/dashboard/", self.vendor).status_code, 403)

    def test_vendor_cannot_touch_admin_endpoints(self):
        order_id = self._place_customer_order()
        self.assertEqual(self._json("get", "/api/admin/orders/", self.vendor).status_code, 403)
        self.assertEqual(
            self._json("get", f"/api/admin/orders/{order_id}/sourcing/", self.vendor).status_code, 403
        )


@override_settings(GOOGLE_MAPS_API_KEY="")  # straight-line distance, no network calls
class DeliveryFeeTests(TestCase):
    # Main store at Kariakoo; customer ~4.5 km away at Sinza, ~43 km away at Bagamoyo road.
    HUB = {"latitude": "-6.818900", "longitude": "39.277000"}
    NEAR = {"latitude": "-6.780000", "longitude": "39.265000"}
    FAR = {"latitude": "-6.440000", "longitude": "38.900000"}

    def setUp(self):
        self.admin = User.objects.create_user("+255700000101", "pw", role=UserRole.ADMIN)
        vendor = User.objects.create_user("+255700000102", "pw", role=UserRole.VENDOR_OWNER)
        store = Store.objects.create(
            owner=vendor, name="Kariakoo Phones",
            category=StoreCategory.objects.create(name="Electronics"), status=StoreStatus.APPROVED,
        )
        self.listing = Listing.objects.create(
            store=store, category=ProductCategory.objects.create(name="Phones"),
            title="Tecno Spark", description="Phone", price="300000",
        )

    def _post(self, url, body, method="post"):
        return getattr(self.client, method)(url, data=json.dumps(body), content_type="application/json")

    def _configure(self):
        self.client.force_login(self.admin)
        res = self._post("/api/admin/delivery/", {
            "hub": {"name": "Main store", "address": "Kariakoo", **self.HUB},
            "ranges": [
                {"min_km": "5", "max_km": "15", "fee": "5000"},
                {"min_km": "0", "max_km": "5", "fee": "2000"},
            ],
        }, method="put")
        self.assertEqual(res.status_code, 200, res.content)
        self.client.logout()
        return res.json()

    def _order(self, **coords):
        return self._post("/api/orders/quick/", {
            "listing_id": str(self.listing.pk), "quantity": 2,
            "name": "Amina", "phone": "0712345678", **coords,
        })

    def test_orders_work_without_delivery_setup(self):
        res = self._order()
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.json()["delivery_fee"], "0.00")

    def test_admin_settings_and_validation(self):
        data = self._configure()
        self.assertTrue(data["configured"])
        self.assertEqual([r["min_km"] for r in data["ranges"]], ["0.00", "5.00"])

        self.client.force_login(self.admin)
        overlap = self._post("/api/admin/delivery/", {
            "hub": self.HUB,
            "ranges": [{"min_km": 0, "max_km": 10, "fee": 1}, {"min_km": 5, "max_km": 20, "fee": 2}],
        }, method="put")
        self.assertEqual(overlap.status_code, 400)
        backwards = self._post("/api/admin/delivery/", {
            "hub": self.HUB, "ranges": [{"min_km": 10, "max_km": 5, "fee": 1}],
        }, method="put")
        self.assertEqual(backwards.status_code, 400)

        vendor = User.objects.get(phone_number="+255700000102")
        self.client.force_login(vendor)
        self.assertEqual(self.client.get("/api/admin/delivery/").status_code, 403)

    def test_quote_and_order_charge_delivery_fee(self):
        self._configure()
        quote = self.client.get("/api/delivery/quote/", {"lat": self.NEAR["latitude"], "lng": self.NEAR["longitude"]})
        self.assertEqual(quote.status_code, 200)
        self.assertTrue(quote.json()["deliverable"])
        self.assertEqual(quote.json()["fee"], "2000.00")

        res = self._order(**self.NEAR)
        self.assertEqual(res.status_code, 201, res.content)
        body = res.json()
        self.assertEqual(body["delivery_fee"], "2000.00")
        self.assertEqual(body["grand_total"], "602000.00")
        order = QuickOrder.objects.get(pk=body["order_id"])
        self.assertEqual(str(order.delivery_latitude), self.NEAR["latitude"])
        self.assertGreater(order.delivery_distance_km, 0)

        self.client.force_login(self.admin)
        listed = self.client.get("/api/admin/orders/").json()["orders"][0]
        self.assertEqual(listed["delivery_fee"], "2000.00")
        self.assertEqual(listed["delivery_longitude"], self.NEAR["longitude"])

    def test_location_required_and_range_limit(self):
        self._configure()
        self.assertEqual(self._order().status_code, 400)  # no location shared
        far = self._order(**self.FAR)
        self.assertEqual(far.status_code, 400)
        self.assertIn("15 km", far.json()["error"])
        self.assertFalse(
            self.client.get("/api/delivery/quote/", {"lat": self.FAR["latitude"], "lng": self.FAR["longitude"]}).json()["deliverable"]
        )

    def test_map_image_needs_key_and_valid_point(self):
        # No GOOGLE_MAPS_API_KEY in tests: no map, and bad points are refused.
        self.assertEqual(self.client.get("/api/delivery/map/", {"lat": "-6.78", "lng": "39.26"}).status_code, 404)
        self.assertEqual(self.client.get("/api/delivery/map/", {"lat": "x", "lng": "39.26"}).status_code, 404)


class SendToKnownStoreTests(TestCase):
    """The admin types a store they know and sends it the order directly."""

    setUp = PlatformBuyerFlowTests.setUp
    _json = PlatformBuyerFlowTests._json
    _place_customer_order = PlatformBuyerFlowTests._place_customer_order

    def test_search_and_send_to_store_without_the_listing(self):
        order_id = self._place_customer_order()
        self._json("patch", f"/api/admin/orders/{order_id}/", self.admin, {"status": "confirmed"})

        found = self._json("get", "/api/admin/stores/search/?q=mlimani", self.admin).json()["stores"]
        self.assertEqual([s["name"] for s in found], ["Mlimani Gadgets"])
        self.assertEqual(found[0]["phone"], "+255700000003")

        res = self._json("post", f"/api/admin/orders/{order_id}/purchase-orders/", self.admin,
                         {"store_id": found[0]["id"], "unit_price": "430000"})
        self.assertEqual(res.status_code, 201, res.content)
        po = StorePurchaseOrder.objects.get(customer_order_id=order_id)
        self.assertEqual(po.store, self.other_store)
        self.assertEqual(po.listing, self.listing)  # the customer's product

        # The store sees our offer, never the other store's listed price.
        vendor_view = self._json("get", "/api/vendor/orders/", self.other_vendor).json()
        po_data = vendor_view["orders"][0]
        self.assertEqual(po_data["listing_price"], "430000.00")
        self.assertNotIn("Amina", json.dumps(vendor_view))

        # Store search is admin-only.
        self.assertEqual(self._json("get", "/api/admin/stores/search/?q=a", self.vendor).status_code, 403)


class StaffTests(TestCase):
    """City staff: see their city's orders on the web and in the app; no deleting."""

    SINZA = {"latitude": "-6.780000", "longitude": "39.230000"}      # Dar es Salaam
    ARUSHA = {"latitude": "-3.370000", "longitude": "36.690000"}     # Arusha

    def setUp(self):
        self.admin = User.objects.create_user("+255700000201", "pw", role=UserRole.ADMIN)
        vendor = User.objects.create_user("+255700000202", "pw", role=UserRole.VENDOR_OWNER)
        store = Store.objects.create(owner=vendor, name="Kariakoo Phones",
                                     category=StoreCategory.objects.create(name="Electronics"),
                                     status=StoreStatus.APPROVED)
        self.listing = Listing.objects.create(store=store, category=ProductCategory.objects.create(name="Phones"),
                                              title="Tecno Spark", description="Phone", price="300000")

    def _post(self, url, body, client=None, **headers):
        return (client or self.client).post(url, data=json.dumps(body), content_type="application/json", **headers)

    def _order(self, coords):
        res = self._post("/api/orders/quick/", {"listing_id": str(self.listing.pk), "quantity": 1,
                                                "name": "Amina", "phone": "0712345678", **coords})
        self.assertEqual(res.status_code, 201, res.content)
        return QuickOrder.objects.get(pk=res.json()["order_id"])

    def _create_staff(self, city="Dar es Salaam"):
        self.client.force_login(self.admin)
        res = self._post("/api/admin/users/", {"name": "Neema Staff", "phone_number": "+255711300300",
                                               "email": "neema@example.com", "city": city})
        self.assertEqual(res.status_code, 201, res.content)
        self.client.logout()
        return res.json()

    def test_orders_get_a_city_and_staff_see_only_theirs(self):
        dar, arusha = self._order(self.SINZA), self._order(self.ARUSHA)
        self.assertEqual(dar.city, "Dar es Salaam")
        self.assertEqual(arusha.city, "Arusha")

        created = self._create_staff()
        self.assertEqual(created["user"]["role"], "staff")
        password = created["password"]

        # Web: staff log in, land on Orders, see Dar orders only.
        login = self._post("/api/login/", {"email": "neema@example.com", "password": password})
        self.assertEqual(login.json()["redirect"], "/admin/orders")
        ids = [o["id"] for o in self.client.get("/api/admin/orders/").json()["orders"]]
        self.assertEqual(ids, [str(dar.pk)])
        # Can work on their order, not on another city's, and can't delete.
        ok = self.client.patch(f"/api/admin/orders/{dar.pk}/", data=json.dumps({"status": "contacted"}),
                               content_type="application/json")
        self.assertEqual(ok.status_code, 200)
        other = self.client.patch(f"/api/admin/orders/{arusha.pk}/", data=json.dumps({"status": "contacted"}),
                                  content_type="application/json")
        self.assertEqual(other.status_code, 404)
        self.assertEqual(self.client.delete(f"/api/admin/orders/{dar.pk}/").status_code, 403)
        # Other admin pages stay admin-only.
        self.assertEqual(self.client.get("/api/admin/users/").status_code, 403)

    def test_app_login_and_order_list(self):
        self._order(self.SINZA)
        self._order(self.ARUSHA)
        password = self._create_staff()["password"]

        bad = self._post("/api/staff/login/", {"username": "+255711300300", "password": "wrong"})
        self.assertEqual(bad.status_code, 401)
        res = self._post("/api/staff/login/", {"username": "+255711300300", "password": password})
        self.assertEqual(res.status_code, 200, res.content)
        token = res.json()["token"]
        self.assertEqual(res.json()["user"]["city"], "Dar es Salaam")

        anon = Client()
        self.assertEqual(anon.get("/api/staff/orders/").status_code, 401)
        data = anon.get("/api/staff/orders/", HTTP_AUTHORIZATION=f"Bearer {token}").json()
        self.assertEqual([o["city"] for o in data["orders"]], ["Dar es Salaam"])
        self.assertEqual(data["orders"][0]["customer_phone"], "0712345678")

        # Customers and vendors can't use the staff app.
        vendor_login = self._post("/api/staff/login/", {"username": "+255700000202", "password": "pw"})
        self.assertEqual(vendor_login.status_code, 403)

    def test_performance_counts_what_staff_closed_and_collected(self):
        mine, other_city = self._order(self.SINZA), self._order(self.ARUSHA)
        created = self._create_staff()
        login = self._post("/api/login/", {"email": "neema@example.com", "password": created["password"]})
        self.assertEqual(login.status_code, 200)

        QuickOrder.objects.filter(pk=mine.pk).update(status=QuickOrderStatus.DELIVERED)
        res = self.client.patch(f"/api/admin/orders/{mine.pk}/",
                                data=json.dumps({"status": "closed", "amount_paid": "305000"}),
                                content_type="application/json")
        self.assertEqual(res.status_code, 200, res.content)
        mine.refresh_from_db()
        self.assertEqual(mine.closed_by.phone_number, "+255711300300")

        data = self.client.get("/api/admin/orders/performance/").json()
        self.assertFalse(data["team"])
        self.assertEqual(data["today"], {"date": data["range"]["from"], "received": 1, "closed": 1,
                                         "collected": "305000.00"})
        self.assertEqual(data["totals"]["collected"], "305000.00")
        self.assertEqual([o["id"] for o in data["closed_orders"]], [str(mine.pk)])
        self.assertEqual([o["id"] for o in data["received_orders"]], [str(mine.pk)])
        self.assertEqual(sum(d["closed"] for d in data["daily"]), 1)

        # A range with nothing in it.
        empty = self.client.get("/api/admin/orders/performance/?from=2020-01-01&to=2020-01-31").json()
        self.assertEqual(empty["totals"]["closed"], 0)
        self.assertEqual(len(empty["daily"]), 31)

        # Same numbers in the app.
        token = self._post("/api/staff/login/", {"username": "+255711300300",
                                                 "password": created["password"]}).json()["token"]
        app = Client().get("/api/staff/performance/", HTTP_AUTHORIZATION=f"Bearer {token}").json()
        self.assertEqual(app["totals"]["closed"], 1)

        # Admin sees the whole team, with a row per staff member.
        self.client.force_login(self.admin)
        team = self.client.get("/api/admin/orders/performance/").json()
        self.assertTrue(team["team"])
        self.assertEqual(team["totals"]["received"], 2)
        self.assertEqual([r["closed"] for r in team["by_staff"]], [1])
        one = self.client.get(f"/api/admin/orders/performance/?staff={team['by_staff'][0]['id']}").json()
        self.assertFalse(one["team"])
        self.assertEqual(one["totals"]["received"], 1)
        self.assertNotIn(str(other_city.pk), [o["id"] for o in one["received_orders"]])


class LipaNumberTests(TestCase):
    """Admins keep lipa numbers; customers pay, tap "Nimeshalipia" and the order says so."""

    def setUp(self):
        self.admin = User.objects.create_user("+255700000301", "pw", role=UserRole.ADMIN)
        vendor = User.objects.create_user("+255700000302", "pw", role=UserRole.VENDOR_OWNER)
        store = Store.objects.create(owner=vendor, name="Kariakoo Phones",
                                     category=StoreCategory.objects.create(name="Electronics"),
                                     status=StoreStatus.APPROVED)
        self.listing = Listing.objects.create(store=store, category=ProductCategory.objects.create(name="Phones"),
                                              title="Tecno Spark", description="Phone", price="300000")

    def _json(self, method, url, body=None):
        return getattr(self.client, method)(url, data=json.dumps(body or {}), content_type="application/json")

    def test_admin_manages_numbers_and_customer_pays(self):
        # Only admins can manage the numbers.
        self.assertEqual(self.client.get("/api/admin/payment-accounts/").status_code, 403)
        self.client.force_login(self.admin)
        bad = self._json("post", "/api/admin/payment-accounts/", {"provider": "mpesa", "number": ""})
        self.assertEqual(bad.status_code, 400)
        mpesa = self._json("post", "/api/admin/payment-accounts/",
                           {"provider": "mpesa", "number": "5544332", "account_name": "SokoLink Ltd"}).json()
        airtel = self._json("post", "/api/admin/payment-accounts/",
                            {"provider": "airtel_money", "number": "998877", "account_name": "SokoLink"}).json()
        self._json("patch", f"/api/admin/payment-accounts/{airtel['account']['id']}/", {"is_active": False})
        self.client.logout()

        # Customers see the active ones only.
        public = self.client.get("/api/payment-accounts/").json()["accounts"]
        self.assertEqual([a["number"] for a in public], ["5544332"])
        self.assertEqual(public[0]["provider_label"], "M-Pesa")

        # Order with "Nimeshalipia".
        order = {"listing_id": str(self.listing.pk), "quantity": 1, "name": "Amina", "phone": "0712345678"}
        wrong = self._json("post", "/api/orders/quick/",
                           {**order, "payment": {"paid": True, "account_id": airtel["account"]["id"]}})
        self.assertEqual(wrong.status_code, 400)
        res = self._json("post", "/api/orders/quick/",
                         {**order, "payment": {"paid": True, "account_id": mpesa["account"]["id"],
                                               "reference": "QJK7H2X9"}})
        self.assertEqual(res.status_code, 201, res.content)
        saved = QuickOrder.objects.get(pk=res.json()["order_id"])
        self.assertTrue(saved.customer_paid)
        self.assertEqual(saved.customer_payment_account, "M-Pesa 5544332 (SokoLink Ltd)")
        self.assertEqual(saved.customer_payment_reference, "QJK7H2X9")

        # Without paying ahead still works (price on request, old app versions).
        plain = self._json("post", "/api/orders/quick/", order)
        self.assertFalse(QuickOrder.objects.get(pk=plain.json()["order_id"]).customer_paid)

        # Admins see it on the order.
        self.client.force_login(self.admin)
        orders = {o["id"]: o for o in self.client.get("/api/admin/orders/").json()["orders"]}
        paid = orders[str(saved.pk)]["customer_payment"]
        self.assertEqual((paid["provider_label"], paid["reference"]), ("M-Pesa", "QJK7H2X9"))
        self.assertIsNone(orders[plain.json()["order_id"]]["customer_payment"])
