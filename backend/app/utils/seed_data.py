import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models import (
    User, Profile, SkillCategory, Skill, UserSkill,
    SkillSwap, Conversation, Message, LearningProgress,
    ProgressMilestone, LearningSession, Review,
    LearningMode, ExperienceLevel, PrivacyLevel, SwapStatus,
    MessageType, SessionStatus, MilestoneStatus
)


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        check = await db.execute(select(User).limit(1))
        if check.scalar_one_or_none():
            print("Database already contains data, skipping seed.")
            return

        print("Seeding SkillSwap categories and skills...")

        categories_data = [
            {
                "name": "Programming & Tech",
                "slug": "programming-tech",
                "icon": "Code",
                "skills": ["Python", "Web Development", "AI & Machine Learning", "Data Analysis", "React", "DevOps"]
            },
            {
                "name": "Design & Creative",
                "slug": "design-creative",
                "icon": "Palette",
                "skills": ["Graphic Design", "UI/UX Design", "Figma", "Photography", "Video Editing", "3D Modeling"]
            },
            {
                "name": "Languages",
                "slug": "languages",
                "icon": "Languages",
                "skills": ["Spanish", "French", "Japanese", "German", "Mandarin", "American Sign Language"]
            },
            {
                "name": "Music & Audio",
                "slug": "music-audio",
                "icon": "Music",
                "skills": ["Acoustic Guitar", "Piano", "Music Production", "Vocal Training", "Sound Design"]
            },
            {
                "name": "Business & Finance",
                "slug": "business-finance",
                "icon": "Briefcase",
                "skills": ["Accounting & Bookkeeping", "Excel & Financial Modeling", "Public Speaking", "Digital Marketing", "Startup Strategy"]
            },
            {
                "name": "Technical Trades",
                "slug": "technical-trades",
                "icon": "Wrench",
                "skills": ["Carpentry", "Electrical Work", "Plumbing Basics", "Home Automation", "Bicycle Repair"]
            },
            {
                "name": "Culinary Arts",
                "slug": "culinary-arts",
                "icon": "Utensils",
                "skills": ["Artisan Bread Baking", "Pastry & Desserts", "Italian Cuisine", "Wine Tasting", "Plant-Based Cooking"]
            },
            {
                "name": "Arts & Crafts",
                "slug": "arts-crafts",
                "icon": "Sparkles",
                "skills": ["Pottery & Ceramics", "Oil Painting", "Knitting & Crochet", "Leatherworking", "Woodcarving"]
            }
        ]

        skills_dict = {}
        for cat_info in categories_data:
            cat = SkillCategory(
                name=cat_info["name"],
                slug=cat_info["slug"],
                icon=cat_info["icon"],
                description=f"Exchange skills in {cat_info['name']}"
            )
            db.add(cat)
            await db.flush()

            for s_name in cat_info["skills"]:
                s = Skill(category_id=cat.id, name=s_name, description=f"Skill exchange for {s_name}")
                db.add(s)
                await db.flush()
                skills_dict[s_name] = s

        print("Seeding demo users and profiles...")
        demo_users_data = [
            {
                "email": "alex@skillswap.com",
                "username": "alexchen",
                "full_name": "Alex Chen",
                "profession": "Senior Software Engineer",
                "country": "United States",
                "state": "California",
                "city": "San Francisco",
                "bio": "Building scalable backend microservices and AI systems. Passionate about teaching Python and distributed architectures. Looking to learn Graphic Design & UI/UX for my personal projects!",
                "languages": ["English", "Mandarin"],
                "availability": ["Weekdays", "Evenings"],
                "preferred_learning_mode": LearningMode.ONLINE,
                "email_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "phone_privacy": PrivacyLevel.HIDDEN,
                "teach": [("Python", ExperienceLevel.PROFESSIONAL), ("AI & Machine Learning", ExperienceLevel.ADVANCED)],
                "learn": [("Graphic Design", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE), ("UI/UX Design", ExperienceLevel.BEGINNER, ExperienceLevel.ADVANCED)]
            },
            {
                "email": "sarah@skillswap.com",
                "username": "sarahj",
                "full_name": "Sarah Jenkins",
                "profession": "Lead Product Designer",
                "country": "United States",
                "state": "California",
                "city": "San Francisco",
                "bio": "Over 7 years designing mobile and web apps with Figma. Eager to master Python for automated design tooling and generative art!",
                "languages": ["English"],
                "availability": ["Weekdays", "Weekends", "Evenings"],
                "preferred_learning_mode": LearningMode.EITHER,
                "email_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "phone_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "teach": [("Graphic Design", ExperienceLevel.PROFESSIONAL), ("UI/UX Design", ExperienceLevel.PROFESSIONAL), ("Figma", ExperienceLevel.ADVANCED)],
                "learn": [("Python", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE), ("Web Development", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE)]
            },
            {
                "email": "marcus@skillswap.com",
                "username": "marcus_trades",
                "full_name": "Marcus Vance",
                "profession": "Master Carpenter & Builder",
                "country": "United States",
                "state": "Washington",
                "city": "Seattle",
                "bio": "15+ years creating custom cabinetry and timber framing. Happy to teach woodwork safety, joinery, and tool craft. Looking to learn Excel & Accounting to run my business better.",
                "languages": ["English"],
                "availability": ["Weekends", "Afternoon"],
                "preferred_learning_mode": LearningMode.EITHER,
                "email_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "phone_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "teach": [("Carpentry", ExperienceLevel.PROFESSIONAL), ("Woodcarving", ExperienceLevel.ADVANCED)],
                "learn": [("Excel & Financial Modeling", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE), ("Accounting & Bookkeeping", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE)]
            },
            {
                "email": "elena@skillswap.com",
                "username": "elena_polyglot",
                "full_name": "Elena Rostova",
                "profession": "Translator & Linguist",
                "country": "United States",
                "state": "New York",
                "city": "New York",
                "bio": "Certified language instructor fluent in 5 languages. I teach interactive, conversational French and German. Eager to learn Acoustic Guitar chords and music fundamentals.",
                "languages": ["English", "French", "German", "Spanish"],
                "availability": ["Weekdays", "Morning", "Afternoon"],
                "preferred_learning_mode": LearningMode.ONLINE,
                "email_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "phone_privacy": PrivacyLevel.HIDDEN,
                "teach": [("French", ExperienceLevel.PROFESSIONAL), ("German", ExperienceLevel.ADVANCED), ("Spanish", ExperienceLevel.ADVANCED)],
                "learn": [("Acoustic Guitar", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE), ("Piano", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE)]
            },
            {
                "email": "david@skillswap.com",
                "username": "david_cpa",
                "full_name": "David Kim",
                "profession": "Certified Public Accountant",
                "country": "United States",
                "state": "Washington",
                "city": "Seattle",
                "bio": "Financial analyst and Excel wizard. I can teach you how to build clean budgets, financial models, and manage small business books. Want to learn Carpentry for weekend DIY projects!",
                "languages": ["English", "Korean"],
                "availability": ["Weekends", "Evenings"],
                "preferred_learning_mode": LearningMode.EITHER,
                "email_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "phone_privacy": PrivacyLevel.HIDDEN,
                "teach": [("Excel & Financial Modeling", ExperienceLevel.PROFESSIONAL), ("Accounting & Bookkeeping", ExperienceLevel.PROFESSIONAL)],
                "learn": [("Carpentry", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE), ("Plumbing Basics", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE)]
            },
            {
                "email": "priya@skillswap.com",
                "username": "priya_chef",
                "full_name": "Priya Sharma",
                "profession": "Culinary Instructor & Chef",
                "country": "United States",
                "state": "California",
                "city": "San Francisco",
                "bio": "Passionate about traditional spices, sourdough fermentation, and artisan baking. Looking for someone who can teach me French conversation before my trip to Lyon!",
                "languages": ["English", "Hindi"],
                "availability": ["Weekdays", "Evenings"],
                "preferred_learning_mode": LearningMode.ONLINE,
                "email_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "phone_privacy": PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
                "teach": [("Artisan Bread Baking", ExperienceLevel.PROFESSIONAL), ("Italian Cuisine", ExperienceLevel.ADVANCED)],
                "learn": [("French", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE), ("Digital Marketing", ExperienceLevel.BEGINNER, ExperienceLevel.INTERMEDIATE)]
            }
        ]

        created_users = {}
        common_password_hash = get_password_hash("Password123!")

        for u_data in demo_users_data:
            user = User(
                email=u_data["email"],
                username=u_data["username"],
                hashed_password=common_password_hash,
                is_active=True,
                is_verified=True,
                role="user"
            )
            db.add(user)
            await db.flush()

            profile = Profile(
                user_id=user.id,
                full_name=u_data["full_name"],
                phone_number="+1 (555) 234-5678",
                country=u_data["country"],
                state=u_data["state"],
                city=u_data["city"],
                profession=u_data["profession"],
                bio=u_data["bio"],
                languages=u_data["languages"],
                availability=u_data["availability"],
                preferred_learning_mode=u_data["preferred_learning_mode"],
                email_privacy=u_data["email_privacy"],
                phone_privacy=u_data["phone_privacy"]
            )
            db.add(profile)

            # Teach skills
            for s_name, exp in u_data["teach"]:
                skill_obj = skills_dict.get(s_name)
                if skill_obj:
                    us = UserSkill(
                        user_id=user.id,
                        skill_id=skill_obj.id,
                        skill_type="TEACH",
                        experience_level=exp,
                        description=f"Experienced teaching {s_name}"
                    )
                    db.add(us)

            # Learn skills
            for s_name, curr, targ in u_data["learn"]:
                skill_obj = skills_dict.get(s_name)
                if skill_obj:
                    us = UserSkill(
                        user_id=user.id,
                        skill_id=skill_obj.id,
                        skill_type="LEARN",
                        current_level=curr,
                        target_level=targ,
                        description=f"Looking to learn {s_name}"
                    )
                    db.add(us)

            created_users[u_data["username"]] = user

        await db.flush()

        # Create an active Skill Swap between Alex and Sarah
        alex = created_users["alexchen"]
        sarah = created_users["sarahj"]
        python_skill = skills_dict["Python"]
        design_skill = skills_dict["Graphic Design"]

        print("Setting up active Skill Swap between Alex and Sarah...")
        swap = SkillSwap(
            user_a_id=alex.id,
            user_b_id=sarah.id,
            skill_a_id=python_skill.id, # Alex teaches Python
            skill_b_id=design_skill.id, # Sarah teaches Graphic Design
            status=SwapStatus.ACTIVE,
            started_at=datetime.now(timezone.utc) - timedelta(days=7)
        )
        db.add(swap)
        await db.flush()

        # Conversation & initial messages
        conv = Conversation(
            swap_id=swap.id,
            user_a_id=alex.id,
            user_b_id=sarah.id,
            is_active=True
        )
        db.add(conv)
        await db.flush()

        m1 = Message(
            conversation_id=conv.id,
            sender_id=alex.id,
            content="Hi Sarah! Thrilled to exchange Python for Graphic Design. I set up our first practice outline.",
            message_type=MessageType.TEXT,
            is_read=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=6)
        )
        m2 = Message(
            conversation_id=conv.id,
            sender_id=sarah.id,
            content="Awesome Alex! Looking forward to it. I've prepared some Figma fundamentals for our next session!",
            message_type=MessageType.TEXT,
            is_read=True,
            created_at=datetime.now(timezone.utc) - timedelta(days=5)
        )
        m3 = Message(
            conversation_id=conv.id,
            sender_id=alex.id,
            content="Sounds perfect. Let's start with Python data structures and functions on Tuesday.",
            message_type=MessageType.TEXT,
            is_read=False,
            created_at=datetime.now(timezone.utc) - timedelta(hours=2)
        )
        db.add_all([m1, m2, m3])

        # Learning progress & milestones
        prog_alex = LearningProgress(
            swap_id=swap.id,
            user_id=alex.id,
            skill_id=design_skill.id,
            current_level="Beginner",
            target_level="Intermediate",
            progress_percentage=45,
            total_sessions=10,
            completed_sessions=4
        )
        db.add(prog_alex)
        await db.flush()

        db.add_all([
            ProgressMilestone(progress_id=prog_alex.id, title="Color Theory & Typography", status=MilestoneStatus.COMPLETED, order=1),
            ProgressMilestone(progress_id=prog_alex.id, title="Grid Systems & Layout Design", status=MilestoneStatus.COMPLETED, order=2),
            ProgressMilestone(progress_id=prog_alex.id, title="Figma Components & Auto-layout", status=MilestoneStatus.IN_PROGRESS, order=3),
            ProgressMilestone(progress_id=prog_alex.id, title="Capstone Portfolio Screen", status=MilestoneStatus.UPCOMING, order=4)
        ])

        prog_sarah = LearningProgress(
            swap_id=swap.id,
            user_id=sarah.id,
            skill_id=python_skill.id,
            current_level="Beginner",
            target_level="Intermediate",
            progress_percentage=40,
            total_sessions=10,
            completed_sessions=4
        )
        db.add(prog_sarah)
        await db.flush()

        db.add_all([
            ProgressMilestone(progress_id=prog_sarah.id, title="Python Syntax & Data Types", status=MilestoneStatus.COMPLETED, order=1),
            ProgressMilestone(progress_id=prog_sarah.id, title="Loops & Function Scope", status=MilestoneStatus.COMPLETED, order=2),
            ProgressMilestone(progress_id=prog_sarah.id, title="Working with JSON & APIs", status=MilestoneStatus.IN_PROGRESS, order=3),
            ProgressMilestone(progress_id=prog_sarah.id, title="Automating SVG Graphic Export", status=MilestoneStatus.UPCOMING, order=4)
        ])

        # Upcoming learning session
        upcoming_session = LearningSession(
            swap_id=swap.id,
            scheduled_by_id=alex.id,
            skill_id=python_skill.id,
            title="Python Functions & Data Parsing Lab",
            date_time=datetime.now(timezone.utc) + timedelta(days=2, hours=3),
            duration_minutes=60,
            notes="We will write scripts to parse color palettes from JSON into Figma tokens.",
            meeting_link="https://meet.jit.si/skillswap-alex-sarah-session3",
            status=SessionStatus.UPCOMING
        )
        db.add(upcoming_session)

        # Sample 5-star review
        rev = Review(
            swap_id=swap.id,
            reviewer_id=alex.id,
            reviewee_id=sarah.id,
            communication_rating=5,
            teaching_rating=5,
            helpfulness_rating=5,
            overall_rating=5.0,
            comment="Sarah is an exceptional mentor! She breaks down complex design systems into intuitive visual steps. Highly recommended for any developer wanting to master design."
        )
        db.add(rev)

        await db.commit()
        print("SkillSwap demo database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
