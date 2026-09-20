from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User
from app.schemas import MatchResponse, ProfilePublicResponse, UserSkillResponse
from app.api.dependencies.auth import get_current_user
from app.services.matching_service import MatchingService

router = APIRouter(prefix="/matches", tags=["Matching Engine"])


@router.get("", response_model=List[MatchResponse])
async def get_my_matches(
    limit: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    matches_data = await MatchingService.find_matches_for_user(
        db=db,
        user_id=current_user.id,
        limit=limit
    )

    response_items = []
    for item in matches_data:
        target: User = item["candidate"]
        p = target.profile

        teach_skills = []
        learn_skills = []
        for s in target.skills:
            if not s.skill:
                continue
            skill_item = UserSkillResponse(
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
                teach_skills.append(skill_item)
            else:
                learn_skills.append(skill_item)

        user_profile = ProfilePublicResponse(
            user_id=target.id,
            username=target.username,
            full_name=p.full_name if p else target.username,
            profession=p.profession if p else "Skill Enthusiast",
            country=p.country if p else "Global",
            state=p.state if p else None,
            city=p.city if p else None,
            bio=p.bio if p else None,
            avatar_url=p.avatar_url if p else None,
            languages=p.languages or ["English"] if p else ["English"],
            availability=p.availability or ["Weekdays"] if p else ["Weekdays"],
            preferred_learning_mode=p.preferred_learning_mode if p else "Online",
            skills_teach=teach_skills,
            skills_learn=learn_skills,
            match_score=item["score"],
            match_explanation=item["explanation"],
            rating_average=5.0,
            reviews_count=0
        )

        response_items.append(
            MatchResponse(
                user=user_profile,
                match_score=item["score"],
                teach_matches=item["teach_matches"],
                learn_matches=item["learn_matches"],
                explanation=item["explanation"]
            )
        )

    return response_items
