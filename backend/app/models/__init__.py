import enum
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    String, Boolean, Integer, Text, ForeignKey, DateTime, Enum as SAEnum,
    JSON, Float, Index, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class LearningMode(str, enum.Enum):
    ONLINE = "Online"
    IN_PERSON = "In Person"
    EITHER = "Either"


class ExperienceLevel(str, enum.Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"
    PROFESSIONAL = "Professional"


class PrivacyLevel(str, enum.Enum):
    HIDDEN = "Hidden"
    VISIBLE_AFTER_ACCEPTANCE = "Visible After Request Acceptance"
    VISIBLE_WITH_PERMISSION = "Visible With Permission"


class RequestStatus(str, enum.Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DECLINED = "Declined"
    CANCELLED = "Cancelled"


class SwapStatus(str, enum.Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class MessageType(str, enum.Enum):
    TEXT = "text"
    LINK = "link"
    RESOURCE = "resource"
    FILE = "file"
    IMAGE = "image"


class SessionStatus(str, enum.Enum):
    UPCOMING = "Upcoming"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class MilestoneStatus(str, enum.Enum):
    COMPLETED = "Completed"
    IN_PROGRESS = "In Progress"
    UPCOMING = "Upcoming"


class ReportCategory(str, enum.Enum):
    INAPPROPRIATE_BEHAVIOR = "Inappropriate Behavior"
    SPAM_OR_SCAM = "Spam or Scam"
    HARASSMENT = "Harassment"
    NO_SHOW = "Repeated No-Show"
    INACCURATE_SKILL_REPRESENTATION = "Inaccurate Skill Representation"
    OTHER = "Other"


# -------------------------------------------------------------------------
# Models
# -------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reset_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="user")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    profile: Mapped["Profile"] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    skills: Mapped[List["UserSkill"]] = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # YYYY-MM-DD (private)
    phone_number: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="United States", index=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    profession: Mapped[str] = mapped_column(String(100), index=True, default="Professional")
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    languages: Mapped[Optional[list]] = mapped_column(JSON, default=lambda: ["English"])
    availability: Mapped[Optional[list]] = mapped_column(JSON, default=lambda: ["Weekdays", "Evenings"])
    preferred_learning_mode: Mapped[LearningMode] = mapped_column(
        SAEnum(LearningMode), default=LearningMode.ONLINE
    )
    email_privacy: Mapped[PrivacyLevel] = mapped_column(
        SAEnum(PrivacyLevel), default=PrivacyLevel.VISIBLE_AFTER_ACCEPTANCE
    )
    phone_privacy: Mapped[PrivacyLevel] = mapped_column(
        SAEnum(PrivacyLevel), default=PrivacyLevel.HIDDEN
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="profile")


class SkillCategory(Base):
    __tablename__ = "skill_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), default="Sparkles")

    skills: Mapped[List["Skill"]] = relationship("Skill", back_populates="category", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("skill_categories.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    category: Mapped["SkillCategory"] = relationship("SkillCategory", back_populates="skills")
    user_skills: Mapped[List["UserSkill"]] = relationship("UserSkill", back_populates="skill")

    __table_args__ = (
        UniqueConstraint("category_id", "name", name="uq_skill_category_name"),
    )


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    skill_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # TEACH or LEARN
    experience_level: Mapped[Optional[ExperienceLevel]] = mapped_column(SAEnum(ExperienceLevel), nullable=True) # for TEACH
    current_level: Mapped[Optional[ExperienceLevel]] = mapped_column(SAEnum(ExperienceLevel), nullable=True) # for LEARN
    target_level: Mapped[Optional[ExperienceLevel]] = mapped_column(SAEnum(ExperienceLevel), nullable=True) # for LEARN
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_skills")


class SkillSwapRequest(Base):
    __tablename__ = "skill_swap_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    receiver_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    offered_skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    requested_skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), index=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[RequestStatus] = mapped_column(SAEnum(RequestStatus), default=RequestStatus.PENDING, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])
    receiver: Mapped["User"] = relationship("User", foreign_keys=[receiver_id])
    offered_skill: Mapped["Skill"] = relationship("Skill", foreign_keys=[offered_skill_id])
    requested_skill: Mapped["Skill"] = relationship("Skill", foreign_keys=[requested_skill_id])


class SkillSwap(Base):
    __tablename__ = "skill_swaps"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("skill_swap_requests.id", ondelete="SET NULL"), nullable=True)
    user_a_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user_b_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    skill_a_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE")) # taught by user_a
    skill_b_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE")) # taught by user_b
    status: Mapped[SwapStatus] = mapped_column(SAEnum(SwapStatus), default=SwapStatus.ACTIVE, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user_a: Mapped["User"] = relationship("User", foreign_keys=[user_a_id])
    user_b: Mapped["User"] = relationship("User", foreign_keys=[user_b_id])
    skill_a: Mapped["Skill"] = relationship("Skill", foreign_keys=[skill_a_id])
    skill_b: Mapped["Skill"] = relationship("Skill", foreign_keys=[skill_b_id])
    conversation: Mapped[Optional["Conversation"]] = relationship("Conversation", back_populates="swap", uselist=False)
    sessions: Mapped[List["LearningSession"]] = relationship("LearningSession", back_populates="swap", cascade="all, delete-orphan")
    progress_records: Mapped[List["LearningProgress"]] = relationship("LearningProgress", back_populates="swap", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    swap_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("skill_swaps.id", ondelete="CASCADE"), unique=True, nullable=True)
    user_a_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    user_b_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    swap: Mapped[Optional["SkillSwap"]] = relationship("SkillSwap", back_populates="conversation")
    user_a: Mapped["User"] = relationship("User", foreign_keys=[user_a_id])
    user_b: Mapped["User"] = relationship("User", foreign_keys=[user_b_id])
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[MessageType] = mapped_column(SAEnum(MessageType), default=MessageType.TEXT)
    file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
    sender: Mapped["User"] = relationship("User")


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    swap_id: Mapped[str] = mapped_column(String(36), ForeignKey("skill_swaps.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True) # the learner
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"))
    current_level: Mapped[Optional[str]] = mapped_column(String(50), default="Beginner")
    target_level: Mapped[Optional[str]] = mapped_column(String(50), default="Intermediate")
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0)
    total_sessions: Mapped[int] = mapped_column(Integer, default=10)
    completed_sessions: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    swap: Mapped["SkillSwap"] = relationship("SkillSwap", back_populates="progress_records")
    user: Mapped["User"] = relationship("User")
    skill: Mapped["Skill"] = relationship("Skill")
    milestones: Mapped[List["ProgressMilestone"]] = relationship("ProgressMilestone", back_populates="progress", cascade="all, delete-orphan", order_by="ProgressMilestone.order")


class ProgressMilestone(Base):
    __tablename__ = "progress_milestones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    progress_id: Mapped[str] = mapped_column(String(36), ForeignKey("learning_progress.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[MilestoneStatus] = mapped_column(SAEnum(MilestoneStatus), default=MilestoneStatus.UPCOMING)
    order: Mapped[int] = mapped_column(Integer, default=0)

    progress: Mapped["LearningProgress"] = relationship("LearningProgress", back_populates="milestones")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    swap_id: Mapped[str] = mapped_column(String(36), ForeignKey("skill_swaps.id", ondelete="CASCADE"), index=True)
    scheduled_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[str] = mapped_column(String(36), ForeignKey("skills.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[SessionStatus] = mapped_column(SAEnum(SessionStatus), default=SessionStatus.UPCOMING, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    swap: Mapped["SkillSwap"] = relationship("SkillSwap", back_populates="sessions")
    scheduled_by: Mapped["User"] = relationship("User")
    skill: Mapped["Skill"] = relationship("Skill")


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    swap_id: Mapped[str] = mapped_column(String(36), ForeignKey("skill_swaps.id", ondelete="CASCADE"), index=True)
    reviewer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    reviewee_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    communication_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    teaching_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    helpfulness_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    overall_rating: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id])
    reviewee: Mapped["User"] = relationship("User", foreign_keys=[reviewee_id])
    swap: Mapped["SkillSwap"] = relationship("SkillSwap")


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)

    user: Mapped["User"] = relationship("User", back_populates="notifications")


class UserBlock(Base):
    __tablename__ = "user_blocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    blocker_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    blocked_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    blocker: Mapped["User"] = relationship("User", foreign_keys=[blocker_id])
    blocked: Mapped["User"] = relationship("User", foreign_keys=[blocked_id])

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_id", name="uq_blocker_blocked"),
    )


class UserReport(Base):
    __tablename__ = "user_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    reported_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[ReportCategory] = mapped_column(SAEnum(ReportCategory), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="Pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id])
    reported: Mapped["User"] = relationship("User", foreign_keys=[reported_id])


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ip_address: Mapped[str] = mapped_column(String(50), index=True)
    identifier: Mapped[str] = mapped_column(String(255), index=True) # email or username
    successful: Mapped[bool] = mapped_column(Boolean, default=False)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
