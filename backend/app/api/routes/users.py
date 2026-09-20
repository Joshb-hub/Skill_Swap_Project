from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models import User
from app.schemas import UserResponse, MessageSuccessResponse
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_account(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", response_model=MessageSuccessResponse)
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    current_user.is_active = False
    await db.commit()
    return MessageSuccessResponse(message="Account has been deactivated successfully.")
