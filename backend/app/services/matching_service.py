from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Profile, UserSkill, LearningMode, ExperienceLevel, UserBlock

# Experience ranking to compare teacher level vs learner current/target
LEVEL_RANK = {
    ExperienceLevel.BEGINNER: 1,
    ExperienceLevel.INTERMEDIATE: 2,
    ExperienceLevel.ADVANCED: 3,
    ExperienceLevel.PROFESSIONAL: 4,
}


class MatchingService:
    """
    Dedicated Python matching service computing reciprocal compatibility scores
    between users based on skills taught/learned, experience alignment,
    learning mode preferences, location, and availability.
    """

    @staticmethod
    def calculate_compatibility(
        current_user: User,
        current_profile: Profile,
        current_skills: List[UserSkill],
        target_user: User,
        target_profile: Profile,
        target_skills: List[UserSkill]
    ) -> Tuple[int, List[str], List[str], str]:
        """
        Calculates compatibility between current_user and target_user.
        Returns:
            match_score: int (0 to 100)
            teach_matches: skills current user teaches that target wants to learn
            learn_matches: skills target teaches that current user wants to learn
            explanation: detailed human-readable breakdown
        """
        # Split skills into Teach and Learn
        c_teaches = {s.skill.name.lower(): s for s in current_skills if s.skill_type == "TEACH" and s.skill}
        c_learns = {s.skill.name.lower(): s for s in current_skills if s.skill_type == "LEARN" and s.skill}

        t_teaches = {s.skill.name.lower(): s for s in target_skills if s.skill_type == "TEACH" and s.skill}
        t_learns = {s.skill.name.lower(): s for s in target_skills if s.skill_type == "LEARN" and s.skill}

        # 1. Mutual skill exchange compatibility (Primary factor: up to 55 points)
        # Skills current teaches that target learns
        mutual_teach = set(c_teaches.keys()).intersection(set(t_learns.keys()))
        # Skills target teaches that current learns
        mutual_learn = set(t_teaches.keys()).intersection(set(c_learns.keys()))

        teach_matches = [c_teaches[k].skill.name for k in mutual_teach]
        learn_matches = [t_teaches[k].skill.name for k in mutual_learn]

        score = 0
        explanation_parts = []

        is_two_way = len(mutual_teach) > 0 and len(mutual_learn) > 0
        is_one_way_teach = len(mutual_teach) > 0
        is_one_way_learn = len(mutual_learn) > 0

        if is_two_way:
            score += 55
            sample_teach = teach_matches[0]
            sample_learn = learn_matches[0]
            target_name = target_profile.full_name or target_user.username
            explanation_parts.append(
                f"You can teach {sample_teach}, which {target_name} wants to learn. "
                f"{target_name} can teach {sample_learn}, which you want to learn."
            )
        elif is_one_way_learn:
            score += 30
            sample_learn = learn_matches[0]
            target_name = target_profile.full_name or target_user.username
            explanation_parts.append(
                f"{target_name} can teach {sample_learn}, which you want to learn."
            )
        elif is_one_way_teach:
            score += 25
            sample_teach = teach_matches[0]
            target_name = target_profile.full_name or target_user.username
            explanation_parts.append(
                f"You can teach {sample_teach}, which {target_name} is eager to learn."
            )
        else:
            # Fallback: general topic overlap or 0
            explanation_parts.append("No direct mutual skill overlaps found yet.")

        # 2. Experience Level Compatibility (up to 15 points)
        exp_score = 0
        if is_two_way or is_one_way_learn:
            for k in mutual_learn:
                teacher_skill = t_teaches.get(k)
                learner_skill = c_learns.get(k)
                if teacher_skill and learner_skill:
                    t_rank = LEVEL_RANK.get(teacher_skill.experience_level, 2)
                    l_target_rank = LEVEL_RANK.get(learner_skill.target_level, 2)
                    if t_rank >= l_target_rank:
                        exp_score += 15
                        break
                    else:
                        exp_score += 8
                        break
        score += exp_score

        # 3. Learning Mode Compatibility (up to 15 points)
        c_mode = current_profile.preferred_learning_mode
        t_mode = target_profile.preferred_learning_mode

        if c_mode == LearningMode.EITHER or t_mode == LearningMode.EITHER or c_mode == t_mode:
            score += 15
        elif (c_mode == LearningMode.ONLINE and t_mode != LearningMode.ONLINE) or \
             (c_mode == LearningMode.IN_PERSON and t_mode != LearningMode.IN_PERSON):
            score += 5

        # 4. Location Compatibility (up to 10 points for in-person / general proximity)
        if current_profile.country and target_profile.country:
            if current_profile.country.lower() == target_profile.country.lower():
                score += 5
                if current_profile.city and target_profile.city and \
                   current_profile.city.lower() == target_profile.city.lower():
                    score += 5

        # 5. Availability Compatibility (up to 5 points)
        c_avail = set(current_profile.availability or [])
        t_avail = set(target_profile.availability or [])
        if c_avail and t_avail and c_avail.intersection(t_avail):
            score += 5

        # Cap score between 0 and 99 (or 100 for perfect reciprocal)
        final_score = min(max(score, 10), 99)
        if is_two_way and exp_score >= 10:
            final_score = max(final_score, 88)

        full_explanation = " ".join(explanation_parts)
        return final_score, teach_matches, learn_matches, full_explanation

    @classmethod
    async def find_matches_for_user(
        cls,
        db: AsyncSession,
        user_id: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Find top compatible users for the given user, ordered by match score.
        Filters out blocked users and the user themselves.
        """
        # Load current user with profile and skills
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.profile),
                selectinload(User.skills).selectinload(UserSkill.skill)
            )
        )
        res = await db.execute(stmt)
        curr_user = res.scalar_one_or_none()
        if not curr_user or not curr_user.profile:
            return []

        # Find blocked users (both directions)
        block_stmt = select(UserBlock).where(
            (UserBlock.blocker_id == user_id) | (UserBlock.blocked_id == user_id)
        )
        block_res = await db.execute(block_stmt)
        blocked_ids = set()
        for b in block_res.scalars().all():
            blocked_ids.add(b.blocker_id)
            blocked_ids.add(b.blocked_id)

        # Query other active users
        candidates_stmt = (
            select(User)
            .where(User.id != user_id)
            .where(User.is_active == True)
            .options(
                selectinload(User.profile),
                selectinload(User.skills).selectinload(UserSkill.skill)
            )
        )
        candidates_res = await db.execute(candidates_stmt)
        candidates = candidates_res.scalars().all()

        scored_matches = []
        for candidate in candidates:
            if candidate.id in blocked_ids or not candidate.profile:
                continue

            score, teach_matches, learn_matches, explanation = cls.calculate_compatibility(
                current_user=curr_user,
                current_profile=curr_user.profile,
                current_skills=curr_user.skills,
                target_user=candidate,
                target_profile=candidate.profile,
                target_skills=candidate.skills
            )

            scored_matches.append({
                "candidate": candidate,
                "score": score,
                "teach_matches": teach_matches,
                "learn_matches": learn_matches,
                "explanation": explanation,
            })

        # Sort by match score descending
        scored_matches.sort(key=lambda x: x["score"], reverse=True)
        return scored_matches[:limit]
