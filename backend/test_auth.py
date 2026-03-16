import httpx
import pytest

BASE_URL = "http://localhost:8000"

def test_register_and_login():
    import random
    user = f"testuser_{random.randint(1000,9999)}"
    password = "testpassword123"

    # Register
    res = httpx.post(f"{BASE_URL}/api/register", json={"username": user, "password": password})
    assert res.status_code == 200
    assert "access_token" in res.json()

    # Login
    res = httpx.post(
        f"{BASE_URL}/api/login",
        data={"username": user, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert token

    # Test protected route
    res = httpx.get(
        f"{BASE_URL}/api/dashboard",
        headers={"Authorization": f"Bearer {token}"}
    )
    # Should be 200 even if no transactions yet (returns null typically)
    assert res.status_code == 200
