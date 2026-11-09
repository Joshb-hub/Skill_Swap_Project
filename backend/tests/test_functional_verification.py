import os
from datetime import datetime

import pytest
from sqlalchemy import select

from app.models import (
    Conversation,
    Message,
    Notification,
    PrivacyLevel,
    RefreshToken,
    Skill,
    SkillCategory,
    SkillSwap,
    SwapStatus,
    User,
    UserBlock,
    UserReport,
)


async def register_and_login(client, *, full_name, username, email, password="StrongPass!123"):
    payload = {
        "full_name": full_name,
        "username": username,
        "email": email,
        "password": password,
        "confirm_password": password,
        "profession": "Engineer",
        "country": "United States",
        "city": "Boston",
        "accept_terms": True,
    }
    reg_res = await client.post("/api/v1/auth/register", json=payload)
    assert reg_res.status_code == 201, reg_res.text
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"identifier": email, "password": password},
    )
    assert login_res.status_code == 200, login_res.text
    data = login_res.json()
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    return reg_res.json(), headers, data


@pytest.mark.asyncio
async def test_reporting_blocking_and_blocked_interactions(client, db_session):
    alice, alice_headers, _ = await register_and_login(
        client,
        full_name="Alice Example",
        username="alice_verify",
        email="alice.verify@example.com",
    )
    bob, bob_headers, _ = await register_and_login(
        client,
        full_name="Bob Example",
        username="bob_verify",
        email="bob.verify@example.com",
    )

    cat = SkillCategory(name="Development", slug="development", description="Skills")
    db_session.add(cat)
    await db_session.flush()
    skill_a = Skill(name="Python", category_id=cat.id, description="Python")
    skill_b = Skill(name="Design", category_id=cat.id, description="Design")
    db_session.add_all([skill_a, skill_b])
    await db_session.flush()

    report_res = await client.post(
        "/api/v1/reports",
        json={"reported_id": bob["id"], "category": "Harassment", "description": "Repeated disruption"},
        headers=alice_headers,
    )
    print("REPORT_STATUS", report_res.status_code, report_res.json())
    assert report_res.status_code == 201, report_res.text

    report_db = (await db_session.execute(
        select(UserReport).where(
            UserReport.reporter_id == alice["id"],
            UserReport.reported_id == bob["id"],
        )
    )).scalar_one_or_none()
    print("REPORT_DB", report_db is not None, report_db.status if report_db else None)
    assert report_db is not None

    block_res = await client.post(
        "/api/v1/reports/block",
        json={"blocked_id": bob["id"]},
        headers=alice_headers,
    )
    print("BLOCK_STATUS", block_res.status_code, block_res.json())
    assert block_res.status_code == 201, block_res.text

    block_db = (await db_session.execute(
        select(UserBlock).where(
            UserBlock.blocker_id == alice["id"],
            UserBlock.blocked_id == bob["id"],
        )
    )).scalar_one_or_none()
    print("BLOCK_DB", block_db is not None, block_db.id if block_db else None)
    assert block_db is not None

    blocked_request_from_b = await client.post(
        "/api/v1/requests",
        json={
            "receiver_id": alice["id"],
            "offered_skill_id": skill_a.id,
            "requested_skill_id": skill_b.id,
            "message": "I want to learn from you.",
        },
        headers=bob_headers,
    )
    print("BLOCKED_REQUEST_B", blocked_request_from_b.status_code, blocked_request_from_b.json())
    assert blocked_request_from_b.status_code == 403, blocked_request_from_b.text

    blocked_request_from_a = await client.post(
        "/api/v1/requests",
        json={
            "receiver_id": bob["id"],
            "offered_skill_id": skill_b.id,
            "requested_skill_id": skill_a.id,
            "message": "I want to learn from you.",
        },
        headers=alice_headers,
    )
    print("BLOCKED_REQUEST_A", blocked_request_from_a.status_code, blocked_request_from_a.json())
    assert blocked_request_from_a.status_code == 403, blocked_request_from_a.text


@pytest.mark.asyncio
async def test_privacy_visibility_and_account_deletion(client, db_session):
    alice, alice_headers, _ = await register_and_login(
        client,
        full_name="Alice Privacy",
        username="alice_privacy",
        email="alice.privacy@example.com",
    )
    bob, bob_headers, _ = await register_and_login(
        client,
        full_name="Bob Privacy",
        username="bob_privacy",
        email="bob.privacy@example.com",
    )

    privacy_update = await client.put(
        "/api/v1/settings/privacy",
        json={"email_privacy": "Visible After Request Acceptance", "phone_privacy": "Hidden"},
        headers=bob_headers,
    )
    print("PRIVACY_UPDATE", privacy_update.status_code, privacy_update.json())
    assert privacy_update.status_code == 200, privacy_update.text

    public_view_before_swap = await client.get(f"/api/v1/profiles/{bob['username']}", headers=alice_headers)
    print("PROFILE_BEFORE_SWAP", public_view_before_swap.status_code, public_view_before_swap.json())
    assert public_view_before_swap.status_code == 200
    assert public_view_before_swap.json()["email"] is None
    assert public_view_before_swap.json()["phone_number"] is None

    cat = SkillCategory(name="Language", slug="language", description="Language skill")
    db_session.add(cat)
    await db_session.flush()
    skill_a = Skill(name="Spanish", category_id=cat.id, description="Spanish")
    skill_b = Skill(name="Japanese", category_id=cat.id, description="Japanese")
    db_session.add_all([skill_a, skill_b])
    await db_session.flush()

    accepted_swap = SkillSwap(
        user_a_id=alice["id"],
        user_b_id=bob["id"],
        skill_a_id=skill_a.id,
        skill_b_id=skill_b.id,
        status=SwapStatus.ACTIVE,
    )
    db_session.add(accepted_swap)
    await db_session.commit()

    public_view_after_swap = await client.get(f"/api/v1/profiles/{bob['username']}", headers=alice_headers)
    print("PROFILE_AFTER_SWAP", public_view_after_swap.status_code, public_view_after_swap.json())
    assert public_view_after_swap.status_code == 200
    assert public_view_after_swap.json()["email"] == bob["email"]
    assert public_view_after_swap.json()["phone_number"] is None

    delete_res = await client.delete("/api/v1/users/me", headers=bob_headers)
    print("DELETE_ACCOUNT", delete_res.status_code, delete_res.json())
    assert delete_res.status_code == 200, delete_res.text

    user_row = await db_session.get(User, bob["id"])
    print("USER_DEACTIVATED_DB", user_row is not None, user_row.is_active if user_row else None)
    assert user_row is not None and user_row.is_active is False

    login_after_delete = await client.post(
        "/api/v1/auth/login",
        json={"identifier": bob["email"], "password": "StrongPass!123"},
    )
    print("LOGIN_AFTER_DELETE", login_after_delete.status_code, login_after_delete.json())
    assert login_after_delete.status_code == 403, login_after_delete.text


@pytest.mark.asyncio
async def test_notifications_preferences_read_status_sessions_and_logout(client, db_session):
    alice, alice_headers, _ = await register_and_login(
        client,
        full_name="Alice Alerts",
        username="alice_alerts",
        email="alice.alerts@example.com",
    )
    bob, bob_headers, _ = await register_and_login(
        client,
        full_name="Bob Alerts",
        username="bob_alerts",
        email="bob.alerts@example.com",
    )

    notif = Notification(
        user_id=alice["id"],
        type="request_updates",
        title="Skill request received",
        message="Your request has a new update.",
        link="/requests",
    )
    db_session.add(notif)
    await db_session.flush()
    print("NOTIFICATION_DB_ID", notif.id, notif.is_read)

    notifications_get = await client.get("/api/v1/notifications", headers=alice_headers)
    print("NOTIFICATIONS_GET", notifications_get.status_code, notifications_get.json())
    assert notifications_get.status_code == 200
    assert any(item["id"] == notif.id for item in notifications_get.json())

    prefs_update = await client.put(
        "/api/v1/settings/notifications/preferences",
        json={"request_updates": False, "messages": False},
        headers=alice_headers,
    )
    print("PREFS_UPDATE", prefs_update.status_code, prefs_update.json())
    assert prefs_update.status_code == 200, prefs_update.text

    prefs_get = await client.get("/api/v1/settings/notifications/preferences", headers=alice_headers)
    print("PREFS_GET", prefs_get.status_code, prefs_get.json())
    assert prefs_get.status_code == 200
    assert prefs_get.json()["request_updates"] is False
    assert prefs_get.json()["messages"] is False

    read_res = await client.post(f"/api/v1/notifications/{notif.id}/read", headers=alice_headers)
    print("NOTIFICATION_READ", read_res.status_code, read_res.json())
    assert read_res.status_code == 200, read_res.text

    notif_db = await db_session.get(Notification, notif.id)
    print("NOTIFICATION_DB_READ", notif_db is not None, notif_db.is_read if notif_db else None)
    assert notif_db is not None and notif_db.is_read is True

    sessions_get = await client.get("/api/v1/settings/sessions", headers=alice_headers)
    print("SESSIONS_GET", sessions_get.status_code, sessions_get.json())
    assert sessions_get.status_code == 200
    assert len(sessions_get.json()) >= 1
    session_id = sessions_get.json()[0]["id"]

    revoke_res = await client.delete(f"/api/v1/settings/sessions/{session_id}", headers=alice_headers)
    print("SESSION_REVOKE", revoke_res.status_code, revoke_res.json())
    assert revoke_res.status_code == 200

    token_row = await db_session.get(RefreshToken, session_id)
    print("SESSION_DB_REVOKED", token_row is not None, token_row.revoked if token_row else None)
    assert token_row is not None and token_row.revoked is True

    logout_res = await client.post("/api/v1/auth/logout", headers=alice_headers)
    print("LOGOUT", logout_res.status_code, logout_res.json())
    assert logout_res.status_code == 200, logout_res.text

    logout_db = (await db_session.execute(
        select(RefreshToken).where(RefreshToken.user_id == alice["id"], RefreshToken.revoked.is_(True))
    )).scalars().all()
    print("LOGOUT_DB_TOKENS_REVOKED", len(logout_db))
    assert len(logout_db) >= 1


@pytest.mark.asyncio
async def test_conversation_message_access_and_attachment_upload(client, db_session):
    alice, alice_headers, _ = await register_and_login(
        client,
        full_name="Alice Chat",
        username="alice_chat",
        email="alice.chat@example.com",
    )
    bob, bob_headers, _ = await register_and_login(
        client,
        full_name="Bob Chat",
        username="bob_chat",
        email="bob.chat@example.com",
    )

    conv = Conversation(user_a_id=alice["id"], user_b_id=bob["id"], is_active=True)
    db_session.add(conv)
    await db_session.flush()

    msg = Message(
        conversation_id=conv.id,
        sender_id=alice["id"],
        content="hello there",
        message_type="text",
        is_read=False,
    )
    db_session.add(msg)
    await db_session.flush()

    messages_get = await client.get(f"/api/v1/messages/{conv.id}", headers=alice_headers)
    print("MESSAGES_GET", messages_get.status_code, messages_get.json())
    assert messages_get.status_code == 200
    assert len(messages_get.json()) == 1

    test_file = b"fake-image-bytes"
    attachment_res = await client.post(
        f"/api/v1/messages/{conv.id}/attachment",
        files={"file": ("avatar.png", test_file, "image/png")},
        headers=alice_headers,
    )
    print("ATTACHMENT_UPLOAD", attachment_res.status_code, attachment_res.json())
    assert attachment_res.status_code == 200, attachment_res.text
    attachment_db = (await db_session.execute(
        select(Message).where(Message.conversation_id == conv.id).order_by(Message.created_at.desc())
    )).scalars().first()
    print("ATTACHMENT_DB", attachment_db is not None, attachment_db.file_url if attachment_db else None)
    assert attachment_db is not None and attachment_db.file_url is not None

    charlie, charlie_headers, _ = await register_and_login(
        client,
        full_name="Charlie Chat",
        username="charlie_chat",
        email="charlie.chat@example.com",
    )
    unauthorized = await client.get(f"/api/v1/messages/{conv.id}", headers=charlie_headers)
    print("UNAUTHORIZED_CONVERSATION", unauthorized.status_code, unauthorized.json())
    assert unauthorized.status_code == 403, unauthorized.text
