from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    get_password_hash, verify_password,
    create_access_token, create_refresh_token, decode_token,
    generate_verification_token, generate_reset_token
)
from app.core.rate_limiter import rate_limiter
from app.models import User, Profile, LoginAttempt, RefreshToken, PrivacyLevel, LearningMode
from app.schemas import (
    UserRegister, UserLogin, TokenResponse, UserResponse,
    UserVerifyEmail, ResendVerification, ForgotPasswordRequest,
    ResetPasswordRequest, MessageSuccessResponse
)
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # Check if username or email already exists
    existing_user_stmt = select(User).where(
        (User.email == user_in.email) | (User.username == user_in.username)
    )
    res = await db.execute(existing_user_stmt)
    existing = res.scalar_one_or_none()
    if existing:
        if existing.email == user_in.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail="Username already taken")

    # Generate verification token
    verification_token = generate_verification_token()

    new_user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=get_password_hash(user_in.password),
        is_verified=False,
        verification_token=verification_token,
        role="user",
    )
    db.add(new_user)
    await db.flush()

    # Create associated Profile
    new_profile = Profile(
        user_id=new_user.id,
        full_name=user_in.full_name,
        date_of_birth=user_in.date_of_birth,
        phone_number=user_in.phone_number,
        country=user_in.country,
        state=user_in.state,
        city=user_in.city,
        profession=user_in.profession,
        bio=user_in.bio,
        preferred_learning_mode=LearningMode.ONLINE,
        email_privacy=PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE,
        phone_privacy=PrivacyLevel.HIDDEN,
    )
    db.add(new_profile)
    await db.commit()

    # Re-fetch with profile loaded
    stmt = select(User).where(User.id == new_user.id).options(selectinload(User.profile))
    full_user = (await db.execute(stmt)).scalar_one()
    return full_user


@router.post("/verify-email", response_model=MessageSuccessResponse)
async def verify_email(payload: UserVerifyEmail, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.verification_token == payload.token)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    user.is_verified = True
    user.verification_token = None
    await db.commit()
    return MessageSuccessResponse(message="Email verified successfully! You can now log in.")


@router.post("/resend-verification", response_model=MessageSuccessResponse)
async def resend_verification(payload: ResendVerification, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    # Safe non-disclosing behavior
    if user and not user.is_verified:
        user.verification_token = generate_verification_token()
        await db.commit()
    return MessageSuccessResponse(message="If your account exists and is unverified, a new link has been generated.")


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    ip_address = request.client.host if request.client else "127.0.0.1"
    identifier = login_data.identifier.strip()

    # 1. Check rate limit / lockout
    is_locked, remaining_seconds = await rate_limiter.is_locked_out(identifier, ip_address)
    if is_locked:
        remaining_minutes = max(1, remaining_seconds // 60)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Access temporarily restricted. Try again in {remaining_minutes} minutes.",
            headers={"Retry-After": str(remaining_seconds)}
        )

    # 2. Look up user by email or username
    stmt = select(User).where(
        (User.email == identifier) | (User.username == identifier)
    ).options(selectinload(User.profile))
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    # 3. Check password
    if not user or not verify_password(login_data.password, user.hashed_password):
        # Record failed attempt and log
        attempts_count, newly_locked = await rate_limiter.record_failed_attempt(identifier, ip_address)
        attempt_record = LoginAttempt(
            ip_address=ip_address,
            identifier=identifier,
            successful=False
        )
        db.add(attempt_record)
        await db.commit()

        if newly_locked:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many failed login attempts. Account temporarily locked for {settings.LOGIN_LOCKOUT_DURATION_MINUTES} minutes."
            )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your username/email and password."
        )

    # 4. Check active status
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled. Please contact support.")

    # 5. Success! Reset rate limit failure state
    await rate_limiter.reset_failed_attempts(identifier, ip_address)
    attempt_record = LoginAttempt(
        ip_address=ip_address,
        identifier=identifier,
        successful=True
    )
    db.add(attempt_record)

    # 6. Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # Store refresh token record in DB for rotation & revocation
    rf_record = RefreshToken(
        user_id=user.id,
        token_hash=get_password_hash(refresh_token[:32]),  # store hash of prefix
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        revoked=False
    )
    db.add(rf_record)
    await db.commit()

    # Set secure HttpOnly cookie for refresh token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    token = request.cookies.get("refresh_token")
    if not token:
        # Fallback to authorization header or body if client passed it
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    # Issue new access and rotated refresh token
    new_access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=MessageSuccessResponse)
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Revoke refresh tokens for user
    stmt = select(RefreshToken).where(RefreshToken.user_id == current_user.id, RefreshToken.revoked == False)
    tokens = (await db.execute(stmt)).scalars().all()
    for t in tokens:
        t.revoked = True
    await db.commit()

    response.delete_cookie("refresh_token")
    return MessageSuccessResponse(message="Logged out successfully")


@router.post("/forgot-password", response_model=MessageSuccessResponse)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if user:
        user.reset_token = generate_reset_token()
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
    # Safe generic response avoiding user enumeration
    return MessageSuccessResponse(
        message="If this email is registered, you will receive password reset instructions."
    )


@router.post("/reset-password", response_model=MessageSuccessResponse)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    stmt = select(User).where(
        User.reset_token == payload.token,
        User.reset_token_expires_at > now
    )
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await db.commit()
    return MessageSuccessResponse(message="Password has been successfully reset. You can now log in.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
