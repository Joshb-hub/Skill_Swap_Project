from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, Profile, UserSkill, Review
from app.schemas import ProfilePublicResponse, ProfileDetailResponse, ProfileUpdate, UserSkillResponse
from app.api.dependencies.auth import get_current_user, get_optional_user
from app.services.privacy_service import has_accepted_swap_between, get_visible_contact_info

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/{username}", response_model=ProfileDetailResponse)
async def get_profile_by_username(
    username: str,
    db: AsyncSession = Depends(get_db),
    optional_user: Optional[User] = Depends(get_optional_user)
):
    stmt = (
        select(User)
        .where(User.username == username)
        .options(
            selectinload(User.profile),
            selectinload(User.skills).selectinload(UserSkill.skill)
        )
    )
    res = await db.execute(stmt)
    target_user = res.scalar_one_or_none()

    if not target_user or not target_user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile = target_user.profile

    # Determine contact visibility
    has_swap = False
    viewer_id = optional_user.id if optional_user else None
    if viewer_id and viewer_id != target_user.id:
        has_swap = await has_accepted_swap_between(db, viewer_id, target_user.id)

    visible_email, visible_phone = get_visible_contact_info(
        profile=profile,
        user=target_user,
        viewer_id=viewer_id,
        has_active_swap=has_swap
    )

    # Compute review average and count
    rev_stmt = select(
        func.avg(Review.overall_rating),
        func.count(Review.id)
    ).where(Review.reviewee_id == target_user.id)
    rev_res = await db.execute(rev_stmt)
    avg_rating, rev_count = rev_res.one()

    # Partition skills into Teach & Learn
    teach_skills = []
    learn_skills = []
    for s in target_user.skills:
        skill_resp = UserSkillResponse(
            id=s.id,
            skill_id=s.skill_id,
            skill_name=s.skill.name if s.skill else "Unknown",
            category_name=s.skill.category.name if s.skill and s.skill.category else "General",
            skill_type=s.skill_type,
            experience_level=s.experience_level,
            current_level=s.current_level,
            target_level=s.target_level,
            description=s.description
        )
        if s.skill_type == "TEACH":
            teach_skills.append(skill_resp)
        else:
            learn_skills.append(skill_resp)

    return ProfileDetailResponse(
        user_id=target_user.id,
        username=target_user.username,
        full_name=profile.full_name,
        profession=profile.profession,
        country=profile.country,
        state=profile.state,
        city=profile.city,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        languages=profile.languages or ["English"],
        availability=profile.availability or ["Weekdays"],
        preferred_learning_mode=profile.preferred_learning_mode,
        skills_teach=teach_skills,
        skills_learn=learn_skills,
        rating_average=round(float(avg_rating), 1) if avg_rating else 5.0,
        reviews_count=rev_count or 0,
        email=visible_email,
        phone_number=visible_phone,
        email_privacy=profile.email_privacy,
        phone_privacy=profile.phone_privacy,
        date_of_birth=profile.date_of_birth if (viewer_id == target_user.id) else None
    )


@router.put("/me", response_model=ProfileDetailResponse)
async def update_my_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Profile)
        .where(Profile.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    await db.commit()
    await db.refresh(profile)

    # Return updated detail profile
    return await get_profile_by_username(
        username=current_user.username,
        db=db,
        optional_user=current_user
    )
