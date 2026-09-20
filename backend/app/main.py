import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.database import init_db

# Import all routers
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.profiles import router as profiles_router
from app.api.routes.skills import router as skills_router
from app.api.routes.search import router as search_router
from app.api.routes.matches import router as matches_router
from app.api.routes.requests import router as requests_router
from app.api.routes.swaps import router as swaps_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.messages import router as messages_router
from app.api.routes.progress import router as progress_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.reviews import router as reviews_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.settings import router as settings_router
from app.api.routes.reports import router as reports_router
from app.websocket.chat_socket import ws_router


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables on startup
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SkillSwap - Secure Peer-to-Peer Skill Exchange Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount for serving static attachments
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount API Routers
api_v1 = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1)
app.include_router(users_router, prefix=api_v1)
app.include_router(profiles_router, prefix=api_v1)
app.include_router(skills_router, prefix=api_v1)
app.include_router(search_router, prefix=api_v1)
app.include_router(matches_router, prefix=api_v1)
app.include_router(requests_router, prefix=api_v1)
app.include_router(swaps_router, prefix=api_v1)
app.include_router(conversations_router, prefix=api_v1)
app.include_router(messages_router, prefix=api_v1)
app.include_router(progress_router, prefix=api_v1)
app.include_router(sessions_router, prefix=api_v1)
app.include_router(reviews_router, prefix=api_v1)
app.include_router(notifications_router, prefix=api_v1)
app.include_router(settings_router, prefix=api_v1)
app.include_router(reports_router, prefix=api_v1)

# Mount WebSocket router
app.include_router(ws_router)


@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT
    }
