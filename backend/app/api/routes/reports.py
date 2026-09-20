from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, UserBlock, UserReport
from app.schemas import (
    BlockCreate, BlockResponse, ReportCreate, ReportResponse, MessageSuccessResponse
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Safety & Moderation"])


@router.post("/block", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def block_user(
    block_in: BlockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if block_in.blocked_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    target = await db.get(User, block_in.blocked_id)
    if not target:
        raise HTTPException(status_code=404, detail="User to block not found")

    existing_stmt = select(UserBlock).where(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == block_in.blocked_id
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        return BlockResponse(
            id=existing.id,
            blocked_id=target.id,
            blocked_username=target.username,
            created_at=existing.created_at
        )

    block = UserBlock(
        blocker_id=current_user.id,
        blocked_id=block_in.blocked_id
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)

    return BlockResponse(
        id=block.id,
        blocked_id=target.id,
        blocked_username=target.username,
        created_at=block.created_at
    )


@router.delete("/block/{blocked_id}", response_model=MessageSuccessResponse)
async def unblock_user(
    blocked_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserBlock).where(
        UserBlock.blocker_id == current_user.id,
        UserBlock.blocked_id == blocked_id
    )
    block = (await db.execute(stmt)).scalar_one_or_none()
    if not block:
        raise HTTPException(status_code=404, detail="Block record not found")

    await db.delete(block)
    await db.commit()
    return MessageSuccessResponse(message="User unblocked successfully")


@router.get("/blocked", response_model=List[BlockResponse])
async def list_blocked_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(UserBlock)
        .where(UserBlock.blocker_id == current_user.id)
        .options(selectinload(UserBlock.blocked))
    )
    blocks = (await db.execute(stmt)).scalars().all()

    return [
        BlockResponse(
            id=b.id,
            blocked_id=b.blocked_id,
            blocked_username=b.blocked.username if b.blocked else "user",
            created_at=b.created_at
        )
        for b in blocks
    ]


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_user_report(
    report_in: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if report_in.reported_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    target = await db.get(User, report_in.reported_id)
    if not target:
        raise HTTPException(status_code=404, detail="Reported user not found")

    report = UserReport(
        reporter_id=current_user.id,
        reported_id=report_in.reported_id,
        category=report_in.category,
        description=report_in.description,
        status="Pending"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return ReportResponse(
        id=report.id,
        reporter_id=current_user.id,
        reported_id=report.reported_id,
        category=report.category,
        description=report.description,
        status=report.status,
        created_at=report.created_at
    )
