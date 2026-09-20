import pytest
from app.services.matching_service import MatchingService
from app.models import User, Profile, Skill, SkillCategory, UserSkill, LearningMode, ExperienceLevel


def test_reciprocal_matching_calculation():
    # User A: Teaches Python (Professional), wants Graphic Design (Target: Intermediate)
    user_a = User(id="user_a", username="alex", email="alex@test.com", hashed_password="x")
    profile_a = Profile(
        user_id="user_a",
        full_name="Alex Chen",
        country="United States",
        city="San Francisco",
        profession="Engineer",
        preferred_learning_mode=LearningMode.ONLINE,
        availability=["Weekdays"]
    )
    skill_cat = SkillCategory(id="cat1", name="Tech", slug="tech")
    py_skill = Skill(id="s1", name="Python", category=skill_cat)
    gd_skill = Skill(id="s2", name="Graphic Design", category=skill_cat)

    skills_a = [
        UserSkill(user_id="user_a", skill=py_skill, skill_type="TEACH", experience_level=ExperienceLevel.PROFESSIONAL),
        UserSkill(user_id="user_a", skill=gd_skill, skill_type="LEARN", current_level=ExperienceLevel.BEGINNER, target_level=ExperienceLevel.INTERMEDIATE),
    ]

    # User B: Teaches Graphic Design (Professional), wants Python (Target: Intermediate)
    user_b = User(id="user_b", username="sarah", email="sarah@test.com", hashed_password="x")
    profile_b = Profile(
        user_id="user_b",
        full_name="Sarah Jenkins",
        country="United States",
        city="San Francisco",
        profession="Designer",
        preferred_learning_mode=LearningMode.ONLINE,
        availability=["Weekdays"]
    )
    skills_b = [
        UserSkill(user_id="user_b", skill=gd_skill, skill_type="TEACH", experience_level=ExperienceLevel.PROFESSIONAL),
        UserSkill(user_id="user_b", skill=py_skill, skill_type="LEARN", current_level=ExperienceLevel.BEGINNER, target_level=ExperienceLevel.INTERMEDIATE),
    ]

    score, teach_m, learn_m, exp = MatchingService.calculate_compatibility(
        current_user=user_a,
        current_profile=profile_a,
        current_skills=skills_a,
        target_user=user_b,
        target_profile=profile_b,
        target_skills=skills_b
    )

    assert score >= 88
    assert "Python" in teach_m
    assert "Graphic Design" in learn_m
    assert "You can teach Python" in exp
    assert "Sarah Jenkins can teach Graphic Design" in exp
