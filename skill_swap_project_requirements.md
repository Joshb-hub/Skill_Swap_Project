# SkillSwap Project Requirements & Architecture Summary

This document consolidates the project requirements, product logic, backend API design, frontend structure, and critical implementation details inferred from the codebase.

## 1. Product Overview

SkillSwap is a peer-to-peer skill exchange platform where users offer skills they can teach and request skills they want to learn. The platform matches users with reciprocal compatibility, facilitates skill-swap requests, manages accepted swaps, and supports live communication, session scheduling, learning progress tracking, and feedback.

The public landing page describes the product around:
- teaching what you know
- learning what you love
- zero-tuition reciprocal peer learning
- compatible peer matching
- 1:1 mentorship and skill exchange

The system is designed around a "mutual exchange" model rather than direct paid tutoring.

## 2. Tech Stack

### Backend
- Python
- FastAPI
- SQLAlchemy ORM
- Pydantic v2
- SQLite by default with async SQLite support (`aiosqlite`)
- PostgreSQL-friendly async engine design (`asyncpg` included)
- JWT auth (`python-jose`)
- Password hashing via `passlib` with Argon2/bcrypt
- Redis support for rate limiting / lockout fallback
- WebSockets for chat support
- Alembic for migrations

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- lucide-react for icons
- custom service layer using fetch and localStorage token handling

## 3. Project Structure

- `backend/` - API, models, services, tests, database config, Alembic
- `frontend/` - Next.js application pages, layout, shared UI, auth hooks, service layer, type definitions

The project root also contains:
- `backend/requirements.txt`
- `frontend/package.json`

## 4. Core Functional Requirements

### 4.1 Authentication & Authorization
The backend includes registration, login, logout, token refresh, email verification, password reset, and account management.

Requirements implemented in code:
- email + username uniqueness checks
- strong password validation:
  - minimum 8 chars
  - uppercase required
  - lowercase required
  - numeric digit required
  - special character required
- JWT access and refresh tokens
- secure HttpOnly refresh cookie
- rate limiting and lockout for failed login attempts
- account deactivation instead of full deletion
- email verification token flow
- reset-token flow for forgotten password

Protected routes rely on `get_current_user` and token validation.

### 4.2 Profile Management
Users create a profile during registration and can update it later.

Profile fields include:
- full name
- date of birth (private)
- phone number
- country, state, city
- profession
- bio
- avatar URL
- languages
- availability
- preferred learning mode: Online / In Person / Either
- email privacy and phone privacy settings

Privacy rules are strict and enforced on the backend.

### 4.3 Skill Management
Users can add skills they teach and skills they want to learn.

Skill model design includes:
- category + skill catalog
- user skill entries with types: `TEACH` or `LEARN`
- experience and target levels for learning/teaching progress
- skill description

API capabilities:
- list categories
- search skills by query and category
- add user skill
- remove user skill

### 4.4 Search & Compatibility Matching
The system supports search and discovery across profiles and skills.

Search filters include:
- keyword search
- specific skill query
- category name filter
- profession, location, learning mode, availability, experience level
- sort options (`best_match`, `newest`, `most_experienced`)

Compatibility calculation is implemented in `MatchingService.calculate_compatibility` and considers:
- reciprocal skill overlap
- skill teaching vs learning opportunities
- experience level fit
- preferred learning mode compatibility
- country/city proximity
- availability overlap

Matching output includes:
- match score
- teach_matches
- learn_matches
- explanation string

### 4.5 Swap Requests
A user can request a skill exchange with another user.

Rules enforced:
- cannot request self
- receiver must exist and be active
- blocked users are prevented
- duplicate pending request is disallowed
- request is accepted/declined/cancelled throughout lifecycle

When a request is accepted:
- a `SkillSwap` record is created
- conversation is created or activated
- learning progress records are initialized for both people
- milestone records are created
- notification is sent to the requester

### 4.6 Active Skill Swaps
Once accepted, a swap becomes active.

Swap metadata includes:
- user A and user B
- skill A and skill B
- status: Active / Completed / Cancelled
- linked conversation
- learning progress and sessions

The backend returns active swaps to each participant with partner details and progress status.

### 4.7 Messaging & Live Chat
The system has chat support through WebSockets and REST endpoints.

Functions include:
- list conversations for current user
- fetch messages in a conversation
- attachment upload with allowed file extensions and size checks
- mark messages as read

Strict authorization rules require the user to be a participant in the conversation.

### 4.8 Progress Tracking
The platform supports learning progress per swap.

Progress features include:
- per-user learning progress record
- total sessions and completed sessions
- milestones
- progress percentage

Progress milestones include states:
- Completed
- In Progress
- Upcoming

### 4.9 Learning Sessions
Users can schedule sessions with a title, skill, time, duration, notes, and optional meeting link.

Session states:
- Upcoming
- Completed
- Cancelled

### 4.10 Reviews
After a swap is complete, users can submit review data.

Review fields include:
- communication rating
- teaching rating
- helpfulness rating
- overall rating
- comment

### 4.11 Notifications
App notifications are stored and surfaced to users.

Examples:
- new swap request
- request accepted
- chat updates / events

### 4.12 Safety, Reports, and Privacy
The platform includes:
- user block functionality
- user report submission categories
- privacy settings for email and phone visibility
- profile contact visibility rules based on active accepted swap
- no public exposure of contact details in search or general directory listings

This is a major product requirement and is enforced in both profile visibility logic and backend checks.

## 5. Backend Architecture

### 5.1 App Startup
The app is created in `backend/app/main.py` with:
- CORS configured from environment
- security response headers middleware
- upload directory mounting
- all route modules included under `/api`
- WebSocket router included
- health check at `/health`

### 5.2 Core Config
`backend/app/core/config.py` defines app settings such as:
- project name
- environment
- JWT secret and alg
- token expiration
- database URL
- Redis URL
- rate limiting thresholds
- CORS origins
- upload directory and size limits
- frontend URL

### 5.3 Database & ORM Base
`backend/app/core/database.py` defines:
- async SQLAlchemy engine
- async session factory
- `Base` declarative class
- `get_db()` session dependency
- startup `init_db()` that creates schema

### 5.4 Security Layer
`backend/app/core/security.py` handles:
- password hashing via Argon2 and bcrypt fallback
- access token generation
- refresh token generation
- token decoding/validation
- verification token generation
- reset token generation

### 5.5 Rate Limiter
`backend/app/core/rate_limiter.py` supports:
- Redis-backed throttling when configured
- in-memory fallback when Redis is unavailable
- per-user and per-IP failed login tracking
- lockout window enforcement

### 5.6 Models
The central database schema is defined in `backend/app/models/__init__.py`.

Major entities include:
- `User`
- `Profile`
- `SkillCategory`
- `Skill`
- `UserSkill`
- `SkillSwapRequest`
- `SkillSwap`
- `Conversation`
- `Message`
- `LearningProgress`
- `ProgressMilestone`
- `LearningSession`
- `Review`
- `Notification`
- `UserBlock`
- `UserReport`
- `LoginAttempt`
- `RefreshToken`

Key enums include:
- `LearningMode`: Online / In Person / Either
- `ExperienceLevel`: Beginner / Intermediate / Advanced / Professional
- `PrivacyLevel`: Hidden / Visible After Request Acceptance / Visible With Permission
- `RequestStatus`: Pending / Accepted / Declined / Cancelled
- `SwapStatus`: Active / Completed / Cancelled
- `MessageType`: text, link, resource, file, image
- `SessionStatus`: Upcoming / Completed / Cancelled
- `MilestoneStatus`: Completed / In Progress / Upcoming
- `ReportCategory`: various moderation reasons

### 5.7 API Routes
The main route groups are:
- `auth.py` — register/login/logout/refresh/verify/forgot/reset/me
- `users.py` — current-account access and account deactivation
- `profiles.py` — profile lookup and updates
- `skills.py` — category listing, skill search, user-skill add/remove
- `search.py` — profile search and discovery
- `matches.py` — compatibility matches for authenticated users
- `requests.py` — create, list, accept, decline, cancel swap requests
- `swaps.py` — list active/completed swaps and complete swap
- `conversations.py` — chat conversations and partner profile info
- `messages.py` — get messages, upload attachments, mark read
- `progress.py` — likely progress tracking endpoints not fully read here but implied by product domain
- `sessions.py` — schedule and manage learning sessions
- `reviews.py` — create and retrieve reviews
- `notifications.py` — list/mark notifications
- `settings.py` — privacy settings and account preferences
- `reports.py` — reporting/blocking flows

## 6. API/Business Logic Highlights

### Auth Flow
The registration flow:
1. validates username/email uniqueness
2. creates a `User`
3. creates a corresponding `Profile`
4. generates verification token
5. stores hashed password

Login flow:
1. checks account lockout state
2. validates identifier (email or username)
3. checks login rate limits
4. verifies password
5. rejects disabled accounts
6. resets failed attempts on success
7. issues access + refresh tokens
8. stores refresh token hash and sets HttpOnly cookie

### Privacy Flow
The privacy service defines strict rules:
- owner always sees their own profile contact data
- unauthenticated users never see email/phone
- users with no accepted/active swap cannot see contact info
- visibility occurs only when configured according to `PrivacyLevel`
- backend only, not just frontend UI

### Matching Flow
The matching algorithm computes a score using a weighted combination of:
- direct reciprocal skill exchange
- experience alignment
- learning mode compatibility
- location similarity
- availability overlap

The score is intentionally boosted for strong reciprocal matches, and the code includes a guarantee-like threshold of 88 for a robust two-way exchange.

## 7. Frontend Architecture

### Frontend app pages
The frontend includes routes for:
- home
- login
- signup
- verify-email
- forgot-password
- reset-password
- explore
- matches
- requests
- swaps
- chat
- conversation detail pages
- profile and profile edit
- progress
- sessions
- reviews
- notifications
- settings

### Shared App Shell
`frontend/app/layout.tsx` wraps the app with:
- `AuthProvider`
- `Navbar`
- `Footer`

### Auth Provider
`frontend/hooks/useAuth.tsx` centralizes the authenticated user state and login/logout flows.

### Service Layer
`frontend/services/index.ts` and `frontend/services/apiClient.ts` define the API client and service wrappers for:
- auth
- profiles
- skills
- search
- matches
- swap requests
- swaps
- chat
- progress
- sessions
- reviews
- notifications
- safety/privacy settings

The API client:
- reads tokens from localStorage
- sends Authorization headers
- includes credentials for cookies
- auto-clears tokens on 401
- handles JSON and FormData requests

### Shared Types
`frontend/types/index.ts` defines the product data contracts used by the UI.

## 8. Example Product Workflows

### Sign-up + Setup
- create account
- verify email
- update profile
- add teach/learn skills
- browse and search peers

### Match and Request
- view recommended users
- inspect profiles and compatibility notes
- send a swap request with offered and requested skills
- receive or accept requests

### Swap Execution
- active swap created after acceptance
- initiate chat conversation
- schedule learning sessions
- monitor learning progress milestones
- mark swap complete
- submit reviews

## 9. Testing Coverage
The project has backend tests covering:
- auth registration & login flow
- password validation
- matching calculation
- privacy enforcement
- login rate limiting and lockout behavior
- swap request lifecycle
- chat access control

Files involved:
- `backend/tests/test_auth.py`
- `backend/tests/test_matching.py`
- `backend/tests/test_privacy.py`
- `backend/tests/test_rate_limiting.py`
- `backend/tests/test_requests.py`
- `backend/tests/test_chat_authorization.py`

These tests indicate the expected product behavior and are a good specification for the project's intended requirements.

## 10. Security and Trust Requirements
The codebase strongly enforces these principles:
- secure password storage
- restricted contact visibility
- protected routes with authentication
- explicit conversation membership checks
- block restrictions on requests
- lockouts against brute-force login attempts
- safe generic password reset responses
- secure cookie handling for refresh tokens
- CORS and security headers

## 11. Observed Product Requirements Summary
The app is clearly designed to satisfy the following business needs:
- reciprocal learning exchange without monetary payment
- skill discovery based on user expertise and learning goals
- proven compatibility matching
- safe and privacy-aware connection to peers
- structured request acceptance flow
- collaborative learning lifecycle
- trust-building through reviews and progress tracking
- moderation via blocking and reporting

## 12. Key Implementation Notes / Potential Risks
The codebase is comprehensive and coherent, but a few patterns are worth noting:
- a lot of domain logic is embedded directly into the route handlers, which is fine for a project prototype but less modular long-term
- some frontend pages likely exist but were not fully inspected in this summary; the service layer indicates the intended user journeys comprehensively
- production readiness would require stronger email delivery, real Redis deployment, and a more complete frontend state model
- the app uses SQLite by default for local development, but the schema and libraries support more production-ready DBs

## 13. Final Interpretation
This project is a full-stack skill-exchange platform with a very clear product model: users teach and learn reciprocally, are matched based on skills and compatibility, and collaborate through structured swaps and chat. The backend is the main source of business rules and enforcement, while the frontend is a polished Next.js experience that exposes the platform’s user journeys.

The codebase reflects a mature MVP/early production-ready prototype with strong emphasis on privacy, matchmaking, and trust.
