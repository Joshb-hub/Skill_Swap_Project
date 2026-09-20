from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, Profile, UserSkill, Skill, SkillCategory, LearningMode, ExperienceLevel, UserBlock
from app.schemas import ProfilePublicResponse, UserSkillResponse
from app.api.dependencies.auth import get_optional_user
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/search", tags=["Search & Discovery"])


@router.get("", response_model=List[ProfilePublicResponse])
async def search_profiles(
    q: Optional[str] = Query(None, description="General search keyword across skills, name, bio, profession"),
    skill: Optional[str] = Query(None, description="Specific skill name"),
    category: Optional[str] = Query(None, description="Skill category name"),
    profession: Optional[str] = Query(None, description="User profession"),
    country: Optional[str] = Query(None, description="Country"),
    state: Optional[str] = Query(None, description="State"),
    city: Optional[str] = Query(None, description="City"),
    experience_level: Optional[ExperienceLevel] = None,
    learning_mode: Optional[LearningMode] = None,
    availability: Optional[str] = Query(None, description="e.g. Weekdays, Weekends, Evenings"),
    sort_by: str = Query("best_match", description="best_match, newest, most_experienced"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    optional_user: Optional[User] = Depends(get_optional_user)
):
    # Filter out current user & blocked users
    blocked_ids = set()
    current_user_skills = []
    if optional_user:
        block_stmt = select(UserBlock).where(
            (UserBlock.blocker_id == optional_user.id) | (UserBlock.blocked_id == optional_user.id)
        )
        block_res = await db.execute(block_stmt)
        for b in block_res.scalars().all():
            blocked_ids.add(b.blocker_id)
            blocked_ids.add(b.blocked_id)
        blocked_ids.add(optional_user.id)

        # Load current user's skills for match score calculations
        curr_skills_stmt = select(UserSkill).where(UserSkill.user_id == optional_user.id).options(selectinload(UserSkill.skill))
        current_user_skills = (await db.execute(curr_skills_stmt)).scalars().all()

    stmt = (
        select(User)
        .join(User.profile)
        .where(User.is_active == True)
        .options(
            selectinload(User.profile),
            selectinload(User.skills).selectinload(UserSkill.skill).selectinload(Skill.category)
        )
    )

    if blocked_ids:
        stmt = stmt.where(~User.id.in_(blocked_ids))

    # Location filters
    if country:
        stmt = stmt.where(Profile.country.ilike(f"%{country}%"))
    if state:
        stmt = stmt.where(Profile.state.ilike(f"%{state}%"))
    if city:
        stmt = stmt.where(Profile.city.ilike(f"%{city}%"))
    if profession:
        stmt = stmt.where(Profile.profession.ilike(f"%{profession}%"))
    if learning_mode:
        stmt = stmt.where(
            or_(
                Profile.preferred_learning_mode == learning_mode,
                Profile.preferred_learning_mode == LearningMode.EITHER
            )
        )

    # General search query
    if q:
        search_pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Profile.full_name.ilike(search_pattern),
                User.username.ilike(search_pattern),
                Profile.profession.ilike(search_pattern),
                Profile.bio.ilike(search_pattern),
                User.skills.any(
                    UserSkill.skill.has(Skill.name.ilike(search_pattern))
                )
            )
        )

    # Specific skill filter
    if skill:
        skill_pattern = f"%{skill.strip()}%"
        stmt = stmt.where(
            User.skills.any(
                and_(
                    UserSkill.skill_type == "TEACH",
                    UserSkill.skill.has(Skill.name.ilike(skill_pattern))
                )
            )
        )

    # Category filter
    if category:
        stmt = stmt.where(
            User.skills.any(
                UserSkill.skill.has(
                    Skill.category.has(SkillCategory.name.ilike(f"%{category.strip()}%"))
                )
            )
        )

    # Sorting
    if sort_by == "newest":
        stmt = stmt.order_by(desc(User.created_at))
    else:
        stmt = stmt.order_by(desc(User.created_at))

    # Execute query
    res = await db.execute(stmt)
    users = res.scalars().unique().all()

    # Post-process filters (availability, experience) & build responses
    results: List[ProfilePublicResponse] = []
    for u in users:
        p = u.profile
        if not p:
            continue

        if availability and p.availability:
            if not any(availability.lower() in slot.lower() for slot in p.availability):
                continue

        # Separate skills
        teach_skills = []
        learn_skills = []
        for s in u.skills:
            if not s.skill:
                continue
            item = UserSkillResponse(
                id=s.id,
                skill_id=s.skill_id,
                skill_name=s.skill.name,
                category_name=s.skill.category.name if s.skill.category else None,
                skill_type=s.skill_type,
                experience_level=s.experience_level,
                current_level=s.current_level,
                target_level=s.target_level,
                description=s.description
            )
            if s.skill_type == "TEACH":
                teach_skills.append(item)
            else:
                learn_skills.append(item)

        if experience_level:
            if not any(s.experience_level == experience_level for s in teach_skills):
                continue

        # Compute match score if optional_user is present
        match_score = None
        match_exp = None
        if optional_user and optional_user.profile:
            match_score, _, _, match_exp = MatchingService.calculate_compatibility(
                current_user=optional_user,
                current_profile=optional_user.profile,
                current_skills=current_user_skills,
                target_user=u,
                target_profile=p,
                target_skills=u.skills
            )

        results.append(
            ProfilePublicResponse(
                user_id=u.id,
                username=u.username,
                full_name=p.full_name,
                profession=p.profession,
                country=p.country,
                state=p.state,
                city=p.city,
                bio=p.bio,
                avatar_url=p.avatar_url,
                languages=p.languages or ["English"],
                availability=p.availability or ["Weekdays"],
                preferred_learning_mode=p.preferred_learning_mode,
                skills_teach=teach_skills,
                skills_learn=learn_skills,
                match_score=match_score,
                match_explanation=match_exp,
                rating_average=5.0,
                reviews_count=0
            )
        )

    # Sort by match score if requested and logged in
    if sort_by == "best_match" and optional_user:
        results.sort(key=lambda x: x.match_score or 0, reverse=True)

    # Paginate
    start = (page - 1) * page_size
    return results[start:start + page_size]
