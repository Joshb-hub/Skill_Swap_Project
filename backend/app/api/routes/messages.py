import os
import uuid
import aiofiles
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.models import Conversation, Message, User, MessageType
from app.schemas import MessageResponse, MessageCreate
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/{conversation_id}", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Strict Authorization: Check conversation membership
    conv = await db.get(Conversation, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv.user_a_id != current_user.id and conv.user_b_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not a participant in this conversation"
        )

    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .options(selectinload(Message.sender).selectinload(User.profile))
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(stmt)
    messages = res.scalars().all()

    result = []
    for m in messages:
        sender_prof = m.sender.profile if m.sender else None
        result.append(
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                sender_id=m.sender_id,
                sender_name=sender_prof.full_name if sender_prof else m.sender.username,
                sender_avatar=sender_prof.avatar_url if sender_prof else None,
                content=m.content,
                message_type=m.message_type,
                file_url=m.file_url,
                is_read=m.is_read,
                read_at=m.read_at,
                created_at=m.created_at
            )
        )
    return result


@router.post("/{conversation_id}/attachment", response_model=MessageResponse)
async def upload_chat_attachment(
    conversation_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or (conv.user_a_id != current_user.id and conv.user_b_id != current_user.id):
        raise HTTPException(status_code=403, detail="Unauthorized")

    filename = file.filename or "attachment"
    ext = filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '.{ext}' is not allowed. Supported: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # Read and check file size
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    safe_filename = f"{uuid.uuid4().hex}_{os.path.basename(filename)}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    file_url = f"/api/uploads/{safe_filename}"
    is_img = ext in ["jpg", "jpeg", "png", "webp", "gif"]
    msg_type = MessageType.IMAGE if is_img else MessageType.FILE

    new_msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=f"Shared attachment: {filename}",
        message_type=msg_type,
        file_url=file_url,
        is_read=False
    )
    db.add(new_msg)
    await db.commit()
    await db.refresh(new_msg)

    sender_prof = current_user.profile
    return MessageResponse(
        id=new_msg.id,
        conversation_id=new_msg.conversation_id,
        sender_id=current_user.id,
        sender_name=sender_prof.full_name if sender_prof else current_user.username,
        sender_avatar=sender_prof.avatar_url if sender_prof else None,
        content=new_msg.content,
        message_type=new_msg.message_type,
        file_url=new_msg.file_url,
        is_read=False,
        read_at=None,
        created_at=new_msg.created_at
    )
