from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, Notification
from app.schemas import NotificationResponse, MessageSuccessResponse
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/{notification_id}/read", response_model=MessageSuccessResponse)
async def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    notif = (await db.execute(stmt)).scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    await db.commit()
    return MessageSuccessResponse(message="Notification marked as read")


@router.post("/read-all", response_model=MessageSuccessResponse)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    notifs = (await db.execute(stmt)).scalars().all()
    for n in notifs:
        n.is_read = True
    await db.commit()
    return MessageSuccessResponse(message="All notifications marked as read")
