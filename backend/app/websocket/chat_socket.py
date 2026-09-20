import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.core.security import decode_token
from app.models import Conversation, Message, User, MessageType
from app.websocket.connection_manager import manager

logger = logging.getLogger("skillswap.websocket")
ws_router = APIRouter()


@ws_router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    conversation_id: str,
    token: str = Query(...)
):
    # 1. Authenticate user from token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Verify conversation membership in DB
    async with AsyncSessionLocal() as db:
        stmt = (
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(
                selectinload(Conversation.user_a),
                selectinload(Conversation.user_b)
            )
        )
        res = await db.execute(stmt)
        conversation = res.scalar_one_or_none()

        if not conversation:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        if conversation.user_a_id != user_id and conversation.user_b_id != user_id:
            logger.warning(f"Unauthorized chat access attempt: User {user_id} to Conv {conversation_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Fetch current user for display details
        user_res = await db.execute(
            select(User).where(User.id == user_id).options(selectinload(User.profile))
        )
        current_user = user_res.scalar_one()
        user_name = current_user.profile.full_name if current_user.profile else current_user.username
        user_avatar = current_user.profile.avatar_url if current_user.profile else None

    # 3. Connect to room
    await manager.connect(websocket, conversation_id, user_id)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
            except Exception:
                continue

            action = data.get("type", "message")

            if action == "message":
                content = data.get("content", "").strip()
                msg_type_str = data.get("message_type", "text")
                file_url = data.get("file_url")

                if not content and not file_url:
                    continue

                try:
                    msg_type = MessageType(msg_type_str)
                except ValueError:
                    msg_type = MessageType.TEXT

                # Persist message to DB
                async with AsyncSessionLocal() as db:
                    new_msg = Message(
                        conversation_id=conversation_id,
                        sender_id=user_id,
                        content=content or (file_url if file_url else ""),
                        message_type=msg_type,
                        file_url=file_url,
                        is_read=False
                    )
                    db.add(new_msg)
                    await db.commit()
                    await db.refresh(new_msg)

                    payload = {
                        "type": "message",
                        "message": {
                            "id": new_msg.id,
                            "conversation_id": conversation_id,
                            "sender_id": user_id,
                            "sender_name": user_name,
                            "sender_avatar": user_avatar,
                            "content": new_msg.content,
                            "message_type": new_msg.message_type.value,
                            "file_url": new_msg.file_url,
                            "is_read": False,
                            "created_at": new_msg.created_at.isoformat(),
                        }
                    }

                # Broadcast to all clients in conversation
                await manager.broadcast_to_room(conversation_id, payload)

            elif action == "typing":
                is_typing = bool(data.get("is_typing", False))
                await manager.broadcast_to_room(conversation_id, {
                    "type": "typing",
                    "user_id": user_id,
                    "sender_name": user_name,
                    "is_typing": is_typing,
                })

            elif action == "read":
                # Mark messages as read
                async with AsyncSessionLocal() as db:
                    now = datetime.now(timezone.utc)
                    stmt = select(Message).where(
                        Message.conversation_id == conversation_id,
                        Message.sender_id != user_id,
                        Message.is_read == False
                    )
                    unread_msgs = (await db.execute(stmt)).scalars().all()
                    for m in unread_msgs:
                        m.is_read = True
                        m.read_at = now
                    await db.commit()

                await manager.broadcast_to_room(conversation_id, {
                    "type": "read",
                    "user_id": user_id,
                    "read_at": now.isoformat()
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id, user_id)
        await manager.broadcast_to_room(conversation_id, {
            "type": "presence",
            "user_id": user_id,
            "status": "offline"
        })
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket, conversation_id, user_id)
