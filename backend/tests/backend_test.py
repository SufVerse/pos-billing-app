"""Backend pytest suite for POS Billing & Inventory API.

NOTE: Uses actual backend schema field names from /app/backend/server.py:
- Categories use `categoryName`
- Suppliers use `supplierName`
- Products use `productName`, `sellingPrice`, `stockQuantity`, `minimumStockLevel`, `status`
- Stock movements use `movementType` (sale movement created automatically by /sales)
- Sale items use {productId, quantity, discountAmount}
"""
import os
import re
import uuid
import pytest
import requests

from pathlib import Path

BASE = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE:
    try:
        frontend_env = Path(__file__).resolve().parent.parent.parent / "frontend" / ".env"
        if frontend_env.exists():
            with open(frontend_env, encoding="utf-8") as f:
                for line in f:
                    if line.startswith("REACT_APP_BACKEND_URL="):
                        BASE = line.split("=", 1)[1].strip().strip('"\'')
                        break
    except Exception:
        pass
if not BASE:
    BASE = "http://localhost:8001"
BASE = BASE.rstrip("/")
API = f"{BASE}/api"
TIMEOUT = 30


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "admin123"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="session")
def cashier_token():
    r = requests.post(f"{API}/auth/login", json={"username": "cashier", "password": "cashier123"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "cashier"
    return data["token"]


# -------- AUTH --------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=TIMEOUT)
        assert r.status_code == 200

    def test_admin_login(self, admin_token):
        assert isinstance(admin_token, str) and len(admin_token) > 20

    def test_cashier_login(self, cashier_token):
        assert isinstance(cashier_token, str) and len(cashier_token) > 20

    def test_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"username": "admin", "password": "wrong"}, timeout=TIMEOUT)
        assert r.status_code == 401

    def test_unknown_user(self):
        r = requests.post(f"{API}/auth/login", json={"username": "nope_x", "password": "x"}, timeout=TIMEOUT)
        assert r.status_code == 401

    def test_me_admin(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert d["username"] == "admin"
        assert d["role"] == "admin"

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=TIMEOUT)
        assert r.status_code == 401


# -------- RBAC --------
class TestRBAC:
    def test_cashier_cannot_create_product(self, cashier_token):
        r = requests.post(f"{API}/products", headers=H(cashier_token), json={
            "productName": "X", "sellingPrice": 1, "stockQuantity": 1
        }, timeout=TIMEOUT)
        assert r.status_code == 403

    def test_cashier_cannot_create_category(self, cashier_token):
        r = requests.post(f"{API}/categories", headers=H(cashier_token),
                          json={"categoryName": "X"}, timeout=TIMEOUT)
        assert r.status_code == 403

    def test_cashier_cannot_dashboard(self, cashier_token):
        r = requests.get(f"{API}/dashboard/stats", headers=H(cashier_token), timeout=TIMEOUT)
        assert r.status_code == 403

    def test_cashier_cannot_users(self, cashier_token):
        r = requests.get(f"{API}/users", headers=H(cashier_token), timeout=TIMEOUT)
        assert r.status_code == 403

    def test_cashier_can_get_products(self, cashier_token):
        r = requests.get(f"{API}/products", headers=H(cashier_token), timeout=TIMEOUT)
        assert r.status_code == 200
        for p in r.json():
            assert p.get("status") == "active"  # cashier sees active only

    def test_cashier_can_get_categories(self, cashier_token):
        r = requests.get(f"{API}/categories", headers=H(cashier_token), timeout=TIMEOUT)
        assert r.status_code == 200


# -------- CATEGORIES --------
class TestCategoriesCRUD:
    def test_full_crud(self, admin_token):
        name = f"TEST_cat_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/categories", headers=H(admin_token),
                          json={"categoryName": name}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        r = requests.get(f"{API}/categories", headers=H(admin_token), timeout=TIMEOUT)
        assert any(c["id"] == cid for c in r.json())
        r = requests.put(f"{API}/categories/{cid}", headers=H(admin_token),
                         json={"categoryName": name + "_u"}, timeout=TIMEOUT)
        assert r.status_code == 200
        r = requests.delete(f"{API}/categories/{cid}", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200


# -------- SUPPLIERS --------
class TestSuppliersCRUD:
    def test_full_crud(self, admin_token):
        name = f"TEST_sup_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/suppliers", headers=H(admin_token),
                          json={"supplierName": name}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]
        r = requests.put(f"{API}/suppliers/{sid}", headers=H(admin_token),
                         json={"supplierName": name + "_u"}, timeout=TIMEOUT)
        assert r.status_code == 200
        r = requests.delete(f"{API}/suppliers/{sid}", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200


# -------- PRODUCTS --------
def _make_product(token, **overrides):
    payload = {
        "productName": f"TEST_prod_{uuid.uuid4().hex[:6]}",
        "sellingPrice": 100.0,
        "costPrice": 50.0,
        "stockQuantity": 20,
        "minimumStockLevel": 5,
        "taxPercentage": 0,
        "status": "active",
    }
    payload.update(overrides)
    r = requests.post(f"{API}/products", headers=H(token), json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    return r.json()


class TestProductsCRUD:
    def test_create_get_update_delete(self, admin_token):
        p = _make_product(admin_token)
        assert "id" in p and p["productName"].startswith("TEST_prod_")
        r = requests.get(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200
        d = r.json()
        assert d["sellingPrice"] == 100.0 and d["stockQuantity"] == 20
        # update
        r = requests.put(f"{API}/products/{p['id']}", headers=H(admin_token), json={
            **p, "sellingPrice": 150.0,
        }, timeout=TIMEOUT)
        assert r.status_code == 200
        r = requests.get(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)
        assert r.json()["sellingPrice"] == 150.0
        # delete
        r = requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200
        r = requests.get(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 404


# -------- STOCK MOVEMENTS --------
class TestStockMovements:
    def _stock(self, token, pid):
        return requests.get(f"{API}/products/{pid}", headers=H(token), timeout=TIMEOUT).json()["stockQuantity"]

    def test_inward_increases(self, admin_token):
        p = _make_product(admin_token, stockQuantity=10)
        try:
            r = requests.post(f"{API}/stock-movements", headers=H(admin_token), json={
                "productId": p["id"], "movementType": "inward", "quantity": 5
            }, timeout=TIMEOUT)
            assert r.status_code == 200, r.text
            assert self._stock(admin_token, p["id"]) == 15
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_damage_decreases(self, admin_token):
        p = _make_product(admin_token, stockQuantity=10)
        try:
            r = requests.post(f"{API}/stock-movements", headers=H(admin_token), json={
                "productId": p["id"], "movementType": "damage", "quantity": 3
            }, timeout=TIMEOUT)
            assert r.status_code == 200, r.text
            assert self._stock(admin_token, p["id"]) == 7
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_adjustment_sets_stock(self, admin_token):
        p = _make_product(admin_token, stockQuantity=10)
        try:
            r = requests.post(f"{API}/stock-movements", headers=H(admin_token), json={
                "productId": p["id"], "movementType": "adjustment", "quantity": 42
            }, timeout=TIMEOUT)
            assert r.status_code == 200, r.text
            assert self._stock(admin_token, p["id"]) == 42
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_damage_cannot_go_negative(self, admin_token):
        p = _make_product(admin_token, stockQuantity=5)
        try:
            r = requests.post(f"{API}/stock-movements", headers=H(admin_token), json={
                "productId": p["id"], "movementType": "damage", "quantity": 999999
            }, timeout=TIMEOUT)
            assert r.status_code == 400
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)


# -------- SALES / BILLING --------
class TestSales:
    def test_cashier_creates_sale_and_stock_reduced(self, cashier_token, admin_token):
        p = _make_product(admin_token, stockQuantity=20, sellingPrice=100)
        try:
            before = requests.get(f"{API}/products/{p['id']}", headers=H(admin_token),
                                  timeout=TIMEOUT).json()["stockQuantity"]
            r = requests.post(f"{API}/sales", headers=H(cashier_token), json={
                "items": [{"productId": p["id"], "quantity": 2}],
                "paymentMethod": "cash",
                "customerName": "TEST_cust",
            }, timeout=TIMEOUT)
            assert r.status_code == 200, r.text
            body = r.json()
            assert "sale" in body and "items" in body and "store" in body
            sale = body["sale"]
            assert sale["cashier"]  # cashier id present
            assert sale["paymentMethod"] == "cash"
            after = requests.get(f"{API}/products/{p['id']}", headers=H(admin_token),
                                 timeout=TIMEOUT).json()["stockQuantity"]
            assert after == before - 2
            # stock movement of type 'sale' exists
            r2 = requests.get(f"{API}/stock-movements", headers=H(admin_token),
                              params={"productId": p["id"]}, timeout=TIMEOUT)
            assert r2.status_code == 200
            assert any(m.get("movementType") == "sale" for m in r2.json())
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_invoice_format(self, cashier_token, admin_token):
        p = _make_product(admin_token, stockQuantity=10, sellingPrice=50)
        try:
            r = requests.post(f"{API}/sales", headers=H(cashier_token), json={
                "items": [{"productId": p["id"], "quantity": 1}], "paymentMethod": "cash",
            }, timeout=TIMEOUT)
            assert r.status_code == 200, r.text
            inv = r.json()["sale"]["invoiceNumber"]
            assert re.match(r"^[A-Z]+-\d{8}-\d{4}$", inv), f"invoice format invalid: {inv}"
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_invoice_numbers_unique(self, cashier_token, admin_token):
        p = _make_product(admin_token, stockQuantity=10, sellingPrice=50)
        try:
            invs = []
            for _ in range(3):
                r = requests.post(f"{API}/sales", headers=H(cashier_token), json={
                    "items": [{"productId": p["id"], "quantity": 1}], "paymentMethod": "cash",
                }, timeout=TIMEOUT)
                assert r.status_code == 200
                invs.append(r.json()["sale"]["invoiceNumber"])
            assert len(set(invs)) == len(invs), f"duplicate invoices: {invs}"
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_insufficient_stock_returns_400(self, cashier_token, admin_token):
        p = _make_product(admin_token, stockQuantity=2)
        try:
            r = requests.post(f"{API}/sales", headers=H(cashier_token), json={
                "items": [{"productId": p["id"], "quantity": 99999}], "paymentMethod": "cash",
            }, timeout=TIMEOUT)
            assert r.status_code == 400
        finally:
            requests.delete(f"{API}/products/{p['id']}", headers=H(admin_token), timeout=TIMEOUT)

    def test_empty_cart_returns_400(self, cashier_token):
        r = requests.post(f"{API}/sales", headers=H(cashier_token),
                          json={"items": [], "paymentMethod": "cash"}, timeout=TIMEOUT)
        assert r.status_code == 400

    def test_cashier_lists_only_own(self, cashier_token):
        r = requests.get(f"{API}/sales", headers=H(cashier_token), timeout=TIMEOUT)
        assert r.status_code == 200
        sales = r.json()
        assert isinstance(sales, list)
        if sales:
            cashier_id = requests.get(f"{API}/auth/me", headers=H(cashier_token), timeout=TIMEOUT).json()["id"]
            assert all(s["cashier"] == cashier_id for s in sales)

    def test_admin_lists_all(self, admin_token):
        r = requests.get(f"{API}/sales", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# -------- DASHBOARD / REPORTS --------
class TestDashboardReports:
    def test_dashboard(self, admin_token):
        r = requests.get(f"{API}/dashboard/stats", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ["todayTotal", "monthTotal", "productsCount", "lowStock", "recentSales", "chart"]:
            assert k in d, f"missing key {k} in dashboard: {list(d.keys())}"

    def test_report_sales(self, admin_token):
        r = requests.get(f"{API}/reports/sales", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200

    def test_report_top(self, admin_token):
        r = requests.get(f"{API}/reports/top-products", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200

    def test_report_slow(self, admin_token):
        r = requests.get(f"{API}/reports/slow-products", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200

    def test_report_stock(self, admin_token):
        r = requests.get(f"{API}/reports/stock", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200

    def test_cashier_cannot_reports(self, cashier_token):
        r = requests.get(f"{API}/reports/sales", headers=H(cashier_token), timeout=TIMEOUT)
        assert r.status_code == 403


# -------- SETTINGS --------
class TestSettings:
    def test_get_and_put(self, admin_token):
        r = requests.get(f"{API}/settings", headers=H(admin_token), timeout=TIMEOUT)
        assert r.status_code == 200
        cur = r.json()
        cur["storeName"] = "TEST_Store"
        r = requests.put(f"{API}/settings", headers=H(admin_token), json=cur, timeout=TIMEOUT)
        assert r.status_code == 200
        r = requests.get(f"{API}/settings", headers=H(admin_token), timeout=TIMEOUT)
        assert r.json()["storeName"] == "TEST_Store"

    def test_put_cashier_403(self, cashier_token, admin_token):
        cur = requests.get(f"{API}/settings", headers=H(admin_token), timeout=TIMEOUT).json()
        r = requests.put(f"{API}/settings", headers=H(cashier_token), json=cur, timeout=TIMEOUT)
        assert r.status_code == 403


# -------- USER MANAGEMENT --------
class TestUsers:
    def test_create_toggle_reset(self, admin_token):
        username = f"test_cash_{uuid.uuid4().hex[:6]}"
        r = requests.post(f"{API}/users", headers=H(admin_token), json={
            "username": username, "fullName": "TEST Cashier", "password": "pw12345", "role": "cashier"
        }, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
        uid = r.json()["id"]
        # toggle status to inactive
        r = requests.put(f"{API}/users/{uid}", headers=H(admin_token),
                         json={"status": "inactive"}, timeout=TIMEOUT)
        assert r.status_code == 200
        # reset password
        r = requests.post(f"{API}/users/{uid}/reset-password", headers=H(admin_token),
                          json={"newPassword": "newpw123"}, timeout=TIMEOUT)
        assert r.status_code == 200
        # inactive user cannot login (or login succeeds but auth/me fails 403)
        r = requests.post(f"{API}/auth/login", json={"username": username, "password": "newpw123"}, timeout=TIMEOUT)
        if r.status_code == 200:
            t = r.json()["token"]
            r2 = requests.get(f"{API}/auth/me", headers=H(t), timeout=TIMEOUT)
            assert r2.status_code == 403, "inactive user should not be allowed via auth/me"
        else:
            assert r.status_code in (401, 403)
        # reactivate
        requests.put(f"{API}/users/{uid}", headers=H(admin_token),
                     json={"status": "active"}, timeout=TIMEOUT)
        r = requests.post(f"{API}/auth/login", json={"username": username, "password": "newpw123"}, timeout=TIMEOUT)
        assert r.status_code == 200, r.text
