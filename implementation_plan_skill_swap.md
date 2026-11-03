# SkillSwap — Peer-to-Peer Skill Exchange Platform

> **Learn. Teach. Exchange. Grow Together.**

SkillSwap is a peer-to-peer skill exchange platform that connects people who want to **teach the skills they know and learn the skills they want**.

Instead of traditional course-based learning, SkillSwap enables users to find compatible learning partners, exchange skills, communicate in real time, schedule sessions, track learning progress, and build meaningful connections.

---

## 1. What is SkillSwap?

The core idea is simple:

**You teach what you know → You learn what you want.**

For example:

- Person A knows **Web Development** and wants to learn **Graphic Design**.
- Person B knows **Graphic Design** and wants to learn **Web Development**.
- SkillSwap identifies the compatible exchange.
- They can connect, chat, schedule sessions, learn together, and track their progress.

The application is designed around the complete journey:

```text
Authentication
      ↓
Profile Setup
      ↓
Skills & Preferences
      ↓
Explore People
      ↓
Skill Matching
      ↓
Swap Request
      ↓
Accepted Skill Swap
      ↓
Chat + Sessions + Goals
      ↓
Progress Tracking
      ↓
Reviews
```

---

# 2. Key Features

### User & Authentication

- Sign up
- Sign in
- Account recovery
- Email/account verification
- User profile creation
- Profile editing
- Custom FastAPI JWT authentication
- Password hashing using Argon2 / bcrypt
- PostgreSQL-backed user storage and protected routes

### Skill Discovery

- Search for skills
- Browse skill categories
- Search users
- Filter users
- View public profiles
- View skills users can teach
- View skills users want to learn

### Skill Matching

- Find compatible users
- Match teaching and learning interests
- Display match scores
- Display match explanations
- Explore recommended learning partners

### Skill Swap Requests

- Send swap request
- Receive requests
- View sent requests
- Accept request
- Decline request
- Cancel request
- Create an active skill swap after acceptance

### Active Skill Swap

An active swap brings the two users together in one learning workspace.

It includes:

- Partner profile
- Skill exchange information
- Shared goals
- Chat
- Sessions
- Learning progress
- Milestones
- Resources
- Reviews

### Real-Time Chat

- Conversation list
- Message history
- Real-time messaging
- WebSocket communication
- Read/unread state
- File/image/resource attachments
- Partner profile information

### Learning Sessions

- Schedule sessions
- View upcoming sessions
- View past sessions
- Reschedule sessions
- Cancel sessions
- Add meeting links
- Add notes
- Track session status

### Learning Progress

- Track progress percentage
- Track completed sessions
- Track total sessions
- Create milestones
- Mark milestones as completed
- Track current skill level
- Track target skill level

### Reviews & Ratings

- Review skill-exchange partners
- Communication rating
- Teaching rating
- Helpfulness rating
- Overall rating
- Review comments
- View received reviews
- View reviews given

### Notifications

- Swap request notifications
- Chat notifications
- Session notifications
- Review notifications
- Mark individual notifications as read
- Mark all notifications as read

### Privacy & Safety

- Profile visibility controls
- Email privacy controls
- Phone privacy controls
- Online status visibility
- Learning activity visibility
- Review visibility
- Profile indexing control
- Block users
- Unblock users
- Report users
- Change password
- Login/security controls

### Responsive Interface

The UI is designed for:

- Desktop
- Tablet
- Mobile

---

# 3. How SkillSwap Works

```text
                    ┌──────────────────┐
                    │      Sign In     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Complete Profile │
                    └────────┬─────────┘
                             ↓
                 ┌─────────────────────────┐
                 │ Add Skills & Preferences│
                 └────────────┬────────────┘
                              ↓
                    ┌──────────────────┐
                    │  Explore People  │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Find a Match     │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Send Swap Request│
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Request Accepted │
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │  Active Skill    │
                    │      Swap        │
                    └────────┬─────────┘
                             ↓
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
       Chat              Sessions           Progress
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
                    ┌──────────────────┐
                    │ Complete Learning│
                    └────────┬─────────┘
                             ↓
                    ┌──────────────────┐
                    │ Review & Continue│
                    └──────────────────┘
```

---

# 4. Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| Next.js | Frontend framework and routing |
| React | UI components |
| TypeScript | Type-safe frontend development |
| Tailwind CSS | Styling and responsive UI |
| lucide-react | UI icons |
| Fetch API | Backend API communication |

## Backend

| Technology | Purpose |
|---|---|
| Python | Backend programming language |
| FastAPI | REST API framework |
| Pydantic | Request/response validation |
| SQLAlchemy | ORM and database access |
| Alembic | Database migrations |
| Pytest | Backend testing |
| WebSockets | Real-time communication |

## Database & Infrastructure

| Technology | Purpose | Development Direction |
|---|---|---|
| SQLite | Local development/fallback database | Available locally |
| PostgreSQL | Production application database | Production target |
| Redis | Caching, rate limiting and temporary state | Add/use when required |
| WebSockets | Real-time chat | Backend structure exists |

## Authentication

| Technology | Purpose |
|---|---|
| FastAPI JWT | Identity and authentication |
| PostgreSQL | Persistent user data and profile storage |
| Argon2 / bcrypt | Password hashing |

### Important

SkillSwap owns the authentication flow locally and stores a single application-managed user record in PostgreSQL.

The custom auth flow manages:

- Sign up
- Sign in
- Password management
- Account recovery
- Email verification

PostgreSQL stores the **SkillSwap user account, profile data, and hashed password**.

The intended flow is:

```text
User
 ↓
Next.js
 ↓
FastAPI /auth endpoints
 ↓
Validate credentials
 ↓
Issue JWT access token
 ↓
FastAPI protected routes
 ↓
Load local user and profile data
 ↓
SkillSwap Dashboard
```

The custom authentication flow is considered complete when sign-up, sign-in, token validation, logout, and protected-route access are all working and verified.

---

# 5. System Architecture

```text
                         Browser
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Next.js / React   │
                 │      Frontend       │
                 └──────────┬──────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
             REST API               WebSocket
                │                       │
                ▼                       ▼
         ┌──────────────────────────────────┐
         │          FastAPI Backend         │
         └────────────────┬─────────────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
      ┌──────────┐   ┌──────────┐  ┌─────────────┐
      │SQLAlchemy│   │  Redis   │  │   Entra     │
      │   ORM    │   │ Cache /  │  │  External   │
      └────┬─────┘   │Rate Limit│  │     ID      │
           │         └──────────┘  └─────────────┘
           ▼
   ┌─────────────────┐
   │ SQLite /         │
   │ PostgreSQL       │
   └─────────────────┘
```

---

# 6. Database Responsibility

PostgreSQL is the intended production source of truth for SkillSwap application data.

The database should contain application information such as:

```text
users
profiles
skills
skill_categories
user_skills
swap_requests
skill_swaps
conversations
messages
learning_progress
milestones
learning_sessions
reviews
notifications
reports
blocked_users
privacy_settings
```

The application database **must not store user passwords** when Entra External ID is used.

---

# 7. Repository Structure

```text
skill_swap_proj/
│
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies/
│   │   │   │   ├── auth.py
│   │   │   │   ├── database.py
│   │   │   │   └── rate_limiter.py
│   │   │   │
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
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── websocket/
│   │   └── main.py
│   │
│   ├── tests/
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── alembic.ini
│   ├── pytest.ini
│   ├── requirements.txt
│   └── skillswap.db
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── skill_swap_web_images/
├── uploads/
├── .gitignore
├── implementation_plan_skill_swap.md
├── skill_swap_project_requirements.md
└── README.md
```

---

# 8. Important Files

### Frontend

```text
frontend/app/
```

Contains Next.js pages/routes.

```text
frontend/components/
```

Reusable UI components.

```text
frontend/services/
```

Frontend API service functions used to communicate with FastAPI.

```text
frontend/types/
```

TypeScript interfaces and application types.

```text
frontend/hooks/
```

Reusable React hooks.

```text
frontend/lib/
```

Shared frontend utilities and configuration.

---

### Backend

```text
backend/app/main.py
```

Main FastAPI application entry point.

```text
backend/app/api/routes/
```

REST API endpoints grouped by feature.

```text
backend/app/api/dependencies/
```

Shared request dependencies such as authentication, database access and rate limiting.

```text
backend/app/core/
```

Application configuration, database configuration and security functionality.

```text
backend/app/models/
```

SQLAlchemy database models.

```text
backend/app/schemas/
```

Pydantic request and response schemas.

```text
backend/app/services/
```

Business logic and reusable backend services.

```text
backend/app/websocket/
```

Real-time WebSocket functionality.

```text
backend/alembic/
```

Database migration system.

```text
backend/tests/
```

Backend tests.

---

# 9. Local Development Requirements

Install the following:

### Required

- Python 3.x
- Node.js
- npm
- Git
- Microsoft account for Entra configuration
- Code editor such as VS Code

### Application services

```text
Frontend
    ↓
Next.js

Backend
    ↓
FastAPI

Database
    ↓
SQLite locally
PostgreSQL for production

Authentication
    ↓
Microsoft Entra External ID

Realtime
    ↓
FastAPI WebSockets

Caching / Rate Limiting
    ↓
Redis
```

Docker is optional for local development.

---

# 10. Running the Backend

Open PowerShell.

From the project root:

```powershell
cd backend
```

Create a virtual environment if one does not already exist:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
```

Then:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run migrations:

```powershell
alembic upgrade head
```

Start FastAPI:

```powershell
uvicorn app.main:app --reload
```

The backend should then be available on the local FastAPI development server.

FastAPI API documentation is normally available at:

```text
/docs
```

---

# 11. Running the Frontend

Open a **second PowerShell terminal**.

From the project root:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start Next.js:

```powershell
npm run dev
```

Important:

`npm run dev` must be executed from the directory containing `package.json`.

Correct:

```text
skill_swap_proj/
    frontend/
        package.json
```

Therefore:

```powershell
cd frontend
npm run dev
```

Running `npm run dev` directly from:

```text
skill_swap_proj>
```

will fail if there is no `package.json` in the project root.

---

# 12. Environment Configuration

The project uses environment variables for configuration.

Backend:

```text
backend/.env
```

Frontend:

```text
frontend/.env.local
```

Never commit these files to GitHub.

Use:

```text
backend/.env.example
```

as the template for backend configuration.

Typical configuration categories include:

```text
Database URL
Redis URL
Authentication configuration
Entra tenant information
Entra client/application information
Frontend URL
Backend URL
CORS configuration
JWT/OIDC configuration
Upload configuration
```

Actual secrets and credentials must remain local or in the deployment platform's secret manager.

---

# 13. Microsoft Entra External ID Setup

Authentication is one of the areas that requires **manual external configuration**.

The code can be generated or assisted by AI, but the following must be configured and verified by the developer:

1. Microsoft Entra tenant
2. External ID configuration
3. Application registration
4. Redirect URI
5. Frontend authentication configuration
6. Client/application identifiers
7. Tenant/issuer configuration
8. Required permissions
9. Token configuration
10. Backend token validation
11. Local environment variables
12. Production environment variables
13. Real sign-in/sign-up testing

The intended architecture is:

```text
User
 ↓
Next.js
 ↓
Microsoft Entra External ID
 ↓
OIDC Authentication
 ↓
Access/ID Token
 ↓
FastAPI
 ↓
Token Validation
 ↓
Find/Create User
 ↓
Create Profile
 ↓
Dashboard
```

Do **not** create a separate password database for SkillSwap.

---

# 14. PostgreSQL Setup

For local development, the existing project can use SQLite where configured.

For production, PostgreSQL should be used.

The application should use:

```text
SQLAlchemy
        ↓
PostgreSQL
```

with Alembic handling schema migrations.

Typical development process:

```powershell
alembic upgrade head
```

Whenever the database schema changes:

```text
SQLAlchemy Model
        ↓
Alembic Migration
        ↓
Database
```

Do not manually modify production database tables without corresponding migrations.

---

# 15. Redis

Redis is intended for:

- Rate limiting
- Caching
- Temporary state
- High-speed application state
- WebSocket-related infrastructure where required

Redis is not the primary database.

The primary application data remains in PostgreSQL.

For local development, the project may use an in-memory fallback where implemented, allowing development without Redis running.

---

# 16. Authentication vs Application Database

These two systems have different responsibilities.

### Microsoft Entra External ID

Responsible for:

```text
Identity
Sign Up
Sign In
Password
Account Recovery
Authentication
Identity Verification
```

### PostgreSQL

Responsible for:

```text
User application record
Profile
Skills
Preferences
Swaps
Requests
Messages
Sessions
Progress
Milestones
Reviews
Notifications
Privacy
Safety
```

The local `users` record should contain the Entra identity reference so SkillSwap can connect the authenticated identity with its application data.

---

# 17. Frontend ↔ Backend Flow

The normal request flow is:

```text
Next.js Page
      ↓
React Component
      ↓
Frontend Service
      ↓
Fetch API
      ↓
FastAPI Route
      ↓
Pydantic Validation
      ↓
Service / Business Logic
      ↓
SQLAlchemy
      ↓
Database
```

For real-time chat:

```text
Next.js Chat UI
      ↓
WebSocket
      ↓
FastAPI WebSocket
      ↓
Message Service
      ↓
Database / Redis
```

---

# 18. Database-Backed Feature Development

When implementing a new database-backed feature, follow this order:

```text
Requirement
    ↓
Frontend UI
    ↓
TypeScript Type
    ↓
Frontend Service
    ↓
FastAPI Route
    ↓
Pydantic Schema
    ↓
Business Logic
    ↓
SQLAlchemy Model
    ↓
Alembic Migration
    ↓
Database
    ↓
Tests
    ↓
End-to-End Verification
```

Not every feature requires every layer, but all affected layers must remain consistent.

---

# 19. Current Development Principle

When modifying an existing feature:

1. Read the existing implementation.
2. Understand its original intent.
3. Inspect the frontend page/component.
4. Inspect the frontend service.
5. Inspect the backend route.
6. Inspect the related model/service.
7. Preserve existing working behavior.
8. Implement only the missing functionality.
9. Run the application.
10. Test the complete user flow.
11. Update documentation only after verification.

**Do not replace working code simply because another implementation is possible.**

---

# 20. AI-Assisted Development

AI can assist with:

- React components
- Next.js pages
- TypeScript types
- FastAPI routes
- Pydantic schemas
- SQLAlchemy models
- Services
- Tests
- Alembic migrations
- Debugging
- Refactoring
- Documentation

However, the developer must manually control and verify:

- Microsoft/Azure tenant creation
- Entra application registration
- Authentication configuration
- Permissions
- Redirect URIs
- Secrets
- Database credentials
- Production accounts
- Deployment credentials
- DNS/domain configuration
- Production environment variables
- Real authentication testing
- Security decisions
- Production verification

Generated code does **not** prove that an external service has been configured correctly.

---

# 21. Security Rules

Never commit:

```text
.env
.env.local
Passwords
API keys
Client secrets
Access tokens
Refresh tokens
Private certificates
Database credentials
```

Use `.gitignore` to prevent accidental commits.

Authentication and authorization must be enforced by the backend.

Do not disable token validation or authorization as a temporary workaround for authentication problems.

---

# 22. Testing

Backend tests are located in:

```text
backend/tests/
```

Run:

```powershell
cd backend
pytest
```

Testing should eventually cover:

- Authentication
- Profile creation/update
- Skills
- Search
- Matching
- Requests
- Swaps
- Chat
- Sessions
- Progress
- Milestones
- Reviews
- Notifications
- Privacy
- Blocking
- Reporting

The complete user journey should also be tested through the browser.

---

# 23. End-to-End User Journey

A complete test should verify:

```text
Create/Login User
        ↓
Complete Profile
        ↓
Add Teaching Skills
        ↓
Add Learning Skills
        ↓
Explore Users
        ↓
Find Match
        ↓
Send Request
        ↓
Second User Accepts
        ↓
Active Swap Created
        ↓
Open Chat
        ↓
Send Message
        ↓
Schedule Session
        ↓
Complete Session
        ↓
Update Progress
        ↓
Complete Milestone
        ↓
Submit Review
```

---

# 24. Troubleshooting

## `npm run dev` says `package.json` cannot be found

If PowerShell shows:

```text
skill_swap_proj>
```

run:

```powershell
cd frontend
npm run dev
```

because `package.json` is inside `frontend/`.

---

## Backend does not start

From `backend/`:

```powershell
python --version
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Check:

```text
backend/.env
```

if configuration errors occur.

---

## Database errors

Check:

- Database URL
- Database availability
- Migration status
- SQLAlchemy configuration

Then run:

```powershell
alembic upgrade head
```

---

## Frontend cannot reach backend

Check:

- Backend is running
- Frontend API base URL
- `frontend/.env.local`
- FastAPI CORS configuration
- Browser console
- Backend terminal logs

---

## Authentication errors

Check:

- Entra tenant
- Application registration
- Client/application ID
- Tenant ID
- Redirect URI
- Issuer
- Audience
- Frontend auth configuration
- Backend token validation
- Environment variables

Do not disable authorization or token validation to bypass the problem.

---

# 25. Deployment Direction

The intended production architecture is:

```text
GitHub
   ↓
Vercel
   ↓
Next.js Frontend
   ↓
Cloud-hosted FastAPI
   ├── PostgreSQL
   ├── Redis
   └── Microsoft Entra External ID
```

For a student/portfolio project, prefer free tiers or student benefits wherever they are sufficient.

Possible deployment direction:

```text
Frontend
→ Vercel Free Tier

Backend
→ Free/Student-eligible cloud hosting

Database
→ PostgreSQL free tier / student allowance

Redis
→ Free tier where available

Authentication
→ Microsoft Entra External ID / eligible free capabilities
```

Always verify the current provider limits before deployment.

---

# 26. Project Status

SkillSwap is an actively developed full-stack project.

The frontend UI, backend architecture, service layer, database layer and feature structure are already established to varying degrees.

However, **a technology appearing in the architecture does not automatically mean that its production integration is complete**.

In particular, these areas require explicit verification:

```text
Microsoft Entra External ID
        ↓
Manual tenant/application configuration
        ↓
OAuth/OIDC integration
        ↓
Frontend authentication
        ↓
Backend token validation
        ↓
User creation/linking
        ↓
Real sign-in/sign-up test
```

Similarly:

```text
PostgreSQL
        ↓
Production database configuration
        ↓
Alembic migrations
        ↓
Production connection
        ↓
Verification
```

and:

```text
Redis
        ↓
Connection
        ↓
Rate limiting/cache usage
        ↓
WebSocket infrastructure where required
        ↓
Verification
```

The project should be considered **fully implemented only after the corresponding user flows have been tested end-to-end**.

---

# 27. Recommended Implementation Order

For continued development, follow this order:

```text
1. Authentication
      ↓
2. User / Profile creation
      ↓
3. Skills & Preferences
      ↓
4. Explore / Search
      ↓
5. Matching
      ↓
6. Swap Requests
      ↓
7. Active Skill Swap
      ↓
8. Chat / WebSockets
      ↓
9. Sessions
      ↓
10. Learning Progress
      ↓
11. Reviews
      ↓
12. Notifications
      ↓
13. Privacy & Safety
      ↓
14. Testing
      ↓
15. PostgreSQL production setup
      ↓
16. Redis integration
      ↓
17. Deployment
```

---

# 28. Related Documentation

The repository contains separate documentation for different purposes:

```text
README.md
    ↓
Project overview, setup and developer entry point

skill_swap_project_requirements.md
    ↓
Functional and product requirements

implementation_plan_skill_swap.md
    ↓
Technical implementation plan and development roadmap

INSTRUCTIONS.md
    ↓
Detailed developer instructions, project structure,
configuration, manual setup and development workflow
```

These documents should serve different purposes rather than duplicating one another.

---

# 29. License

This project is developed for:

- Educational purposes
- Portfolio demonstration
- Learning
- Software engineering practice

No confidential credentials, API keys, passwords, tokens or private configuration should be included in the public repository.

---

## SkillSwap

**Learn. Teach. Exchange. Grow Together.**