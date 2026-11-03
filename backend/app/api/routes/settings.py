from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash
from app.models import User, Profile, PrivacyLevel, RefreshToken
from app.schemas import MessageSuccessResponse
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings & Privacy"])


DEFAULT_NOTIFICATION_PREFERENCES: Dict[str, bool] = {
    "request_updates": True,
    "messages": True,
    "session_updates": True,
    "reviews": True,
    "platform_updates": True,
}


class PrivacySettingsUpdate(BaseModel):
    email_privacy: PrivacyLevel
    phone_privacy: PrivacyLevel


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class SecuritySettingsResponse(BaseModel):
    two_factor_enabled: bool = False
    login_alerts_enabled: bool = True


class SecuritySettingsUpdate(BaseModel):
    two_factor_enabled: Optional[bool] = None
    login_alerts_enabled: Optional[bool] = None


class NotificationPreferencesResponse(BaseModel):
    request_updates: bool = True
    messages: bool = True
    session_updates: bool = True
    reviews: bool = True
    platform_updates: bool = True


class NotificationPreferencesUpdate(BaseModel):
    request_updates: Optional[bool] = None
    messages: Optional[bool] = None
    session_updates: Optional[bool] = None
    reviews: Optional[bool] = None
    platform_updates: Optional[bool] = None


class ActiveSessionResponse(BaseModel):
    id: str
    user_id: str
    created_at: Optional[str] = None
    expires_at: Optional[str] = None
    revoked: bool = False


def normalize_notification_preferences(value: Any) -> Dict[str, bool]:
    prefs = dict(DEFAULT_NOTIFICATION_PREFERENCES)
    if isinstance(value, dict):
        for key, default_value in DEFAULT_NOTIFICATION_PREFERENCES.items():
            if key in value:
                prefs[key] = bool(value[key])
            elif key.replace("_", "") in value:
                prefs[key] = bool(value[key.replace("_", "")])
    return prefs


@router.get("/privacy", response_model=PrivacySettingsUpdate)
async def get_privacy_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(Profile, current_user.profile.id if current_user.profile else "")
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return PrivacySettingsUpdate(
        email_privacy=profile.email_privacy,
        phone_privacy=profile.phone_privacy
    )


@router.put("/privacy", response_model=MessageSuccessResponse)
async def update_privacy_settings(
    settings_in: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.email_privacy = settings_in.email_privacy
    profile.phone_privacy = settings_in.phone_privacy
    await db.commit()

    return MessageSuccessResponse(message="Privacy settings updated successfully")


@router.get("/security", response_model=SecuritySettingsResponse)
async def get_security_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    del db
    return SecuritySettingsResponse(
        two_factor_enabled=bool(current_user.two_factor_enabled),
        login_alerts_enabled=bool(current_user.login_alerts_enabled),
    )


@router.put("/security", response_model=SecuritySettingsResponse)
async def update_security_settings(
    payload: SecuritySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.two_factor_enabled is not None:
        current_user.two_factor_enabled = payload.two_factor_enabled
    if payload.login_alerts_enabled is not None:
        current_user.login_alerts_enabled = payload.login_alerts_enabled
    await db.commit()
    return SecuritySettingsResponse(
        two_factor_enabled=bool(current_user.two_factor_enabled),
        login_alerts_enabled=bool(current_user.login_alerts_enabled),
    )


@router.get("/notifications/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    del db
    prefs = normalize_notification_preferences(current_user.notification_preferences)
    return NotificationPreferencesResponse(**prefs)


@router.put("/notifications/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prefs = normalize_notification_preferences(current_user.notification_preferences)
    for field, value in payload.model_dump(exclude_none=True).items():
        if field in prefs:
            prefs[field] = bool(value)
    current_user.notification_preferences = prefs
    await db.commit()
    return NotificationPreferencesResponse(**prefs)


@router.get("/sessions", response_model=List[ActiveSessionResponse])
async def list_active_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RefreshToken).where(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked.is_(False),
    ).order_by(RefreshToken.created_at.desc())
    tokens = (await db.execute(stmt)).scalars().all()

    return [
        ActiveSessionResponse(
            id=token.id,
            user_id=token.user_id,
            created_at=token.created_at.isoformat() if token.created_at else None,
            expires_at=token.expires_at.isoformat() if token.expires_at else None,
            revoked=bool(token.revoked),
        )
        for token in tokens
    ]


@router.delete("/sessions/{session_id}", response_model=MessageSuccessResponse)
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(RefreshToken).where(RefreshToken.id == session_id, RefreshToken.user_id == current_user.id)
    token = (await db.execute(stmt)).scalar_one_or_none()
    if not token:
        raise HTTPException(status_code=404, detail="Session not found")

    token.revoked = True
    await db.commit()
    return MessageSuccessResponse(message="Session revoked successfully")


@router.post("/change-password", response_model=MessageSuccessResponse)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = get_password_hash(payload.new_password)
    await db.commit()
    return MessageSuccessResponse(message="Password changed successfully")
