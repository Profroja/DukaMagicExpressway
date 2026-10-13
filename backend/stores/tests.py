import json

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase, override_settings

from auths.models import User, UserRole
from catalog.models import Listing

from .models import Store

GIF = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00"
    b"\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


@override_settings(MEDIA_ROOT="test-media-stores")
class AdminStoreManagementTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user("+255700900001", "AdminPass#2026", role=UserRole.ADMIN)
        self.client.force_login(self.admin)

    def _create(self, **overrides):
        body = {
            "name": "Kariakoo Electronics",
            "location_name": "Kariakoo, Dar es Salaam",
            "category_type": "goods",
            "categories": ["Electronics"],
            "owner_name": "Juma Ali",
            "owner_phone": "+255711222333",
            "owner_email": "juma@example.com",
            **overrides,
        }
        return self.client.post("/api/admin/stores/", data=json.dumps(body), content_type="application/json")

    def test_admin_creates_store_with_owner_and_location(self):
        res = self._create()
        self.assertEqual(res.status_code, 201, res.content)
        data = res.json()
        self.assertEqual(data["store"]["location_name"], "Kariakoo, Dar es Salaam")
        self.assertEqual(data["store"]["status"], "approved")
        password = data["owner_password"]
        self.assertTrue(password)

        # The new owner can sign in with the generated password.
        login = Client().post("/api/login/", data=json.dumps({"email": "juma@example.com", "password": password}),
                              content_type="application/json")
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["redirect"], "/vendor")

        # Same phone can't own a second store.
        self.assertEqual(self._create(name="Another").status_code, 409)

    def test_admin_adds_product_and_edits_location(self):
        store_id = self._create().json()["store"]["id"]
        url = f"/api/admin/stores/{store_id}/products/"

        categories = self.client.get(url).json()["categories"]
        electronics = next(c for c in categories if c["name"] == "Electronics")
        res = self.client.post(url, data={
            "title": "Smart TV 43\"", "price": "650000", "category_id": electronics["id"],
            "description": "Full HD", "available": "true",
            "image": SimpleUploadedFile("tv.gif", GIF, content_type="image/gif"),
        })
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(Listing.objects.get(store_id=store_id).title, 'Smart TV 43"')

        res = self.client.patch(f"/api/admin/stores/{store_id}/", data=json.dumps({"location_name": "Mlimani City"}),
                                content_type="application/json")
        self.assertEqual(res.json()["store"]["location_name"], "Mlimani City")
        self.assertEqual(Store.objects.get(pk=store_id).location_name, "Mlimani City")

    def test_vendor_cannot_use_admin_store_endpoints(self):
        store_id = self._create().json()["store"]["id"]
        vendor = Client()
        vendor.force_login(User.objects.get(phone_number="+255711222333"))
        self.assertEqual(vendor.post("/api/admin/stores/", data="{}", content_type="application/json").status_code, 403)
        self.assertEqual(vendor.get(f"/api/admin/stores/{store_id}/products/").status_code, 403)

    @classmethod
    def tearDownClass(cls):
        import shutil
        shutil.rmtree("test-media-stores", ignore_errors=True)
        super().tearDownClass()
