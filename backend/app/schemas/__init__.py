from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.models import (
    LearningMode, ExperienceLevel, PrivacyLevel, RequestStatus,
    SwapStatus, MessageType, SessionStatus, MilestoneStatus, ReportCategory
)


# -------------------------------------------------------------------------
# Auth & Token Schemas
# -------------------------------------------------------------------------

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8)
    confirm_password: str
    date_of_birth: Optional[str] = None
    phone_number: Optional[str] = None
    country: str = "United States"
    state: Optional[str] = None
    city: Optional[str] = None
    profession: str = Field(..., min_length=2, max_length=100)
    bio: Optional[str] = None
    accept_terms: bool = True

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()-_=+[]{}|;:,.<>?/" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class UserLogin(BaseModel):
    identifier: str  # email or username
    password: str
    remember_me: bool = False


class UserVerifyEmail(BaseModel):
    token: str


class ResendVerification(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# -------------------------------------------------------------------------
# Skill Schemas
# -------------------------------------------------------------------------

class SkillCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = "Sparkles"


class SkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    category_id: str
    name: str
    description: Optional[str] = None
    category_name: Optional[str] = None


class UserSkillCreate(BaseModel):
    skill_name: str
    category_name: Optional[str] = "General"
    skill_type: str = Field(..., pattern=r"^(TEACH|LEARN)$")
    experience_level: Optional[ExperienceLevel] = None  # for TEACH
    current_level: Optional[ExperienceLevel] = None     # for LEARN
    target_level: Optional[ExperienceLevel] = None      # for LEARN
    description: Optional[str] = None


class UserSkillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    skill_id: str
    skill_name: str
    category_name: Optional[str] = None
    skill_type: str
    experience_level: Optional[ExperienceLevel] = None
    current_level: Optional[ExperienceLevel] = None
    target_level: Optional[ExperienceLevel] = None
    description: Optional[str] = None


# -------------------------------------------------------------------------
# Profile & User Schemas
# -------------------------------------------------------------------------

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    profession: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    languages: Optional[List[str]] = None
    availability: Optional[List[str]] = None
    preferred_learning_mode: Optional[LearningMode] = None
    email_privacy: Optional[PrivacyLevel] = None
    phone_privacy: Optional[PrivacyLevel] = None


class ProfilePublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    username: Optional[str] = None
    full_name: str
    profession: str
    country: str
    state: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    languages: List[str] = []
    availability: List[str] = []
    preferred_learning_mode: LearningMode
    skills_teach: List[UserSkillResponse] = []
    skills_learn: List[UserSkillResponse] = []
    match_score: Optional[int] = None
    match_explanation: Optional[str] = None
    rating_average: Optional[float] = 5.0
    reviews_count: Optional[int] = 0


class ProfileDetailResponse(ProfilePublicResponse):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    email_privacy: PrivacyLevel = PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE
    phone_privacy: PrivacyLevel = PrivacyLevel.HIDDEN
    date_of_birth: Optional[str] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    username: str
    is_active: bool
    is_verified: bool
    role: str
    created_at: datetime
    profile: Optional[ProfileDetailResponse] = None


# -------------------------------------------------------------------------
# Search & Match Schemas
# -------------------------------------------------------------------------

class SearchFilter(BaseModel):
    q: Optional[str] = None
    skill: Optional[str] = None
    category: Optional[str] = None
    profession: Optional[str] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    experience_level: Optional[ExperienceLevel] = None
    learning_mode: Optional[LearningMode] = None
    availability: Optional[str] = None
    sort_by: str = "best_match"  # best_match, most_relevant, most_experienced, newest
    page: int = 1
    page_size: int = 12


class MatchResponse(BaseModel):
    user: ProfilePublicResponse
    match_score: int
    teach_matches: List[str]  # skills current user teaches that target wants
    learn_matches: List[str]  # skills target teaches that current user wants
    explanation: str


# -------------------------------------------------------------------------
# Swap Request Schemas
# -------------------------------------------------------------------------

class SwapRequestCreate(BaseModel):
    receiver_id: str
    offered_skill_id: str
    requested_skill_id: str
    message: Optional[str] = None


class SwapRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sender_id: str
    sender_username: str
    sender_name: str
    sender_avatar: Optional[str] = None
    receiver_id: str
    receiver_username: str
    receiver_name: str
    receiver_avatar: Optional[str] = None
    offered_skill_id: str
    offered_skill_name: str
    requested_skill_id: str
    requested_skill_name: str
    message: Optional[str] = None
    status: RequestStatus
    created_at: datetime
    updated_at: datetime



# -------------------------------------------------------------------------
# Skill Swap Schemas
# -------------------------------------------------------------------------

class SkillSwapResponse(BaseModel):
    id: str
    request_id: Optional[str] = None
    partner_id: str
    partner_username: str
    partner_name: str
    partner_avatar: Optional[str] = None
    partner_profession: str
    i_teach_skill: str
    i_learn_skill: str
    status: SwapStatus
    conversation_id: Optional[str] = None
    started_at: datetime
    progress_percentage: int = 0
    completed_sessions: int = 0
    total_sessions: int = 10


# -------------------------------------------------------------------------
# Chat & Messages Schemas
# -------------------------------------------------------------------------

class MessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    file_url: Optional[str] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    conversation_id: str
    sender_id: str
    sender_name: str
    sender_avatar: Optional[str] = None
    content: str
    message_type: MessageType
    file_url: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    swap_id: Optional[str] = None
    partner_id: str
    partner_username: str
    partner_name: str
    partner_avatar: Optional[str] = None
    partner_profession: str
    is_online: bool = False
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0
    i_teach: Optional[str] = None
    they_teach: Optional[str] = None


class ChatPartnerProfileResponse(BaseModel):
    partner_id: str
    partner_username: str
    partner_name: str
    partner_avatar: Optional[str] = None
    partner_profession: str
    partner_email: Optional[str] = None
    partner_phone: Optional[str] = None
    i_can_teach: str
    i_want_to_learn: str
    they_can_teach: str
    they_want_to_learn: str
    current_progress: int
    completed_sessions: int
    total_sessions: int
    upcoming_session: Optional[dict] = None
    learning_goals: List[dict] = []


# -------------------------------------------------------------------------
# Learning Progress & Milestones Schemas
# -------------------------------------------------------------------------

class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: MilestoneStatus = MilestoneStatus.UPCOMING
    order: int = 0


class MilestoneResponse(BaseModel):
    id: str
    progress_id: str
    title: str
    description: Optional[str] = None
    status: MilestoneStatus
    order: int

    class Config:
        from_attributes = True


class LearningProgressResponse(BaseModel):
    id: str
    swap_id: str
    user_id: str
    skill_id: str
    skill_name: str
    current_level: Optional[str]
    target_level: Optional[str]
    progress_percentage: int
    total_sessions: int
    completed_sessions: int
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True


class LearningProgressUpdate(BaseModel):
    current_level: Optional[str] = None
    target_level: Optional[str] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    total_sessions: Optional[int] = None
    completed_sessions: Optional[int] = None


# -------------------------------------------------------------------------
# Sessions Schemas
# -------------------------------------------------------------------------

class SessionCreate(BaseModel):
    swap_id: str
    skill_id: str
    title: str
    date_time: datetime
    duration_minutes: int = 60
    notes: Optional[str] = None
    meeting_link: Optional[str] = None


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    date_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    status: Optional[SessionStatus] = None


class SessionResponse(BaseModel):
    id: str
    swap_id: str
    scheduled_by_id: str
    scheduled_by_name: str
    skill_id: str
    skill_name: str
    title: str
    date_time: datetime
    duration_minutes: int
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    status: SessionStatus
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------------------------------------------------------
# Reviews Schemas
# -------------------------------------------------------------------------

class ReviewCreate(BaseModel):
    swap_id: str
    reviewee_id: str
    communication_rating: int = Field(..., ge=1, le=5)
    teaching_rating: int = Field(..., ge=1, le=5)
    helpfulness_rating: int = Field(..., ge=1, le=5)
    overall_rating: float = Field(..., ge=1.0, le=5.0)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    swap_id: str
    reviewer_id: str
    reviewer_name: str
    reviewer_avatar: Optional[str] = None
    reviewee_id: str
    communication_rating: int
    teaching_rating: int
    helpfulness_rating: int
    overall_rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------------------------------------------------------
# Notifications Schemas
# -------------------------------------------------------------------------

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# -------------------------------------------------------------------------
# Safety & Reports Schemas
# -------------------------------------------------------------------------

class BlockCreate(BaseModel):
    blocked_id: str


class BlockResponse(BaseModel):
    id: str
    blocked_id: str
    blocked_username: str
    created_at: datetime


class ReportCreate(BaseModel):
    reported_id: str
    category: ReportCategory
    description: str


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reported_id: str
    category: ReportCategory
    description: str
    status: str
    created_at: datetime


class MessageSuccessResponse(BaseModel):
    message: str
    success: bool = True
