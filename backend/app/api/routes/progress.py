from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, SkillSwap, LearningProgress, ProgressMilestone, MilestoneStatus
from app.schemas import (
    LearningProgressResponse, LearningProgressUpdate,
    MilestoneCreate, MilestoneResponse, MessageSuccessResponse
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/progress", tags=["Learning Progress"])


@router.get("/swap/{swap_id}", response_model=List[LearningProgressResponse])
async def get_swap_progress(
    swap_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify participation in swap
    swap = await db.get(SkillSwap, swap_id)
    if not swap or (swap.user_a_id != current_user.id and swap.user_b_id != current_user.id):
        raise HTTPException(status_code=403, detail="Unauthorized to view progress for this swap")

    stmt = (
        select(LearningProgress)
        .where(LearningProgress.swap_id == swap_id)
        .options(
            selectinload(LearningProgress.skill),
            selectinload(LearningProgress.milestones)
        )
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    results = []
    for r in records:
        milestones = [
            MilestoneResponse(
                id=m.id,
                progress_id=m.progress_id,
                title=m.title,
                description=m.description,
                status=m.status,
                order=m.order
            )
            for m in sorted(r.milestones, key=lambda x: x.order)
        ]
        results.append(
            LearningProgressResponse(
                id=r.id,
                swap_id=r.swap_id,
                user_id=r.user_id,
                skill_id=r.skill_id,
                skill_name=r.skill.name if r.skill else "Skill",
                current_level=r.current_level,
                target_level=r.target_level,
                progress_percentage=r.progress_percentage,
                total_sessions=r.total_sessions,
                completed_sessions=r.completed_sessions,
                milestones=milestones
            )
        )
    return results


@router.put("/{progress_id}", response_model=LearningProgressResponse)
async def update_progress(
    progress_id: str,
    update_data: LearningProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(LearningProgress)
        .where(LearningProgress.id == progress_id)
        .options(
            selectinload(LearningProgress.skill),
            selectinload(LearningProgress.milestones),
            selectinload(LearningProgress.swap)
        )
    )
    res = await db.execute(stmt)
    prog = res.scalar_one_or_none()

    if not prog:
        raise HTTPException(status_code=404, detail="Progress record not found")

    # Only learner or their swap partner can update
    if prog.user_id != current_user.id and prog.swap.user_a_id != current_user.id and prog.swap.user_b_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to modify this progress record")

    data = update_data.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(prog, field, val)

    await db.commit()
    await db.refresh(prog)

    milestones = [
        MilestoneResponse(
            id=m.id,
            progress_id=m.progress_id,
            title=m.title,
            description=m.description,
            status=m.status,
            order=m.order
        )
        for m in sorted(prog.milestones, key=lambda x: x.order)
    ]

    return LearningProgressResponse(
        id=prog.id,
        swap_id=prog.swap_id,
        user_id=prog.user_id,
        skill_id=prog.skill_id,
        skill_name=prog.skill.name if prog.skill else "Skill",
        current_level=prog.current_level,
        target_level=prog.target_level,
        progress_percentage=prog.progress_percentage,
        total_sessions=prog.total_sessions,
        completed_sessions=prog.completed_sessions,
        milestones=milestones
    )


@router.post("/{progress_id}/milestones", response_model=MilestoneResponse)
async def add_milestone(
    progress_id: str,
    milestone_in: MilestoneCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    prog = await db.get(LearningProgress, progress_id)
    if not prog:
        raise HTTPException(status_code=404, detail="Progress record not found")

    new_milestone = ProgressMilestone(
        progress_id=progress_id,
        title=milestone_in.title,
        description=milestone_in.description,
        status=milestone_in.status,
        order=milestone_in.order
    )
    db.add(new_milestone)
    await db.commit()
    await db.refresh(new_milestone)

    return MilestoneResponse(
        id=new_milestone.id,
        progress_id=new_milestone.progress_id,
        title=new_milestone.title,
        description=new_milestone.description,
        status=new_milestone.status,
        order=new_milestone.order
    )


@router.patch("/milestones/{milestone_id}/toggle", response_model=MilestoneResponse)
async def toggle_milestone_status(
    milestone_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    milestone = await db.get(ProgressMilestone, milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    if milestone.status == MilestoneStatus.COMPLETED:
        milestone.status = MilestoneStatus.IN_PROGRESS
    elif milestone.status == MilestoneStatus.IN_PROGRESS:
        milestone.status = MilestoneStatus.COMPLETED
    else:
        milestone.status = MilestoneStatus.IN_PROGRESS

    # Automatically recalculate progress percentage
    prog_stmt = select(ProgressMilestone).where(ProgressMilestone.progress_id == milestone.progress_id)
    all_milestones = (await db.execute(prog_stmt)).scalars().all()
    if all_milestones:
        completed = sum(1 for m in all_milestones if m.status == MilestoneStatus.COMPLETED)
        prog = await db.get(LearningProgress, milestone.progress_id)
        if prog:
            prog.progress_percentage = int((completed / len(all_milestones)) * 100)

    await db.commit()
    await db.refresh(milestone)

    return MilestoneResponse(
        id=milestone.id,
        progress_id=milestone.progress_id,
        title=milestone.title,
        description=milestone.description,
        status=milestone.status,
        order=milestone.order
    )
