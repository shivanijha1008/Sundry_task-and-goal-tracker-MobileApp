"""Auth (Emergent Google Auth) endpoint tests for Sundry.

Covers /api/auth/me, /api/auth/session, /api/auth/logout including:
- Missing/invalid/expired session handling
- Bearer header and cookie auth paths
- Session deletion on logout (idempotent)
"""
import os
import time
import subprocess
import json
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://monthly-goals-sprint.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Mongo helpers (seed/cleanup via mongosh) ----------
def _mongo_eval(js: str) -> str:
    res = subprocess.run(
        ["mongosh", "--quiet", "--eval", f"use('test_database');{js}"],
        capture_output=True, text=True, timeout=15,
    )
    if res.returncode != 0:
        raise RuntimeError(f"mongosh failed: {res.stderr}")
    return res.stdout.strip()


def _seed_user_and_session(expires_offset_ms: int = 7 * 86400000, prefix: str = "sess_test_"):
    """Create a TEST_ user + session row. Returns (user_id, email, session_token)."""
    ts = int(time.time() * 1000)
    user_id = f"user_test_{ts}"
    session_token = f"{prefix}{ts}"
    email = f"sundry.test.{ts}@example.com"
    expires_at_ms = int(time.time() * 1000) + expires_offset_ms
    js = (
        f"db.users.insertOne({{user_id:'{user_id}', email:'{email}', name:'Sundry Tester', picture:'', created_at:new Date().toISOString()}});"
        f"db.user_sessions.insertOne({{user_id:'{user_id}', session_token:'{session_token}', expires_at:new Date({expires_at_ms}).toISOString(), created_at:new Date().toISOString()}});"
        f"print('OK');"
    )
    _mongo_eval(js)
    return user_id, email, session_token


def _delete_session(session_token: str):
    _mongo_eval(f"db.user_sessions.deleteMany({{session_token:'{session_token}'}});")


def _session_exists(session_token: str) -> bool:
    out = _mongo_eval(f"print(db.user_sessions.countDocuments({{session_token:'{session_token}'}}));")
    # mongosh quiet still emits "switched to db ..."; take last non-empty line.
    last = [l for l in out.splitlines() if l.strip()][-1].strip()
    return int(last) > 0


@pytest.fixture(scope="module", autouse=True)
def _cleanup_test_data():
    yield
    try:
        _mongo_eval("db.users.deleteMany({email:/sundry\\.test\\./});"
                    "db.user_sessions.deleteMany({session_token:/^sess_test_/});")
    except Exception:
        pass


# ---------- /api/auth/me ----------
class TestAuthMe:
    def test_me_without_token_returns_401(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401, r.text

    def test_me_with_bearer_returns_user(self):
        user_id, email, token = _seed_user_and_session()
        try:
            r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["user_id"] == user_id
            assert data["email"] == email
            assert data["name"] == "Sundry Tester"
            assert "picture" in data
            # _id must not leak
            assert "_id" not in data
        finally:
            _delete_session(token)

    def test_me_with_cookie_returns_user(self):
        user_id, email, token = _seed_user_and_session()
        try:
            r = requests.get(f"{API}/auth/me", cookies={"session_token": token})
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["user_id"] == user_id
            assert data["email"] == email
        finally:
            _delete_session(token)

    def test_me_with_invalid_bearer_returns_401(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer not_a_real_token_xyz"})
        assert r.status_code == 401

    def test_me_with_expired_session_returns_401(self):
        # session expired 1 hour ago
        user_id, email, token = _seed_user_and_session(expires_offset_ms=-3600000)
        try:
            r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == 401, r.text
        finally:
            _delete_session(token)


# ---------- /api/auth/session ----------
class TestAuthSession:
    def test_empty_body_returns_422(self):
        r = requests.post(f"{API}/auth/session", json={})
        assert r.status_code == 422, r.text

    def test_invalid_session_id_returns_401(self):
        # Emergent /session-data returns 404 for bogus id → backend maps to 401
        r = requests.post(f"{API}/auth/session", json={"session_id": "invalid_bogus_123"})
        assert r.status_code == 401, r.text


# ---------- /api/auth/logout ----------
class TestAuthLogout:
    def test_logout_without_token_idempotent_200(self):
        r = requests.post(f"{API}/auth/logout")
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True

    def test_logout_with_bearer_deletes_session(self):
        _, _, token = _seed_user_and_session()
        try:
            # session exists
            assert _session_exists(token)
            r = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == 200, r.text
            # session row deleted
            assert not _session_exists(token)
            # subsequent /auth/me → 401
            r2 = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert r2.status_code == 401
        finally:
            _delete_session(token)

    def test_logout_with_cookie_deletes_session(self):
        _, _, token = _seed_user_and_session()
        try:
            r = requests.post(f"{API}/auth/logout", cookies={"session_token": token})
            assert r.status_code == 200
            assert not _session_exists(token)
        finally:
            _delete_session(token)


# ---------- Existing endpoints unaffected ----------
class TestExistingEndpointsHealthy:
    def test_tasks_list(self):
        r = requests.get(f"{API}/tasks")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_shopping_list(self):
        r = requests.get(f"{API}/shopping")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_me_time_list(self):
        r = requests.get(f"{API}/me-time")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_monthly_goals_list(self):
        r = requests.get(f"{API}/monthly-goals")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
