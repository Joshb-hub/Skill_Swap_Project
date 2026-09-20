from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, SkillSwap, Skill, LearningSession, SessionStatus
from app.schemas import SessionCreate, SessionUpdate, SessionResponse, MessageSuccessResponse
from app.api.dependencies.auth import get_current_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/sessions", tags=["Learning Sessions"])


@router.get("", response_model=List[SessionResponse])
async def get_my_sessions(
    swap_id: Optional[str] = None,
    status_filter: Optional[SessionStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(LearningSession)
        .join(LearningSession.swap)
        .where(
            or_(
                SkillSwap.user_a_id == current_user.id,
                SkillSwap.user_b_id == current_user.id
            )
        )
        .options(
            selectinload(LearningSession.scheduled_by).selectinload(User.profile),
            selectinload(LearningSession.skill),
        )
        .order_by(LearningSession.date_time.asc())
    )
    if swap_id:
        stmt = stmt.where(LearningSession.swap_id == swap_id)
    if status_filter:
        stmt = stmt.where(LearningSession.status == status_filter)

    res = await db.execute(stmt)
    sessions = res.scalars().all()

    return [
        SessionResponse(
            id=s.id,
            swap_id=s.swap_id,
            scheduled_by_id=s.scheduled_by_id,
            scheduled_by_name=s.scheduled_by.profile.full_name if s.scheduled_by.profile else s.scheduled_by.username,
            skill_id=s.skill_id,
            skill_name=s.skill.name if s.skill else "Skill",
            title=s.title,
            date_time=s.date_time,
            duration_minutes=s.duration_minutes,
            notes=s.notes,
            meeting_link=s.meeting_link,
            status=s.status,
            created_at=s.created_at
        )
        for s in sessions
    ]


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def schedule_session(
    session_in: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify participant in swap
    swap = await db.get(SkillSwap, session_in.swap_id)
    if not swap or (swap.user_a_id != current_user.id and swap.user_b_id != current_user.id):
        raise HTTPException(status_code=403, detail="Unauthorized to schedule sessions for this swap")

    partner_id = swap.user_b_id if swap.user_a_id == current_user.id else swap.user_a_id

    skill = await db.get(Skill, session_in.skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    new_session = LearningSession(
        swap_id=session_in.swap_id,
        scheduled_by_id=current_user.id,
        skill_id=session_in.skill_id,
        title=session_in.title,
        date_time=session_in.date_time,
        duration_minutes=session_in.duration_minutes,
        notes=session_in.notes,
        meeting_link=session_in.meeting_link,
        status=SessionStatus.UPCOMING
    )
    db.add(new_session)
    await db.flush()

    # Notify partner
    scheduler_name = current_user.profile.full_name if current_user.profile else current_user.username
    await create_notification(
        db=db,
        user_id=partner_id,
        type="session_scheduled",
        title="New Learning Session Scheduled!",
        message=f"{scheduler_name} scheduled a session: '{session_in.title}' on {session_in.date_time.strftime('%b %d at %I:%M %p')}.",
        link="/sessions"
    )
    await db.commit()

    return SessionResponse(
        id=new_session.id,
        swap_id=new_session.swap_id,
        scheduled_by_id=current_user.id,
        scheduled_by_name=scheduler_name,
        skill_id=skill.id,
        skill_name=skill.name,
        title=new_session.title,
        date_time=new_session.date_time,
        duration_minutes=new_session.duration_minutes,
        notes=new_session.notes,
        meeting_link=new_session.meeting_link,
        status=new_session.status,
        created_at=new_session.created_at
    )


@router.put("/{session_id}", response_model=MessageSuccessResponse)
async def update_session(
    session_id: str,
    update_in: SessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LearningSession).where(LearningSession.id == session_id).options(selectinload(LearningSession.swap))
    session = (await db.execute(stmt)).scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.swap.user_a_id != current_user.id and session.swap.user_b_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    data = update_in.model_dump(exclude_unset=True)
    rescheduled = "date_time" in data and data["date_time"] != session.date_time

    for field, val in data.items():
        setattr(session, field, val)

    if rescheduled:
        partner_id = session.swap.user_b_id if session.swap.user_a_id == current_user.id else session.swap.user_a_id
        await create_notification(
            db=db,
            user_id=partner_id,
            type="session_rescheduled",
            title="Session Rescheduled",
            message=f"A learning session '{session.title}' was updated.",
            link="/sessions"
        )

    await db.commit()
    return MessageSuccessResponse(message="Session updated successfully")
