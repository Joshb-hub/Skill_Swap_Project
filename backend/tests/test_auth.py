import pytest


@pytest.mark.asyncio
async def test_register_and_login_flow(client):
    # 1. Register new user
    register_payload = {
        "full_name": "Test Engineer",
        "username": "testdev",
        "email": "testdev@skillswap.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "profession": "Software Engineer",
        "country": "United States",
        "city": "Austin",
        "bio": "Excited to swap programming and photography skills.",
        "accept_terms": True
    }
    reg_res = await client.post("/api/auth/register", json=register_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["username"] == "testdev"
    assert reg_data["email"] == "testdev@skillswap.com"
    assert reg_data["is_verified"] is False

    # 2. Login with correct credentials
    login_payload = {
        "identifier": "testdev",
        "password": "Password123!"
    }
    login_res = await client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data

    # 3. Access protected /api/auth/me with access token
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = await client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["username"] == "testdev"


@pytest.mark.asyncio
async def test_password_validation(client):
    # Passwords without special characters or uppercase should be rejected
    invalid_payload = {
        "full_name": "Invalid User",
        "username": "invaliduser",
        "email": "invalid@skillswap.com",
        "password": "simplepassword",
        "confirm_password": "simplepassword",
        "profession": "Student",
        "accept_terms": True
    }
    res = await client.post("/api/auth/register", json=invalid_payload)
    assert res.status_code == 422
