from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Notification


async def create_notification(
    db: AsyncSession,
    user_id: str,
    type: str,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Notification:
    """Create and persist an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link
    )
    db.add(notif)
    await db.flush()
    return notif
