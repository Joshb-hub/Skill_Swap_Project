# SkillSwap

> **Learn. Teach. Exchange. Grow Together.**

SkillSwap is a peer-to-peer skill exchange platform that connects people who want to **teach the skills they know and learn the skills they want**.

Instead of traditional course-based learning, SkillSwap enables users to find compatible learning partners, exchange skills, communicate in real time, schedule sessions, track learning progress, and build meaningful connections.

---

## What is SkillSwap?

The core idea is simple:

**You teach what you know → You learn what you want.**

For example:

- Person A knows **Web Development** and wants to learn **Graphic Design**.
- Person B knows **Graphic Design** and wants to learn **Web Development**.
- SkillSwap identifies the compatible exchange.
- They can connect, chat, schedule sessions, learn together, and track their progress.

---

## Key Features

- **Skill-based Discovery** — Find people based on skills they teach and want to learn.
- **Skill Matching** — Discover compatible skill-exchange partners.
- **User Profiles** — Showcase skills, experience, profession, availability, and learning preferences.
- **Skill Swap Requests** — Send, accept, decline, and manage exchange requests.
- **Active Skill Swaps** — Manage an ongoing learning partnership.
- **Real-Time Chat** — Communicate through WebSocket-powered messaging.
- **Session Scheduling** — Schedule, reschedule, cancel, and manage learning sessions.
- **Learning Goals** — Define learning objectives and target skill levels.
- **Progress Tracking** — Track milestones, completed sessions, and learning progress.
- **Reviews & Ratings** — Review your skill-exchange partners after sessions.
- **Notifications** — Receive updates for requests, messages, sessions, and reviews.
- **Privacy Controls** — Control profile and contact information visibility.
- **Block & Report** — Safety and moderation tools for users.
- **Responsive UI** — Designed for desktop, tablet, and mobile devices.

---

## How It Works

```text
Sign In
   │
   ▼
Complete Profile
   │
   ├── Skills You Teach
   ├── Skills You Want to Learn
   ├── Experience
   └── Availability
   │
   ▼
Explore People
   │
   ▼
Find a Compatible Partner
   │
   ▼
Send Skill Swap Request
   │
   ▼
Request Accepted
   │
   ▼
Active Skill Swap
   │
   ├── Chat
   ├── Schedule Sessions
   ├── Learning Goals
   └── Track Progress
   │
   ▼
Complete Sessions
   │
   ▼
Review & Continue Learning
```

---

## Technology Stack

### Frontend

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**

### Backend

- **Python**
- **FastAPI**
- **Pydantic**
- **SQLAlchemy**
- **Alembic**

### Database & Real-Time Services

- **PostgreSQL** — Persistent application data
- **Redis** — Caching, rate limiting, temporary state, and supporting real-time infrastructure
- **WebSockets** — Real-time chat communication

### Authentication

- **Custom FastAPI JWT authentication**
- **Argon2 / bcrypt password hashing**
- **PostgreSQL-backed user storage**

SkillSwap uses a custom email/username and password authentication flow built on FastAPI, SQLAlchemy, and PostgreSQL. Passwords are hashed before storage and protected routes require a valid JWT access token.

The SkillSwap database stores application-specific information such as the user's profile, skills, swaps, sessions, progress, reviews, and notifications alongside the authenticated local account record.

---

## System Architecture

```text
                    ┌───────────────────┐
                    │   Next.js / React │
                    │     Frontend      │
                    └─────────┬─────────┘
                              │
                    REST API / WebSocket
                              │
                              ▼
                    ┌───────────────────┐
                    │      FastAPI      │
                    │      Backend      │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
             ▼                ▼                ▼
      ┌────────────┐   ┌────────────┐   ┌────────────┐
      │ PostgreSQL │   │   Redis    │   │  JWT Auth  │
      │ Application│   │ Cache &    │   │   Tokens   │
      │    Data    │   │ Rate Limit │   │ & Sessions │
      └────────────┘   └────────────┘   └────────────┘
                              │
                              ▼
                       WebSocket Chat
```

---

## Authentication

SkillSwap uses **custom FastAPI JWT authentication** backed by PostgreSQL.

Users create an account in SkillSwap, log in with their email or username and password, and receive a signed JWT access token for protected API access.

```text
User
 │
 ▼
SkillSwap Frontend
 │
 ▼
SkillSwap FastAPI Backend
 │
 ├── Sign Up
 ├── Sign In
 ├── Password Reset
 └── Email Verification
 │
 ▼
PostgreSQL User + Profile Data
 │
 ▼
Protected Resources / Authorization
```

The backend validates JWTs, hashes passwords, and enforces access rules for protected resources.

> **Important:** Authentication is handled entirely by the SkillSwap backend and database. No external identity provider or OAuth callback flow is required.

---

## Project Structure

```text
SkillSwap/
│
├── backend/
│   ├── app/
│   │   ├── api/              # API routes/endpoints
│   │   ├── core/             # Core configuration and security
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business/application services
│   │   ├── websocket/        # Real-time WebSocket functionality
│   │   └── main.py           # FastAPI application entry point
│   │
│   ├── alembic/              # Database migrations
│   ├── tests/                # Backend tests
│   ├── uploads/              # Uploaded files
│   ├── requirements.txt      # Python dependencies
│   └── alembic.ini           # Alembic configuration
│
├── frontend/
│   ├── app/                  # Next.js routes/pages
│   ├── components/           # Reusable UI components
│   ├── hooks/                # React hooks
│   ├── lib/                  # Frontend utilities/configuration
│   ├── services/             # API service functions
│   ├── types/                # TypeScript types
│   └── package.json          # Node.js dependencies and scripts
│
├── implementation_plan_skill_swap.md
├── skill_swap_project_requirements.md
├── .gitignore
└── README.md
```

---

## Running Locally

### Prerequisites

Install the following before starting:

- Python
- Node.js and npm
- Git
- PostgreSQL, when using the PostgreSQL configuration
- Redis, when the configured application features require it

You only need the local project environment configuration for your custom FastAPI JWT flow.

### Backend

Open PowerShell in the project root:

```powershell
cd backend
```

Create and activate the virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Configure:

```text
backend/.env
```

Run database migrations:

```powershell
alembic upgrade head
```

Start the FastAPI server:

```powershell
uvicorn app.main:app --reload
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

FastAPI API documentation is normally available at:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open a **second terminal**.

From the project root:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the Next.js development server:

```powershell
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

> **Important:** `npm run dev` must be executed from the `frontend` directory because `package.json` is located there, not in the project root.

---

## Environment Variables

The project uses environment files for local configuration.

Create/configure:

```text
backend/.env
frontend/.env.local
```

Typical configuration areas include:

- PostgreSQL connection details
- Redis connection details
- JWT secret and token settings
- Frontend/backend API URLs
- Authentication configuration
- Other application-specific settings required by the codebase

Use the existing `.env.example` files as the reference for variable names.

**Never commit `.env`, `.env.local`, credentials, client secrets, API keys, access tokens, or other sensitive configuration to GitHub.**

---

## Manual Configuration Required

Some parts of the project cannot be completed simply by generating application code.

Before considering the application fully functional, configure and verify:

### Custom Authentication Setup

- Configure PostgreSQL for the intended environment.
- Set the backend JWT secret and token lifetime values.
- Run Alembic migrations for the local user tables.
- Configure the frontend API base URL.
- Test sign-up, sign-in, sign-out, and account recovery.

### Database

- Configure PostgreSQL for the intended environment.
- Set the database connection string.
- Run Alembic migrations.
- Verify tables and relationships.
- Test CRUD operations from the application.

### Redis

- Configure a Redis instance if required by the implemented features.
- Set the Redis connection details.
- Verify connectivity.
- Test rate limiting, caching, or temporary-state functionality where used.

### Production Configuration

For deployment, configure the production equivalents of all required environment variables and external services.

---

## Security & Privacy

SkillSwap is designed around backend-enforced security and privacy controls.

- Custom FastAPI JWT authentication
- Password hashing with Argon2 / bcrypt
- Backend authorization
- Rate limiting
- Protected WebSocket connections
- User blocking
- User reporting
- Profile visibility controls
- Contact information privacy
- Secure environment configuration
- Input validation

Authentication credentials and password hashes remain under the responsibility of the SkillSwap backend and PostgreSQL database.

---

## Deployment

The application is designed for deployment with:

- **Vercel** for the Next.js frontend
- **Cloud-hosted FastAPI backend**
- **Managed PostgreSQL**
- **Managed Redis**, where required
- **Custom JWT authentication** for local application identity and authorization

Environment variables must be configured separately for development and production.

The exact hosting provider and service configuration can be selected according to the project's cost and deployment requirements.

---

## Project Status

SkillSwap is an actively developed full-stack application using a custom FastAPI authentication flow. The project is intended to use PostgreSQL for persistent application data, with Vercel hosting the Next.js frontend.

### Latest Repository Evidence

Based on the GitHub screenshot reviewed on **November 7, 2026**, the visible commit history for `README.md` on the `main` branch shows:

- **Latest visible README commit:** `d75317e`
- **Commit message:** `Implement security and notification preferences tests; add NotificationPreferences component`
- **Displayed commit date:** November 3, 2026
- **Checks shown:** 1 of 1 passed

This is evidence of the latest commit shown for `README.md` only. It does **not** establish that every recent local change has been pushed to GitHub, because the screenshot shows the history of an individual file rather than the repository-wide commit history.

The following items therefore still need direct verification:

- Check the repository-wide commit history on `main` to identify the latest pushed commit.
- Compare the latest local commit with `origin/main` using `git status` and `git log`.
- Confirm that the expected changed files are present in the GitHub repository.
- In Vercel, verify that the latest **Production** deployment is `Ready`, uses the `main` branch, and references the same commit as GitHub.
- Test the deployed frontend against the deployed FastAPI backend and configured database.

### Completion Criteria

**Code being present does not automatically mean that a feature is fully verified.**

A feature should be considered complete when:

1. The required code is implemented.
2. Required environment/configuration is present.
3. External services are configured where necessary.
4. The frontend and backend work together.
5. The relevant flow has been tested successfully.

A successful frontend build or a successful GitHub commit alone does not prove that the complete production application is working.

For the detailed functional requirements, refer to:

```text
skill_swap_project_requirements.md
```

For the implementation sequence and remaining development work, refer to:

```text
implementation_plan_skill_swap.md
```

---

## License

This project is developed for educational, portfolio, and demonstration purposes.
