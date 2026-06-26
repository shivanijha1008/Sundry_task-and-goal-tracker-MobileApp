"""Tests for Monthly Goals + existing endpoints regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://monthly-goals-sprint.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def cleanup_ids():
    created = []
    yield created
    for cid in created:
        try:
            requests.delete(f"{API}/monthly-goals/{cid}", timeout=10)
        except Exception:
            pass


# ---------------- Monthly Goals ----------------
class TestMonthlyGoals:
    def test_list_returns_array(self, client):
        r = client.get(f"{API}/monthly-goals", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_valid_list_types(self, client, cleanup_ids):
        for lt in ["goals", "skills", "books", "movies", "places"]:
            r = client.post(f"{API}/monthly-goals", json={"list_type": lt, "title": f"TEST_{lt}_item"}, timeout=10)
            assert r.status_code == 200, f"Failed for list_type={lt}: {r.text}"
            data = r.json()
            assert data["list_type"] == lt
            assert data["title"] == f"TEST_{lt}_item"
            assert "id" in data
            assert "order" in data
            assert isinstance(data["order"], int)
            assert data["checked"] is False
            cleanup_ids.append(data["id"])

    def test_create_invalid_list_type(self, client):
        r = client.post(f"{API}/monthly-goals", json={"list_type": "invalid_x", "title": "x"}, timeout=10)
        assert r.status_code == 400
        body = r.json()
        assert "Invalid" in str(body) or "list_type" in str(body)

    def test_filter_by_list_type(self, client, cleanup_ids):
        # create one of each
        for lt in ["goals", "books"]:
            r = client.post(f"{API}/monthly-goals", json={"list_type": lt, "title": f"TEST_filter_{lt}"}, timeout=10)
            cleanup_ids.append(r.json()["id"])
        r = client.get(f"{API}/monthly-goals?list_type=books", timeout=10)
        assert r.status_code == 200
        items = r.json()
        assert all(it["list_type"] == "books" for it in items)
        # invalid filter
        r2 = client.get(f"{API}/monthly-goals?list_type=bogus", timeout=10)
        assert r2.status_code == 400

    def test_auto_increment_order(self, client, cleanup_ids):
        orders = []
        for i in range(3):
            r = client.post(f"{API}/monthly-goals", json={"list_type": "skills", "title": f"TEST_order_{i}"}, timeout=10)
            assert r.status_code == 200
            orders.append(r.json()["order"])
            cleanup_ids.append(r.json()["id"])
        # Orders should be strictly increasing (since count grows)
        assert orders == sorted(orders)
        assert orders[1] > orders[0]

    def test_update_title_and_checked(self, client, cleanup_ids):
        r = client.post(f"{API}/monthly-goals", json={"list_type": "movies", "title": "TEST_orig"}, timeout=10)
        item_id = r.json()["id"]
        cleanup_ids.append(item_id)

        # update title
        r2 = client.put(f"{API}/monthly-goals/{item_id}", json={"title": "TEST_updated"}, timeout=10)
        assert r2.status_code == 200
        assert r2.json()["title"] == "TEST_updated"

        # toggle checked on
        r3 = client.put(f"{API}/monthly-goals/{item_id}", json={"checked": True}, timeout=10)
        assert r3.status_code == 200
        assert r3.json()["checked"] is True

        # toggle off
        r4 = client.put(f"{API}/monthly-goals/{item_id}", json={"checked": False}, timeout=10)
        assert r4.status_code == 200
        assert r4.json()["checked"] is False

        # verify persistence via list
        r5 = client.get(f"{API}/monthly-goals?list_type=movies", timeout=10)
        match = [i for i in r5.json() if i["id"] == item_id]
        assert match and match[0]["title"] == "TEST_updated" and match[0]["checked"] is False

    def test_update_unknown_id(self, client):
        r = client.put(f"{API}/monthly-goals/nonexistent-id-xyz", json={"title": "x"}, timeout=10)
        assert r.status_code == 404

    def test_delete_and_404(self, client, cleanup_ids):
        r = client.post(f"{API}/monthly-goals", json={"list_type": "places", "title": "TEST_del"}, timeout=10)
        item_id = r.json()["id"]
        r2 = client.delete(f"{API}/monthly-goals/{item_id}", timeout=10)
        assert r2.status_code == 200
        # confirm gone
        r3 = client.delete(f"{API}/monthly-goals/{item_id}", timeout=10)
        assert r3.status_code == 404


# ---------------- Regression: existing endpoints ----------------
class TestRegression:
    def test_tasks_list(self, client):
        r = client.get(f"{API}/tasks", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_shopping_list(self, client):
        r = client.get(f"{API}/shopping", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_me_time_list(self, client):
        r = client.get(f"{API}/me-time", timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_quote_today(self, client):
        r = client.get(f"{API}/quote/today", timeout=10)
        assert r.status_code == 200
        d = r.json()
        assert "text" in d and "author" in d
