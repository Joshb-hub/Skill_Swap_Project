import pytest
from app.core.rate_limiter import rate_limiter


@pytest.mark.asyncio
async def test_login_rate_limiting_and_lockout(client):
    # Ensure fresh rate limiter state
    await rate_limiter.reset_failed_attempts("lockout_test_user", "127.0.0.1")

    # 1. Register a test user
    reg_payload = {
        "full_name": "Lockout User",
        "username": "lockout_test_user",
        "email": "lockout@skillswap.com",
        "password": "CorrectPassword123!",
        "confirm_password": "CorrectPassword123!",
        "profession": "Tester",
        "accept_terms": True
    }
    await client.post("/api/auth/register", json=reg_payload)

    # 2. Attempt 9 failed logins with wrong password -> status 401
    for i in range(9):
        res = await client.post("/api/auth/login", json={
            "identifier": "lockout_test_user",
            "password": f"WrongPassword{i}!"
        })
        assert res.status_code == 401
        assert "Invalid credentials" in res.json()["detail"]

    # 3. 10th failed attempt triggers lockout
    res_10 = await client.post("/api/auth/login", json={
        "identifier": "lockout_test_user",
        "password": "WrongPassword10!"
    })
    assert res_10.status_code == 429
    assert "temporarily locked" in res_10.json()["detail"]

    # 4. 11th attempt (even with CORRECT password) is throttled/locked out
    res_11 = await client.post("/api/auth/login", json={
        "identifier": "lockout_test_user",
        "password": "CorrectPassword123!"
    })
    assert res_11.status_code == 429
    assert "temporarily restricted" in res_11.json()["detail"]

    # Cleanup
    await rate_limiter.reset_failed_attempts("lockout_test_user", "127.0.0.1")
