from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash
from app.models import User, Profile, PrivacyLevel
from app.schemas import MessageSuccessResponse
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings & Privacy"])


class PrivacySettingsUpdate(BaseModel):
    email_privacy: PrivacyLevel
    phone_privacy: PrivacyLevel


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


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
