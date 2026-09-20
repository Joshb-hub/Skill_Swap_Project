from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import (
    User, Profile, Conversation, Message, SkillSwap,
    LearningProgress, LearningSession, SessionStatus
)
from app.schemas import ConversationResponse, ChatPartnerProfileResponse, MessageSuccessResponse
from app.api.dependencies.auth import get_current_user
from app.websocket.connection_manager import manager
from app.services.privacy_service import get_visible_contact_info

router = APIRouter(prefix="/conversations", tags=["Chat Conversations"])


@router.get("", response_model=List[ConversationResponse])
async def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Conversation)
        .where(
            or_(
                Conversation.user_a_id == current_user.id,
                Conversation.user_b_id == current_user.id
            )
        )
        .where(Conversation.is_active == True)
        .options(
            selectinload(Conversation.user_a).selectinload(User.profile),
            selectinload(Conversation.user_b).selectinload(User.profile),
            selectinload(Conversation.swap).selectinload(SkillSwap.skill_a),
            selectinload(Conversation.swap).selectinload(SkillSwap.skill_b),
        )
        .order_by(Conversation.updated_at.desc())
    )
    res = await db.execute(stmt)
    conversations = res.scalars().all()

    result = []
    for conv in conversations:
        is_user_a = conv.user_a_id == current_user.id
        partner = conv.user_b if is_user_a else conv.user_a
        partner_prof = partner.profile if partner else None

        # Fetch last message
        last_msg_stmt = (
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = (await db.execute(last_msg_stmt)).scalar_one_or_none()

        # Count unread messages sent to current user
        unread_stmt = (
            select(func.count(Message.id))
            .where(
                Message.conversation_id == conv.id,
                Message.sender_id != current_user.id,
                Message.is_read == False
            )
        )
        unread_count = (await db.execute(unread_stmt)).scalar() or 0

        i_teach = None
        they_teach = None
        if conv.swap:
            i_teach = conv.swap.skill_a.name if is_user_a else conv.swap.skill_b.name
            they_teach = conv.swap.skill_b.name if is_user_a else conv.swap.skill_a.name

        result.append(
            ConversationResponse(
                id=conv.id,
                swap_id=conv.swap_id,
                partner_id=partner.id if partner else "",
                partner_username=partner.username if partner else "partner",
                partner_name=partner_prof.full_name if partner_prof else "Partner",
                partner_avatar=partner_prof.avatar_url if partner_prof else None,
                partner_profession=partner_prof.profession if partner_prof else "Professional",
                is_online=manager.is_user_online(partner.id if partner else ""),
                last_message=last_msg.content if last_msg else "No messages yet",
                last_message_time=last_msg.created_at if last_msg else conv.created_at,
                unread_count=unread_count,
                i_teach=i_teach,
                they_teach=they_teach
            )
        )
    return result


@router.get("/{conversation_id}/partner-profile", response_model=ChatPartnerProfileResponse)
async def get_chat_partner_profile(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Strict Authorization check
    stmt = (
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(
            selectinload(Conversation.user_a).selectinload(User.profile),
            selectinload(Conversation.user_b).selectinload(User.profile),
            selectinload(Conversation.swap).selectinload(SkillSwap.skill_a),
            selectinload(Conversation.swap).selectinload(SkillSwap.skill_b),
        )
    )
    conv = (await db.execute(stmt)).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conv.user_a_id != current_user.id and conv.user_b_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You do not have access to this conversation")

    is_user_a = conv.user_a_id == current_user.id
    partner = conv.user_b if is_user_a else conv.user_a
    partner_prof = partner.profile

    # Determine skills exchanged
    i_can_teach = conv.swap.skill_a.name if (conv.swap and is_user_a) else (conv.swap.skill_b.name if conv.swap else "N/A")
    i_want_to_learn = conv.swap.skill_b.name if (conv.swap and is_user_a) else (conv.swap.skill_a.name if conv.swap else "N/A")
    they_can_teach = i_want_to_learn
    they_want_to_learn = i_can_teach

    # Contact Privacy check: Is email/phone permitted to be visible?
    visible_email, visible_phone = get_visible_contact_info(
        profile=partner_prof,
        user=partner,
        viewer_id=current_user.id,
        has_active_swap=True if conv.swap else False
    )

    # Fetch progress
    progress_val = 0
    comp_sessions = 0
    total_sess = 10
    if conv.swap:
        prog_stmt = select(LearningProgress).where(
            LearningProgress.swap_id == conv.swap.id,
            LearningProgress.user_id == current_user.id
        )
        prog = (await db.execute(prog_stmt)).scalar_one_or_none()
        if prog:
            progress_val = prog.progress_percentage
            comp_sessions = prog.completed_sessions
            total_sess = prog.total_sessions

    # Fetch next upcoming session
    next_sess_dict = None
    if conv.swap:
        sess_stmt = (
            select(LearningSession)
            .where(
                LearningSession.swap_id == conv.swap.id,
                LearningSession.status == SessionStatus.UPCOMING
            )
            .order_by(LearningSession.date_time.asc())
            .limit(1)
        )
        sess = (await db.execute(sess_stmt)).scalar_one_or_none()
        if sess:
            next_sess_dict = {
                "id": sess.id,
                "title": sess.title,
                "date_time": sess.date_time.isoformat(),
                "duration_minutes": sess.duration_minutes,
                "meeting_link": sess.meeting_link
            }

    return ChatPartnerProfileResponse(
        partner_id=partner.id,
        partner_username=partner.username,
        partner_name=partner_prof.full_name if partner_prof else partner.username,
        partner_avatar=partner_prof.avatar_url if partner_prof else None,
        partner_profession=partner_prof.profession if partner_prof else "Professional",
        partner_email=visible_email,
        partner_phone=visible_phone,
        i_can_teach=i_can_teach,
        i_want_to_learn=i_want_to_learn,
        they_can_teach=they_can_teach,
        they_want_to_learn=they_want_to_learn,
        current_progress=progress_val,
        completed_sessions=comp_sessions,
        total_sessions=total_sess,
        upcoming_session=next_sess_dict,
        learning_goals=[
            {"goal": f"Master fundamental concepts in {i_want_to_learn}", "done": progress_val >= 33},
            {"goal": f"Complete hands-on collaborative exercises", "done": progress_val >= 66},
            {"goal": f"Final practical project review", "done": progress_val >= 100},
        ]
    )


@router.post("/{conversation_id}/read", response_model=MessageSuccessResponse)
async def mark_conversation_as_read(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify membership
    conv = await db.get(Conversation, conversation_id)
    if not conv or (conv.user_a_id != current_user.id and conv.user_b_id != current_user.id):
        raise HTTPException(status_code=403, detail="Unauthorized")

    stmt = select(Message).where(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    )
    messages = (await db.execute(stmt)).scalars().all()
    now = datetime.now(timezone.utc)
    for m in messages:
        m.is_read = True
        m.read_at = now
    await db.commit()

    return MessageSuccessResponse(message="Messages marked as read")
