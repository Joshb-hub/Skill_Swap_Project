from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, SkillSwap, Conversation, LearningProgress, SwapStatus
from app.schemas import SkillSwapResponse, MessageSuccessResponse
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/swaps", tags=["Skill Swaps"])


@router.get("", response_model=List[SkillSwapResponse])
async def get_my_swaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(SkillSwap)
        .where(
            or_(
                SkillSwap.user_a_id == current_user.id,
                SkillSwap.user_b_id == current_user.id
            )
        )
        .options(
            selectinload(SkillSwap.user_a).selectinload(User.profile),
            selectinload(SkillSwap.user_b).selectinload(User.profile),
            selectinload(SkillSwap.skill_a),
            selectinload(SkillSwap.skill_b),
            selectinload(SkillSwap.conversation),
            selectinload(SkillSwap.progress_records),
        )
        .order_by(SkillSwap.started_at.desc())
    )
    res = await db.execute(stmt)
    swaps = res.scalars().all()

    result = []
    for s in swaps:
        is_user_a = s.user_a_id == current_user.id
        partner = s.user_b if is_user_a else s.user_a
        partner_prof = partner.profile if partner else None

        i_teach_skill = s.skill_a.name if is_user_a else s.skill_b.name
        i_learn_skill = s.skill_b.name if is_user_a else s.skill_a.name

        # Calculate progress for current user
        my_progress = next((p for p in s.progress_records if p.user_id == current_user.id), None)

        result.append(
            SkillSwapResponse(
                id=s.id,
                request_id=s.request_id,
                partner_id=partner.id if partner else "",
                partner_username=partner.username if partner else "partner",
                partner_name=partner_prof.full_name if partner_prof else "Partner",
                partner_avatar=partner_prof.avatar_url if partner_prof else None,
                partner_profession=partner_prof.profession if partner_prof else "Professional",
                i_teach_skill=i_teach_skill,
                i_learn_skill=i_learn_skill,
                status=s.status,
                conversation_id=s.conversation.id if s.conversation else None,
                started_at=s.started_at,
                progress_percentage=my_progress.progress_percentage if my_progress else 0,
                completed_sessions=my_progress.completed_sessions if my_progress else 0,
                total_sessions=my_progress.total_sessions if my_progress else 10,
            )
        )
    return result


@router.post("/{swap_id}/complete", response_model=MessageSuccessResponse)
async def complete_skill_swap(
    swap_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SkillSwap).where(SkillSwap.id == swap_id)
    swap = (await db.execute(stmt)).scalar_one_or_none()

    if not swap:
        raise HTTPException(status_code=404, detail="Skill swap not found")

    if swap.user_a_id != current_user.id and swap.user_b_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to manage this skill swap")

    swap.status = SwapStatus.COMPLETED
    swap.completed_at = datetime.now(timezone.utc)
    await db.commit()

    return MessageSuccessResponse(message="Skill swap marked as completed! You can now submit a review.")
