import pytest
from app.models import User, Profile, Conversation
from app.core.security import get_password_hash, create_access_token


@pytest.mark.asyncio
async def test_chat_access_control(client, db_session):
    # Create 3 users: A and B are in conversation; C is an outsider
    user_a = User(email="ca@test.com", username="chat_a", hashed_password=get_password_hash("Pass123!"), is_active=True)
    user_b = User(email="cb@test.com", username="chat_b", hashed_password=get_password_hash("Pass123!"), is_active=True)
    user_c = User(email="cc@test.com", username="chat_c", hashed_password=get_password_hash("Pass123!"), is_active=True)
    db_session.add_all([user_a, user_b, user_c])
    await db_session.flush()

    conv = Conversation(user_a_id=user_a.id, user_b_id=user_b.id, is_active=True)
    db_session.add(conv)
    await db_session.commit()

    token_c = create_access_token(user_c.id)
    token_a = create_access_token(user_a.id)

    # 1. Outsider (User C) attempting to view messages of A & B's conversation -> 403 Forbidden
    headers_c = {"Authorization": f"Bearer {token_c}"}
    forbidden_res = await client.get(f"/api/messages/{conv.id}", headers=headers_c)
    assert forbidden_res.status_code == 403

    # 2. Member (User A) viewing messages -> 200 OK
    headers_a = {"Authorization": f"Bearer {token_a}"}
    allowed_res = await client.get(f"/api/messages/{conv.id}", headers=headers_a)
    assert allowed_res.status_code == 200
