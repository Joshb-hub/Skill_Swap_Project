from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, SkillSwap, Review
from app.schemas import ReviewCreate, ReviewResponse
from app.api.dependencies.auth import get_current_user
from app.services.notification_service import create_notification

router = APIRouter(prefix="/reviews", tags=["Reviews & Ratings"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Cannot review oneself
    if review_in.reviewee_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")

    # Verify participation in swap
    swap = await db.get(SkillSwap, review_in.swap_id)
    if not swap:
        raise HTTPException(status_code=404, detail="Skill swap not found")

    if swap.user_a_id != current_user.id and swap.user_b_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized: You did not participate in this swap")

    if swap.user_a_id != review_in.reviewee_id and swap.user_b_id != review_in.reviewee_id:
        raise HTTPException(status_code=400, detail="Target user is not a participant in this swap")

    # Prevent duplicate review on same swap
    dup_stmt = select(Review).where(
        Review.swap_id == review_in.swap_id,
        Review.reviewer_id == current_user.id
    )
    if (await db.execute(dup_stmt)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already submitted a review for this skill exchange")

    new_review = Review(
        swap_id=review_in.swap_id,
        reviewer_id=current_user.id,
        reviewee_id=review_in.reviewee_id,
        communication_rating=review_in.communication_rating,
        teaching_rating=review_in.teaching_rating,
        helpfulness_rating=review_in.helpfulness_rating,
        overall_rating=review_in.overall_rating,
        comment=review_in.comment
    )
    db.add(new_review)
    await db.flush()

    # Notify reviewee
    reviewer_name = current_user.profile.full_name if current_user.profile else current_user.username
    await create_notification(
        db=db,
        user_id=review_in.reviewee_id,
        type="review_received",
        title="New Review Received!",
        message=f"{reviewer_name} left you a {review_in.overall_rating}★ review.",
        link=f"/profile/{current_user.username}"
    )
    await db.commit()

    return ReviewResponse(
        id=new_review.id,
        swap_id=new_review.swap_id,
        reviewer_id=current_user.id,
        reviewer_name=reviewer_name,
        reviewer_avatar=current_user.profile.avatar_url if current_user.profile else None,
        reviewee_id=new_review.reviewee_id,
        communication_rating=new_review.communication_rating,
        teaching_rating=new_review.teaching_rating,
        helpfulness_rating=new_review.helpfulness_rating,
        overall_rating=new_review.overall_rating,
        comment=new_review.comment,
        created_at=new_review.created_at
    )


@router.get("/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Review)
        .where(Review.reviewee_id == user_id)
        .options(selectinload(Review.reviewer).selectinload(User.profile))
        .order_by(Review.created_at.desc())
    )
    res = await db.execute(stmt)
    reviews = res.scalars().all()

    return [
        ReviewResponse(
            id=r.id,
            swap_id=r.swap_id,
            reviewer_id=r.reviewer_id,
            reviewer_name=r.reviewer.profile.full_name if r.reviewer.profile else r.reviewer.username,
            reviewer_avatar=r.reviewer.profile.avatar_url if r.reviewer.profile else None,
            reviewee_id=r.reviewee_id,
            communication_rating=r.communication_rating,
            teaching_rating=r.teaching_rating,
            helpfulness_rating=r.helpfulness_rating,
            overall_rating=r.overall_rating,
            comment=r.comment,
            created_at=r.created_at
        )
        for r in reviews
    ]
