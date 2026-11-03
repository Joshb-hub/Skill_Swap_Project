import pytest


@pytest.mark.asyncio
async def test_security_and_notification_preferences_persist(client):
    register_payload = {
        "full_name": "Jamie Morgan",
        "username": "jamie_morgan",
        "email": "jamie@example.com",
        "password": "StrongPass!123",
        "confirm_password": "StrongPass!123",
        "profession": "Product Manager",
        "country": "United States",
        "city": "Seattle",
        "accept_terms": True,
    }
    response = await client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201, response.text

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": "jamie@example.com", "password": "StrongPass!123"},
    )
    assert login_response.status_code == 200, login_response.text
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    settings_response = await client.get("/api/v1/settings/security", headers=headers)
    assert settings_response.status_code == 200, settings_response.text
    assert settings_response.json()["two_factor_enabled"] is False
    assert settings_response.json()["login_alerts_enabled"] is True

    update_response = await client.put(
        "/api/v1/settings/security",
        json={"two_factor_enabled": True, "login_alerts_enabled": False},
        headers=headers,
    )
    assert update_response.status_code == 200, update_response.text

    preferences_response = await client.get(
        "/api/v1/settings/notifications/preferences",
        headers=headers,
    )
    assert preferences_response.status_code == 200, preferences_response.text
    assert preferences_response.json()["request_updates"] is True

    preference_update = await client.put(
        "/api/v1/settings/notifications/preferences",
        json={"request_updates": False, "messages": False},
        headers=headers,
    )
    assert preference_update.status_code == 200, preference_update.text

    refreshed = await client.get(
        "/api/v1/settings/notifications/preferences",
        headers=headers,
    )
    assert refreshed.json()["request_updates"] is False
    assert refreshed.json()["messages"] is False


@pytest.mark.asyncio
async def test_active_sessions_can_be_revoked(client):
    register_payload = {
        "full_name": "Alex Shah",
        "username": "alex_shah",
        "email": "alex@example.com",
        "password": "StrongPass!123",
        "confirm_password": "StrongPass!123",
        "profession": "UX Designer",
        "country": "India",
        "city": "Bangalore",
        "accept_terms": True,
    }
    response = await client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201, response.text

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"identifier": "alex@example.com", "password": "StrongPass!123"},
    )
    assert login_response.status_code == 200, login_response.text
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    sessions_response = await client.get("/api/v1/settings/sessions", headers=headers)
    assert sessions_response.status_code == 200, sessions_response.text
    sessions = sessions_response.json()
    assert len(sessions) >= 1
    session_id = sessions[0]["id"]

    revoke_response = await client.delete(
        f"/api/v1/settings/sessions/{session_id}",
        headers=headers,
    )
    assert revoke_response.status_code == 200, revoke_response.text

    refreshed_sessions = await client.get("/api/v1/settings/sessions", headers=headers)
    assert refreshed_sessions.status_code == 200, refreshed_sessions.text
    current_ids = [item["id"] for item in refreshed_sessions.json()]
    assert session_id not in current_ids
