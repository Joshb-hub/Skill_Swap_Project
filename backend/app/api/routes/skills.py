import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User, SkillCategory, Skill, UserSkill
from app.schemas import (
    SkillCategoryResponse, SkillResponse, UserSkillCreate,
    UserSkillResponse, MessageSuccessResponse
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.get("/categories", response_model=List[SkillCategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    stmt = select(SkillCategory).order_by(SkillCategory.name)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("", response_model=List[SkillResponse])
async def search_skills(
    q: Optional[str] = Query(None, description="Search term for skill name"),
    category_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Skill).options(selectinload(Skill.category))
    if category_id:
        stmt = stmt.where(Skill.category_id == category_id)
    if q:
        stmt = stmt.where(Skill.name.ilike(f"%{q}%"))

    res = await db.execute(stmt.limit(50))
    skills = res.scalars().all()

    return [
        SkillResponse(
            id=s.id,
            category_id=s.category_id,
            name=s.name,
            description=s.description,
            category_name=s.category.name if s.category else None
        )
        for s in skills
    ]


@router.post("/user-skills", response_model=UserSkillResponse, status_code=status.HTTP_201_CREATED)
async def add_user_skill(
    skill_in: UserSkillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    clean_skill_name = skill_in.skill_name.strip()

    # Find or create skill
    stmt = select(Skill).where(Skill.name.ilike(clean_skill_name)).options(selectinload(Skill.category))
    res = await db.execute(stmt)
    skill = res.scalar_one_or_none()

    if not skill:
        # Find or create category
        cat_stmt = select(SkillCategory).where(SkillCategory.name.ilike(skill_in.category_name or "General"))
        cat_res = await db.execute(cat_stmt)
        category = cat_res.scalar_one_or_none()

        if not category:
            category = SkillCategory(
                name=skill_in.category_name or "General",
                slug=(skill_in.category_name or "general").lower().replace(" ", "-"),
                icon="Sparkles"
            )
            db.add(category)
            await db.flush()

        skill = Skill(
            category_id=category.id,
            name=clean_skill_name,
            description=f"{clean_skill_name} skill"
        )
        db.add(skill)
        await db.flush()

    # Check if user already added this skill for this skill_type
    existing_stmt = select(UserSkill).where(
        UserSkill.user_id == current_user.id,
        UserSkill.skill_id == skill.id,
        UserSkill.skill_type == skill_in.skill_type
    )
    existing = (await db.execute(existing_stmt)).scalar_one_or_none()
    if existing:
        # Update existing
        existing.experience_level = skill_in.experience_level
        existing.current_level = skill_in.current_level
        existing.target_level = skill_in.target_level
        existing.description = skill_in.description
        await db.commit()
        await db.refresh(existing)
        return UserSkillResponse(
            id=existing.id,
            skill_id=skill.id,
            skill_name=skill.name,
            category_name=skill.category.name if skill.category else "General",
            skill_type=existing.skill_type,
            experience_level=existing.experience_level,
            current_level=existing.current_level,
            target_level=existing.target_level,
            description=existing.description
        )

    user_skill = UserSkill(
        user_id=current_user.id,
        skill_id=skill.id,
        skill_type=skill_in.skill_type,
        experience_level=skill_in.experience_level,
        current_level=skill_in.current_level,
        target_level=skill_in.target_level,
        description=skill_in.description
    )
    db.add(user_skill)
    await db.commit()
    await db.refresh(user_skill)

    return UserSkillResponse(
        id=user_skill.id,
        skill_id=skill.id,
        skill_name=skill.name,
        category_name=skill.category.name if skill.category else "General",
        skill_type=user_skill.skill_type,
        experience_level=user_skill.experience_level,
        current_level=user_skill.current_level,
        target_level=user_skill.target_level,
        description=user_skill.description
    )


@router.delete("/user-skills/{user_skill_id}", response_model=MessageSuccessResponse)
async def remove_user_skill(
    user_skill_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(UserSkill).where(
        UserSkill.id == user_skill_id,
        UserSkill.user_id == current_user.id
    )
    res = await db.execute(stmt)
    skill = res.scalar_one_or_none()
    if not skill:
        raise HTTPException(status_code=404, detail="User skill not found")

    await db.delete(skill)
    await db.commit()
    return MessageSuccessResponse(message="Skill removed successfully.")
