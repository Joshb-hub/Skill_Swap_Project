from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Profile, User, SkillSwap, PrivacyLevel, SwapStatus


async def has_accepted_swap_between(
    db: AsyncSession,
    user_a_id: str,
    user_b_id: str
) -> bool:
    """Check if two users share an active or completed skill swap."""
    stmt = select(SkillSwap).where(
        (
            (SkillSwap.user_a_id == user_a_id) & (SkillSwap.user_b_id == user_b_id)
        ) | (
            (SkillSwap.user_a_id == user_b_id) & (SkillSwap.user_b_id == user_a_id)
        )
    ).where(
        SkillSwap.status.in_([SwapStatus.ACTIVE, SwapStatus.COMPLETED])
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


def get_visible_contact_info(
    profile: Profile,
    user: User,
    viewer_id: Optional[str] = None,
    has_active_swap: bool = False
) -> Tuple[Optional[str], Optional[str]]:
    """
    Determine whether viewer is allowed to see the profile user's email and phone number.
    Strict backend enforcement:
    - Never exposed publicly or in search results.
    - Owner can always see their own info.
    - If viewer is in an accepted/active swap, revealed only if setting is VISIBLE_AFTER_ACCEPTANCE.
    - If HIDDEN or VISIBLE_WITH_PERMISSION (without explicit grant), returns None.
    """
    if viewer_id and viewer_id == user.id:
        return user.email, profile.phone_number

    visible_email = None
    visible_phone = None

    if has_active_swap:
        if profile.email_privacy == PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE:
            visible_email = user.email
        if profile.phone_privacy == PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE:
            visible_phone = profile.phone_number

    return visible_email, visible_phone
