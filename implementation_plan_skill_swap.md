# Implementation Plan: SkillSwap - Peer-to-Peer Skill Exchange Platform

SkillSwap is a secure peer-to-peer skill exchange platform allowing users to teach skills they know and learn skills from other users. The platform automatically computes compatibility between reciprocal teaching/learning interests (e.g. User A teaches Python & wants Graphic Design; User B teaches Graphic Design & wants Python), provides an explore directory with deep multi-attribute filtering, facilitates request lifecycles, and enables real-time WebSocket chat, session scheduling, milestone progress tracking, reviews, and robust user safety controls.

## User Review Required

> [!IMPORTANT]
> **Database & Infrastructure Execution Strategy:**
> - The primary production stack is **PostgreSQL + Redis + FastAPI + Next.js**.
> - Since Docker is not currently installed on the host environment, we will implement the backend database layer with **SQLAlchemy 2.0 async engine** supporting PostgreSQL (`postgresql+asyncpg://...`) in production, with seamless zero-configuration local fallback to SQLite async (`sqlite+aiosqlite:///./skillswap.db`).
> - Similarly, the rate limiting and WebSocket pub/sub layer connects to Redis if available (`redis://...`), but automatically falls back to an in-memory thread-safe state manager if Redis is not running locally.
> - A `docker-compose.yml` file is provided for instant containerized deployment with PostgreSQL and Redis.
> - This ensures **100% production readiness** without blocking local execution or testing on Windows.

> [!NOTE]
> **Contact Privacy System:**
> Strict backend privacy enforcement guarantees that email addresses and phone numbers are never exposed in public search results or public profiles. Users configure privacy settings (`HIDDEN`, `VISIBLE_AFTER_ACCEPTANCE`, `VISIBLE_WITH_PERMISSION`), which are evaluated server-side when generating profile payloads.

---

## Proposed Changes & Architecture

```
skill_swap_proj/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/
│   │   │   │   ├── auth.py
│   │   │   │   ├── database.py
│   │   │   │   └── rate_limiter.py
│   │   │   └── routes/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── profiles.py
│   │   │       ├── skills.py
│   │   │       ├── search.py
│   │   │       ├── matches.py
│   │   │       ├── requests.py
│   │   │       ├── swaps.py
│   │   │       ├── conversations.py
│   │   │       ├── messages.py
│   │   │       ├── progress.py
│   │   │       ├── sessions.py
│   │   │       ├── reviews.py
│   │   │       ├── notifications.py
│   │   │       ├── settings.py
│   │   │       └── reports.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/
│   │   │   └── __init__.py (all SQLAlchemy 2.0 models)
│   │   ├── schemas/
│   │   │   └── __init__.py (all Pydantic v2 schemas)
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── matching_service.py
│   │   │   ├── privacy_service.py
│   │   │   ├── chat_service.py
│   │   │   └── notification_service.py
│   │   ├── websocket/
│   │   │   ├── connection_manager.py
│   │   │   └── chat_socket.py
│   │   ├── utils/
│   │   │   ├── seed_data.py
│   │   │   └── security_logger.py
│   │   └── main.py
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_rate_limiting.py
│   │   ├── test_matching.py
│   │   ├── test_privacy.py
│   │   ├── test_requests.py
│   │   └── test_chat_authorization.py
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Home / Landing)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── explore/page.tsx (Directory, Search, Filters)
│   │   ├── matches/page.tsx (AI/Python Match Recommendations)
│   │   ├── profile/[username]/page.tsx
│   │   ├── profile/edit/page.tsx
│   │   ├── requests/page.tsx (Sent & Received Swaps)
│   │   ├── swaps/page.tsx (Active Swaps)
│   │   ├── chat/
│   │   │   ├── page.tsx
│   │   │   └── [conversationId]/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── sessions/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── settings/page.tsx (Privacy & Security)
│   ├── components/
│   │   ├── ui/ (Button, Input, Card, Badge, Modal, Tabs, Avatar, Dropdown, Toast, Alert)
│   │   ├── layout/ (Navbar, Footer, Sidebar, UserMenu)
│   │   ├── profile/ (ProfileCard, SkillBadge, ContactPrivacyBadge)
│   │   ├── skills/ (SkillPicker, SkillFormModal)
│   │   ├── chat/ (ChatWindow, MessageBubble, TypingIndicator, PartnerSidebarPopup, AttachmentModal)
│   │   ├── dashboard/ (StatCard, MatchCard, UpcomingSessionCard)
│   │   └── requests/ (RequestCard, RequestModal)
│   ├── hooks/ (useAuth, useChat, useNotifications, useDebounce)
│   ├── lib/ (utils, cn)
│   ├── services/ (apiClient, authService, userService, skillService, matchService, chatService, swapService)
│   ├── types/ (index.ts)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

### Backend Components

#### 1. Core & Database (`backend/app/core/`, `backend/app/models/`)
- **SQLAlchemy 2.0 Declarative Models**:
  - `User`: id, email, username, hashed_password, is_active, is_verified, verification_token, role, created_at, updated_at
  - `Profile`: user_id, full_name, date_of_birth, phone_number, country, state, city, profession, bio, languages (JSON/Array), availability (JSON/Array), preferred_learning_mode (ONLINE, IN_PERSON, EITHER), avatar_url, email_privacy, phone_privacy
  - `SkillCategory`: id, name, slug, description, icon
  - `Skill`: id, category_id, name, description
  - `UserSkill`: id, user_id, skill_id, skill_type (TEACH, LEARN), experience_level (BEGINNER, INTERMEDIATE, ADVANCED, PROFESSIONAL), current_level, target_level, description
  - `SkillSwapRequest`: id, sender_id, receiver_id, offered_skill_id, requested_skill_id, message, status (PENDING, ACCEPTED, DECLINED, CANCELLED)
  - `SkillSwap`: id, request_id, user_a_id, user_b_id, skill_a_id, skill_b_id, status (ACTIVE, COMPLETED, CANCELLED)
  - `Conversation`: id, swap_id, user_a_id, user_b_id, is_active
  - `Message`: id, conversation_id, sender_id, content, message_type (TEXT, LINK, RESOURCE, FILE, IMAGE), file_url, is_read, read_at
  - `LearningGoal` & `LearningProgress`: progress_percentage, milestones, completed_sessions, total_sessions
  - `ProgressMilestone`: id, progress_id, title, description, status (COMPLETED, IN_PROGRESS, UPCOMING)
  - `LearningSession`: id, swap_id, scheduled_by_id, skill_id, title, date_time, duration_minutes, notes, meeting_link, status (UPCOMING, COMPLETED, CANCELLED)
  - `Review`: id, swap_id, reviewer_id, reviewee_id, communication_rating, teaching_rating, helpfulness_rating, overall_rating, comment
  - `Notification`: id, user_id, type, title, message, link, is_read
  - `UserBlock` & `UserReport`: blocker_id, blocked_id, category, description, status
  - `LoginAttempt`: ip_address, identifier, successful, attempted_at
  - `RefreshToken`: user_id, token_hash, expires_at, revoked

#### 2. Authentication & Rate Limiting (`backend/app/core/security.py`, `backend/app/services/auth_service.py`, `backend/app/api/dependencies/rate_limiter.py`)
- Password hashing with **Argon2 / bcrypt**.
- Short-lived JWT Access Tokens (15 min) + secure Refresh Token rotation (7 days).
- In-memory / Redis Brute-Force Rate Limiter:
  - Tracks failed attempts per identifier/IP.
  - After 10 consecutive failures within a 15-minute window, throttles/locks further attempts for 15 minutes.
  - Generic non-disclosing error messages (`Invalid credentials`).
  - Clears failure count upon successful login.
- Email verification flow with token generation, verification endpoint, and resend limit.

#### 3. Python Skill Matching Engine (`backend/app/services/matching_service.py`)
- Implements reciprocal compatibility scoring:
  - **Reciprocal Skills Match (50%)**: User A teaches what User B wants AND User B teaches what User A wants.
  - **One-way Skills Match (25%)**: User A wants what User B teaches.
  - **Experience Level Alignment (10%)**: Teacher level is equal or higher than learner target.
  - **Learning Mode Match (10%)**: Mutual support for Online or In Person.
  - **Availability Overlap (5%)**: Shared weekday/weekend/time slots.
- Returns `match_score` (0-100%), matching skill list, and human-readable explanation (e.g. *"92% Match: You can teach Python, which Alex wants to learn. Alex can teach Graphic Design, which you want to learn."*).

#### 4. Contact Privacy System (`backend/app/services/privacy_service.py`)
- Sanitizes user profile representations before returning them over the wire.
- Never outputs email or phone number in search, matches, or public profile endpoints.
- Evaluates `email_privacy` and `phone_privacy` settings (`HIDDEN`, `VISIBLE_AFTER_ACCEPTANCE`, `VISIBLE_WITH_PERMISSION`):
  - In accepted swap / active conversation: displays contact details only if the partner's privacy level is `VISIBLE_AFTER_ACCEPTANCE` or explicit consent granted.

#### 5. Real-Time Chat & WebSocket (`backend/app/websocket/`, `backend/app/api/routes/conversations.py`)
- WebSocket endpoint: `/ws/chat/{conversation_id}`.
- Handshake token authentication & strict conversation participant verification.
- Messages persisted directly into PostgreSQL/DB with status tracking.
- Typing indicator and online presence broadcasting.
- Chat Profile Popup support delivering reciprocal skill exchanges, goals, sessions, and conditionally shared contact info.
- Safe file upload handling with validation for mime-types, size limits, and sanitized filenames.

#### 6. Database Seeder (`backend/app/utils/seed_data.py`)
- High-quality realistic seed dataset covering:
  - 10 diverse skill categories (Tech, Design, Languages, Music, Trades, Cooking, Business, Arts, Fitness, Academics).
  - 30+ skills.
  - 8 diverse demo users with pre-configured teaching/learning skills, profiles, locations, availability, and active swaps to demonstrate matching, chat, sessions, milestones, and reviews right out of the box!

---

### Frontend Components

#### 1. Modern Next.js 14 + Tailwind UI Architecture
- Reusable UI kit: Buttons, Inputs, Cards, Badges, Modals, Tabs, Avatars, Dropdowns, Toast notifications, Progress bars, Star ratings.
- Responsive Navigation with mobile menu, notification bell with unread badge count, user profile dropdown, and active links.

#### 2. Pages & User Flows
- **Landing Page (`/`)**: Hero banner, Interactive demo search preview, How it works, Top skill categories, Reciprocal matching showcase, Testimonials.
- **Sign Up (`/signup`)**: Complete form with all required fields (Name, Username, DOB, Email, Phone, Passwords, Location, Profession, Bio, Terms/Privacy), password strength indicator, and instant validation.
- **Email Verification (`/verify-email`)**: Confirmation state with resend action.
- **Login (`/login`)**: Email/Username input, show/hide password toggle, remember me, forgot password link, states for invalid credentials, lockout countdown timer, unverified notice.
- **Explore People (`/explore`)**:
  - Live search bar (Skill, Name, Profession, Location, Category).
  - Multi-faceted filter sidebar: Experience levels, Location, Profession, Availability, Learning Mode, Age range, Sorting (Best Match, Most Relevant, Most Experienced, Newest).
  - User cards showing avatar, name, profession, location, skills to teach, skills to learn, experience badges, availability, and "Request Swap" action.
- **Skill Matching Showcase (`/matches`)**: Displays top mutual skill exchange recommendations with match percentage badges and detailed explanation blocks.
- **User Profile (`/profile/[username]` & `/profile/edit`)**:
  - Comprehensive profile layout with bio, location, languages, learning mode, availability.
  - "Skills I Can Teach" & "Skills I Want to Learn" management with interactive modal forms.
  - Privacy settings section for Email & Phone.
- **Swap Requests (`/requests`)**:
  - Sent Requests & Received Requests tabs.
  - Action buttons: Accept (creates swap + conversation), Decline, Cancel.
- **Real-Time Chat (`/chat`, `/chat/[conversationId]`)**:
  - Split view with conversation sidebar (unread counts, online dots, last message preview).
  - Active chat window with message bubbles, date separators, timestamps, typing indicators, attachment uploads.
  - **Partner Profile Popup**: Side-drawer / modal displaying: My Skills vs Partner Skills in this swap, Learning Goals, Current Progress %, Upcoming Sessions, and contact info (if permitted).
- **Learning Sessions (`/sessions`)**:
  - Session scheduler modal: Date, Time, Duration, Skill, Meeting link, Notes.
  - Filter by Upcoming, Completed, Cancelled. Reschedule & Cancel actions.
- **Progress Tracking (`/progress`)**:
  - Active swaps overview with visual progress bars.
  - Milestones checklist (Completed, In Progress, Upcoming) with toggle and add milestone capabilities.
- **Reviews & Ratings (`/reviews`)**:
  - Review modal with 4 sub-ratings (Communication, Teaching Quality, Helpfulness, Overall) + text feedback.
- **Safety & Settings (`/settings`)**:
  - Privacy controls for contact visibility.
  - Blocked users list with unblock button.
  - Report user trigger.

---

## Verification Plan

### Automated Tests
Run pytest in the `backend/` directory:
```powershell
python -m pytest backend/tests -v
```
Test suite will cover:
1. `test_auth.py`: Registration, Password Hashing, Login, Token Refresh, Email verification.
2. `test_rate_limiting.py`: 10 consecutive failed logins trigger lockout and generic error.
3. `test_matching.py`: Reciprocal skill matching algorithm calculations and explanations.
4. `test_privacy.py`: Contact privacy verification (emails and phone numbers hidden in public routes, revealed conditionally on accepted swaps).
5. `test_requests.py`: Swap request lifecycle (Pending -> Accepted/Declined, duplicate prevention, self-request prevention).
6. `test_chat_authorization.py`: Access control prevents unauthorized users from opening or messaging conversations they do not belong to.

### Manual / End-to-End Verification
1. Run backend server with `uvicorn app.main:app --port 8000`.
2. Seed initial data using `python -m app.utils.seed_data`.
3. Verify OpenAPI documentation at `http://localhost:8000/docs`.
4. Run frontend with `npm run build` & `npm run dev`.
5. Test end-to-end user journey in browser:
   - Login as demo user
   - Explore skills directory and apply filters
   - Check AI/Python match recommendations
   - Send skill swap request
   - Switch user and accept request
   - Open real-time chat, test WebSocket communication, inspect partner profile popup
   - Schedule a learning session and update milestone progress
   - Leave a 5-star review
   - Test login lockout security by attempting 10 invalid password attempts.
