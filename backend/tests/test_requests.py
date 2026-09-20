import pytest
from app.models import User, Profile, Skill, SkillCategory
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_swap_request_lifecycle(client, db_session):
    # Setup test users and skills in DB
    cat = SkillCategory(name="Trades", slug="trades")
    db_session.add(cat)
    await db_session.flush()

    s1 = Skill(category_id=cat.id, name="Carpentry")
    s2 = Skill(category_id=cat.id, name="Plumbing")
    db_session.add_all([s1, s2])
    await db_session.flush()

    user_a = User(email="a@test.com", username="usera", hashed_password=get_password_hash("Pass123!"), is_active=True, is_verified=True)
    user_b = User(email="b@test.com", username="userb", hashed_password=get_password_hash("Pass123!"), is_active=True, is_verified=True)
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    prof_a = Profile(user_id=user_a.id, full_name="User A", profession="Carpenter")
    prof_b = Profile(user_id=user_b.id, full_name="User B", profession="Plumber")
    db_session.add_all([prof_a, prof_b])
    await db_session.commit()

    token_a = create_access_token(user_a.id)
    token_b = create_access_token(user_b.id)
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Prevent self-request
    self_res = await client.post("/api/requests", headers=headers_a, json={
        "receiver_id": user_a.id,
        "offered_skill_id": s1.id,
        "requested_skill_id": s2.id
    })
    assert self_res.status_code == 400
    assert "yourself" in self_res.json()["detail"]

    # 2. Valid request from A to B
    req_res = await client.post("/api/requests", headers=headers_a, json={
        "receiver_id": user_b.id,
        "offered_skill_id": s1.id,
        "requested_skill_id": s2.id,
        "message": "Let's trade carpentry for plumbing tips!"
    })
    assert req_res.status_code == 201
    req_data = req_res.json()
    req_id = req_data["id"]
    assert req_data["status"] == "Pending"

    # 3. Duplicate request prevention
    dup_res = await client.post("/api/requests", headers=headers_a, json={
        "receiver_id": user_b.id,
        "offered_skill_id": s1.id,
        "requested_skill_id": s2.id
    })
    assert dup_res.status_code == 400
    assert "already pending" in dup_res.json()["detail"]

    # 4. User A cannot accept their own sent request
    unauth_accept = await client.post(f"/api/requests/{req_id}/accept", headers=headers_a)
    assert unauth_accept.status_code == 403

    # 5. User B accepts the request
    accept_res = await client.post(f"/api/requests/{req_id}/accept", headers=headers_b)
    assert accept_res.status_code == 200
    assert accept_res.json()["success"] is True

    # 6. Verify active skill swap is returned in /api/swaps
    swaps_res = await client.get("/api/swaps", headers=headers_a)
    assert swaps_res.status_code == 200
    swaps = swaps_res.json()
    assert len(swaps) == 1
    assert swaps[0]["partner_username"] == "userb"
    assert swaps[0]["status"] == "Active"
