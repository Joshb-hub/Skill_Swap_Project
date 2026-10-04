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
- **Redis** — Caching, rate limiting, temporary state, and real-time infrastructure
- **WebSockets** — Real-time chat communication

### Authentication

- **Microsoft Entra External ID**
- **OAuth 2.0**
- **OpenID Connect**

Authentication and account management are handled by Microsoft Entra External ID. SkillSwap does not store user passwords.

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
      │ PostgreSQL │   │   Redis    │   │   Entra    │
      │ Application│   │ Cache &    │   │  External  │
      │    Data    │   │ Rate Limit │   │     ID     │
      └────────────┘   └────────────┘   └────────────┘
                              │
                              ▼
                       WebSocket Chat
```

---

## Authentication

SkillSwap uses **Microsoft Entra External ID** for authentication.

The application does not implement or store its own passwords.

```text
User
 │
 ▼
SkillSwap
 │
 ▼
Microsoft Entra External ID
 │
 ├── Sign In
 ├── Sign Up
 ├── Account Recovery
 └── Identity Verification
 │
 ▼
Authenticated User
 │
 ▼
SkillSwap Profile & Application Data
```

Entra manages identity and authentication, while PostgreSQL stores SkillSwap-specific profile and application data.

---

## Project Structure

```text
SkillSwap/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── websocket/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   ├── requirements.txt
│   └── alembic.ini
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── types/
│   └── package.json
│
├── implementation_plan_skill_swap.md
├── skill_swap_project_requirements.md
├── .gitignore
└── README.md
```

---

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure your environment variables in:

```text
backend/.env
```

Run database migrations:

```bash
alembic upgrade head
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run using the Next.js development server.

---

## Environment Variables

Create:

```text
backend/.env
frontend/.env.local
```

Configure the required PostgreSQL, Redis, and Microsoft Entra External ID values.

**Never commit environment files, credentials, API keys, client secrets, or other sensitive configuration to GitHub.**

---

## Security & Privacy

SkillSwap is designed with backend-enforced security and privacy controls.

- Microsoft Entra External ID authentication
- OAuth/OIDC token validation
- Backend authorization
- Rate limiting
- Protected WebSocket connections
- User blocking
- User reporting
- Profile visibility controls
- Contact information privacy
- Secure environment configuration
- Input validation

---

## Deployment

The application is designed for production deployment with:

- **Vercel** for the Next.js frontend
- **Cloud-hosted FastAPI backend**
- **Managed PostgreSQL**
- **Managed Redis**
- **Microsoft Entra External ID** for authentication

Environment variables are configured separately for development and production environments.

---

## Project Status

SkillSwap is an actively developed full-stack application focused on building a complete peer-to-peer skill exchange experience, from discovering learning partners to completing sessions and tracking progress.

---

## License

This project is developed for educational, portfolio, and demonstration purposes.
