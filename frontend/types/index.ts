export type LearningMode = "Online" | "In Person" | "Either";
export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced" | "Professional";
export type PrivacyLevel = "Hidden" | "Visible After Request Acceptance" | "Visible With Permission";
export type RequestStatus = "Pending" | "Accepted" | "Declined" | "Cancelled";
export type SwapStatus = "Active" | "Completed" | "Cancelled";
export type MessageType = "text" | "link" | "resource" | "file" | "image";
export type SessionStatus = "Upcoming" | "Completed" | "Cancelled";
export type MilestoneStatus = "Completed" | "In Progress" | "Upcoming";

export interface UserSkill {
  id: string;
  skill_id: string;
  skill_name: string;
  category_name?: string;
  skill_type: "TEACH" | "LEARN";
  experience_level?: ExperienceLevel;
  current_level?: ExperienceLevel;
  target_level?: ExperienceLevel;
  description?: string;
}

export interface Profile {
  user_id: string;
  username: string;
  full_name: string;
  profession: string;
  country: string;
  state?: string;
  city?: string;
  bio?: string;
  avatar_url?: string;
  languages: string[];
  availability: string[];
  preferred_learning_mode: LearningMode;
  skills_teach: UserSkill[];
  skills_learn: UserSkill[];
  match_score?: number;
  match_explanation?: string;
  rating_average?: number;
  reviews_count?: number;
  email?: string | null;
  phone_number?: string | null;
  email_privacy?: PrivacyLevel;
  phone_privacy?: PrivacyLevel;
  date_of_birth?: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  is_verified: boolean;
  role: string;
  created_at: string;
  profile?: Profile;
}

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  category_name?: string;
}

export interface MatchResult {
  user: Profile;
  match_score: number;
  teach_matches: string[];
  learn_matches: string[];
  explanation: string;
}

export interface SwapRequest {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_name: string;
  sender_avatar?: string;
  receiver_id: string;
  receiver_username: string;
  receiver_name: string;
  receiver_avatar?: string;
  offered_skill_id: string;
  offered_skill_name: string;
  requested_skill_id: string;
  requested_skill_name: string;
  message?: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface SkillSwap {
  id: string;
  request_id?: string;
  partner_id: string;
  partner_username: string;
  partner_name: string;
  partner_avatar?: string;
  partner_profession: string;
  i_teach_skill: string;
  i_learn_skill: string;
  status: SwapStatus;
  conversation_id?: string;
  started_at: string;
  progress_percentage: number;
  completed_sessions: number;
  total_sessions: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  message_type: MessageType;
  file_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  swap_id?: string;
  partner_id: string;
  partner_username: string;
  partner_name: string;
  partner_avatar?: string;
  partner_profession: string;
  is_online: boolean;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  i_teach?: string;
  they_teach?: string;
}

export interface ChatPartnerProfile {
  partner_id: string;
  partner_username: string;
  partner_name: string;
  partner_avatar?: string;
  partner_profession: string;
  partner_email?: string | null;
  partner_phone?: string | null;
  i_can_teach: string;
  i_want_to_learn: string;
  they_can_teach: string;
  they_want_to_learn: string;
  current_progress: number;
  completed_sessions: number;
  total_sessions: number;
  upcoming_session?: {
    id: string;
    title: string;
    date_time: string;
    duration_minutes: number;
    meeting_link?: string;
  };
  learning_goals: Array<{
    goal: string;
    done: boolean;
  }>;
}

export interface Milestone {
  id: string;
  progress_id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  order: number;
}

export interface LearningProgress {
  id: string;
  swap_id: string;
  user_id: string;
  skill_id: string;
  skill_name: string;
  current_level?: string;
  target_level?: string;
  progress_percentage: number;
  total_sessions: number;
  completed_sessions: number;
  milestones: Milestone[];
}

export interface LearningSession {
  id: string;
  swap_id: string;
  scheduled_by_id: string;
  scheduled_by_name: string;
  skill_id: string;
  skill_name: string;
  title: string;
  date_time: string;
  duration_minutes: number;
  notes?: string;
  meeting_link?: string;
  status: SessionStatus;
  created_at: string;
}

export interface Review {
  id: string;
  swap_id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  reviewee_id: string;
  communication_rating: number;
  teaching_rating: number;
  helpfulness_rating: number;
  overall_rating: number;
  comment?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}
