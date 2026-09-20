from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import (
    User, Skill, SkillSwapRequest, SkillSwap, Conversation,
    LearningProgress, ProgressMilestone, MilestoneStatus,
    RequestStatus, SwapStatus, UserBlock
)
from app.schemas import SwapRequestCreate, SwapRequestResponse, MessageSuccessResponse
from app.api.dependencies.auth import get_current_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/requests", tags=["Skill Swap Requests"])


@router.post("", response_model=SwapRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_swap_request(
    req_in: SwapRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Prevent self-request
    if req_in.receiver_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send a skill swap request to yourself")

    # 2. Check if receiver exists
    receiver = await db.get(User, req_in.receiver_id)
    if not receiver or not receiver.is_active:
        raise HTTPException(status_code=404, detail="Receiver user not found or inactive")

    # 3. Check for blocks
    block_stmt = select(UserBlock).where(
        or_(
            and_(UserBlock.blocker_id == current_user.id, UserBlock.blocked_id == req_in.receiver_id),
            and_(UserBlock.blocker_id == req_in.receiver_id, UserBlock.blocked_id == current_user.id)
        )
    )
    if (await db.execute(block_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Unable to send request due to user block restrictions")

    # 4. Check for duplicate pending requests
    dup_stmt = select(SkillSwapRequest).where(
        SkillSwapRequest.sender_id == current_user.id,
        SkillSwapRequest.receiver_id == req_in.receiver_id,
        SkillSwapRequest.status == RequestStatus.PENDING
    )
    if (await db.execute(dup_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An active swap request is already pending with this user")

    # 5. Validate skills
    offered_skill = await db.get(Skill, req_in.offered_skill_id)
    requested_skill = await db.get(Skill, req_in.requested_skill_id)
    if not offered_skill or not requested_skill:
        raise HTTPException(status_code=404, detail="One or more specified skills not found")

    # 6. Create request
    new_request = SkillSwapRequest(
        sender_id=current_user.id,
        receiver_id=req_in.receiver_id,
        offered_skill_id=req_in.offered_skill_id,
        requested_skill_id=req_in.requested_skill_id,
        message=req_in.message,
        status=RequestStatus.PENDING
    )
    db.add(new_request)
    await db.flush()

    # Notify receiver
    sender_name = current_user.profile.full_name if current_user.profile else current_user.username
    await create_notification(
        db=db,
        user_id=req_in.receiver_id,
        type="new_request",
        title="New Skill Swap Request!",
        message=f"{sender_name} wants to exchange skills with you: {offered_skill.name} for {requested_skill.name}.",
        link="/requests"
    )
    await db.commit()

    # Fetch loaded request for response
    stmt = (
        select(SkillSwapRequest)
        .where(SkillSwapRequest.id == new_request.id)
        .options(
            selectinload(SkillSwapRequest.sender).selectinload(User.profile),
            selectinload(SkillSwapRequest.receiver).selectinload(User.profile),
            selectinload(SkillSwapRequest.offered_skill),
            selectinload(SkillSwapRequest.requested_skill),
        )
    )
    full_req = (await db.execute(stmt)).scalar_one()

    return _build_request_response(full_req)


@router.get("/received", response_model=List[SwapRequestResponse])
async def get_received_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(SkillSwapRequest)
        .where(SkillSwapRequest.receiver_id == current_user.id)
        .options(
            selectinload(SkillSwapRequest.sender).selectinload(User.profile),
            selectinload(SkillSwapRequest.receiver).selectinload(User.profile),
            selectinload(SkillSwapRequest.offered_skill),
            selectinload(SkillSwapRequest.requested_skill),
        )
        .order_by(SkillSwapRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return [_build_request_response(r) for r in res.scalars().all()]


@router.get("/sent", response_model=List[SwapRequestResponse])
async def get_sent_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(SkillSwapRequest)
        .where(SkillSwapRequest.sender_id == current_user.id)
        .options(
            selectinload(SkillSwapRequest.sender).selectinload(User.profile),
            selectinload(SkillSwapRequest.receiver).selectinload(User.profile),
            selectinload(SkillSwapRequest.offered_skill),
            selectinload(SkillSwapRequest.requested_skill),
        )
        .order_by(SkillSwapRequest.created_at.desc())
    )
    res = await db.execute(stmt)
    return [_build_request_response(r) for r in res.scalars().all()]


@router.post("/{request_id}/accept", response_model=MessageSuccessResponse)
async def accept_swap_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SkillSwapRequest).where(
        SkillSwapRequest.id == request_id
    ).options(
        selectinload(SkillSwapRequest.sender).selectinload(User.profile),
        selectinload(SkillSwapRequest.offered_skill),
        selectinload(SkillSwapRequest.requested_skill)
    )
    res = await db.execute(stmt)
    req = res.scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the intended receiver may accept this request")

    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail=f"Cannot accept request with status '{req.status.value}'")

    req.status = RequestStatus.ACCEPTED

    # 1. Create Active SkillSwap
    swap = SkillSwap(
        request_id=req.id,
        user_a_id=req.sender_id,
        user_b_id=req.receiver_id,
        skill_a_id=req.offered_skill_id,
        skill_b_id=req.requested_skill_id,
        status=SwapStatus.ACTIVE
    )
    db.add(swap)
    await db.flush()

    # 2. Create or activate Conversation
    conv_stmt = select(Conversation).where(
        or_(
            and_(Conversation.user_a_id == req.sender_id, Conversation.user_b_id == req.receiver_id),
            and_(Conversation.user_a_id == req.receiver_id, Conversation.user_b_id == req.sender_id)
        )
    )
    existing_conv = (await db.execute(conv_stmt)).scalar_one_or_none()
    if not existing_conv:
        conv = Conversation(
            swap_id=swap.id,
            user_a_id=req.sender_id,
            user_b_id=req.receiver_id,
            is_active=True
        )
        db.add(conv)
    else:
        existing_conv.swap_id = swap.id
        existing_conv.is_active = True

    # 3. Create Learning Progress & Milestones for both users
    # User A learns skill_b
    prog_a = LearningProgress(
        swap_id=swap.id,
        user_id=req.sender_id,
        skill_id=req.requested_skill_id,
        progress_percentage=0,
        total_sessions=10,
        completed_sessions=0
    )
    db.add(prog_a)
    await db.flush()

    m1 = ProgressMilestone(progress_id=prog_a.id, title="Fundamentals & Overview", status=MilestoneStatus.IN_PROGRESS, order=1)
    m2 = ProgressMilestone(progress_id=prog_a.id, title="Hands-on Practice", status=MilestoneStatus.UPCOMING, order=2)
    m3 = ProgressMilestone(progress_id=prog_a.id, title="Final Exchange Project", status=MilestoneStatus.UPCOMING, order=3)
    db.add_all([m1, m2, m3])

    # User B learns skill_a
    prog_b = LearningProgress(
        swap_id=swap.id,
        user_id=req.receiver_id,
        skill_id=req.offered_skill_id,
        progress_percentage=0,
        total_sessions=10,
        completed_sessions=0
    )
    db.add(prog_b)
    await db.flush()

    mb1 = ProgressMilestone(progress_id=prog_b.id, title="Foundations & Orientation", status=MilestoneStatus.IN_PROGRESS, order=1)
    mb2 = ProgressMilestone(progress_id=prog_b.id, title="Skill Application", status=MilestoneStatus.UPCOMING, order=2)
    mb3 = ProgressMilestone(progress_id=prog_b.id, title="Milestone Review & Next Steps", status=MilestoneStatus.UPCOMING, order=3)
    db.add_all([mb1, mb2, mb3])

    # 4. Notify sender
    receiver_name = current_user.profile.full_name if current_user.profile else current_user.username
    await create_notification(
        db=db,
        user_id=req.sender_id,
        type="request_accepted",
        title="Skill Swap Request Accepted!",
        message=f"{receiver_name} accepted your skill swap request! Chat and session scheduling are now unlocked.",
        link=f"/swaps"
    )

    await db.commit()
    return MessageSuccessResponse(message="Skill swap request accepted successfully! Swap and chat are active.")


@router.post("/{request_id}/decline", response_model=MessageSuccessResponse)
async def decline_swap_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SkillSwapRequest).where(SkillSwapRequest.id == request_id)
    req = (await db.execute(stmt)).scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.receiver_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the intended receiver may decline this request")

    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only decline pending requests")

    req.status = RequestStatus.DECLINED
    await db.commit()
    return MessageSuccessResponse(message="Skill swap request declined.")


@router.post("/{request_id}/cancel", response_model=MessageSuccessResponse)
async def cancel_swap_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(SkillSwapRequest).where(SkillSwapRequest.id == request_id)
    req = (await db.execute(stmt)).scalar_one_or_none()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the sender may cancel this request")

    if req.status != RequestStatus.PENDING:
        raise HTTPException(status_code=400, detail="Can only cancel pending requests")

    req.status = RequestStatus.CANCELLED
    await db.commit()
    return MessageSuccessResponse(message="Skill swap request cancelled.")


def _build_request_response(req: SkillSwapRequest) -> SwapRequestResponse:
    sender_prof = req.sender.profile if req.sender else None
    receiver_prof = req.receiver.profile if req.receiver else None

    return SwapRequestResponse(
        id=req.id,
        sender_id=req.sender_id,
        sender_username=req.sender.username if req.sender else "user",
        sender_name=sender_prof.full_name if sender_prof else "User",
        sender_avatar=sender_prof.avatar_url if sender_prof else None,
        receiver_id=req.receiver_id,
        receiver_username=req.receiver.username if req.receiver else "user",
        receiver_name=receiver_prof.full_name if receiver_prof else "User",
        receiver_avatar=receiver_prof.avatar_url if receiver_prof else None,
        offered_skill_id=req.offered_skill_id,
        offered_skill_name=req.offered_skill.name if req.offered_skill else "Skill",
        requested_skill_id=req.requested_skill_id,
        requested_skill_name=req.requested_skill.name if req.requested_skill else "Skill",
        message=req.message,
        status=req.status,
        created_at=req.created_at,
        updated_at=req.updated_at
    )
