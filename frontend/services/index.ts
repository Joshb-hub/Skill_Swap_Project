import { apiClient } from "./apiClient";
import {
  User, Profile, SkillCategory, Skill, UserSkill,
  MatchResult, SwapRequest, SkillSwap, Conversation,
  Message, ChatPartnerProfile, LearningProgress,
  Milestone, LearningSession, Review, Notification
} from "@/types";

export const authService = {
  async register(data: any): Promise<User> {
    return apiClient.post<User>("/auth/register", data);
  },
  async login(data: { identifier: string; password: string; remember_me?: boolean }): Promise<{ access_token: string; refresh_token: string }> {
    const res = await apiClient.post<{ access_token: string; refresh_token: string }>("/auth/login", data);
    apiClient.setTokens(res.access_token, res.refresh_token);
    return res;
  },
  async getMe(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  },
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      apiClient.clearTokens();
    }
  },
  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient.post("/auth/verify-email", { token });
  },
  async resendVerification(email: string): Promise<{ message: string }> {
    return apiClient.post("/auth/resend-verification", { email });
  },
  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post("/auth/forgot-password", { email });
  },
  async resetPassword(token: string, new_password: string): Promise<{ message: string }> {
    return apiClient.post("/auth/reset-password", { token, new_password });
  },
};

export const profileService = {
  async getProfile(username: string): Promise<Profile> {
    return apiClient.get<Profile>(`/profiles/${username}`);
  },
  async updateMyProfile(data: Partial<Profile>): Promise<Profile> {
    return apiClient.put<Profile>("/profiles/me", data);
  },
};

export const skillService = {
  async getCategories(): Promise<SkillCategory[]> {
    return apiClient.get<SkillCategory[]>("/skills/categories");
  },
  async searchSkills(q?: string, category_id?: string): Promise<Skill[]> {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (category_id) params.append("category_id", category_id);
    return apiClient.get<Skill[]>(`/skills?${params.toString()}`);
  },
  async addUserSkill(data: {
    skill_name: string;
    category_name?: string;
    skill_type: "TEACH" | "LEARN";
    experience_level?: string;
    current_level?: string;
    target_level?: string;
    description?: string;
  }): Promise<UserSkill> {
    return apiClient.post<UserSkill>("/skills/user-skills", data);
  },
  async removeUserSkill(user_skill_id: string): Promise<void> {
    return apiClient.delete(`/skills/user-skills/${user_skill_id}`);
  },
};

export const searchService = {
  async searchProfiles(params: Record<string, string>): Promise<Profile[]> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
    return apiClient.get<Profile[]>(`/search?${searchParams.toString()}`);
  },
};

export const matchService = {
  async getMatches(limit = 20): Promise<MatchResult[]> {
    return apiClient.get<MatchResult[]>(`/matches?limit=${limit}`);
  },
};

export const swapService = {
  async sendRequest(data: {
    receiver_id: string;
    offered_skill_id: string;
    requested_skill_id: string;
    message?: string;
  }): Promise<SwapRequest> {
    return apiClient.post<SwapRequest>("/requests", data);
  },
  async getReceivedRequests(): Promise<SwapRequest[]> {
    return apiClient.get<SwapRequest[]>("/requests/received");
  },
  async getSentRequests(): Promise<SwapRequest[]> {
    return apiClient.get<SwapRequest[]>("/requests/sent");
  },
  async acceptRequest(requestId: string): Promise<void> {
    return apiClient.post(`/requests/${requestId}/accept`);
  },
  async declineRequest(requestId: string): Promise<void> {
    return apiClient.post(`/requests/${requestId}/decline`);
  },
  async cancelRequest(requestId: string): Promise<void> {
    return apiClient.post(`/requests/${requestId}/cancel`);
  },
  async getMySwaps(): Promise<SkillSwap[]> {
    return apiClient.get<SkillSwap[]>("/swaps");
  },
  async completeSwap(swapId: string): Promise<void> {
    return apiClient.post(`/swaps/${swapId}/complete`);
  },
};

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/conversations");
  },
  async getPartnerProfile(conversationId: string): Promise<ChatPartnerProfile> {
    return apiClient.get<ChatPartnerProfile>(`/conversations/${conversationId}/partner-profile`);
  },
  async markRead(conversationId: string): Promise<void> {
    return apiClient.post(`/conversations/${conversationId}/read`);
  },
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    return apiClient.get<Message[]>(`/messages/${conversationId}?limit=${limit}&offset=${offset}`);
  },
  async uploadAttachment(conversationId: string, file: File): Promise<Message> {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<Message>(`/messages/${conversationId}/attachment`, formData);
  },
};

export const progressService = {
  async getSwapProgress(swapId: string): Promise<LearningProgress[]> {
    return apiClient.get<LearningProgress[]>(`/progress/swap/${swapId}`);
  },
  async updateProgress(progressId: string, data: Partial<LearningProgress>): Promise<LearningProgress> {
    return apiClient.put<LearningProgress>(`/progress/${progressId}`, data);
  },
  async addMilestone(progressId: string, data: { title: string; description?: string; order?: number }): Promise<Milestone> {
    return apiClient.post<Milestone>(`/progress/${progressId}/milestones`, data);
  },
  async toggleMilestone(milestoneId: string): Promise<Milestone> {
    return apiClient.patch<Milestone>(`/progress/milestones/${milestoneId}/toggle`);
  },
};

export const sessionService = {
  async getSessions(swapId?: string, statusFilter?: string): Promise<LearningSession[]> {
    const params = new URLSearchParams();
    if (swapId) params.append("swap_id", swapId);
    if (statusFilter) params.append("status_filter", statusFilter);
    return apiClient.get<LearningSession[]>(`/sessions?${params.toString()}`);
  },
  async scheduleSession(data: {
    swap_id: string;
    skill_id: string;
    title: string;
    date_time: string;
    duration_minutes: number;
    notes?: string;
    meeting_link?: string;
  }): Promise<LearningSession> {
    return apiClient.post<LearningSession>("/sessions", data);
  },
  async updateSession(sessionId: string, data: Partial<LearningSession>): Promise<void> {
    return apiClient.put(`/sessions/${sessionId}`, data);
  },
};

export const reviewService = {
  async submitReview(data: {
    swap_id: string;
    reviewee_id: string;
    communication_rating: number;
    teaching_rating: number;
    helpfulness_rating: number;
    overall_rating: number;
    comment?: string;
  }): Promise<Review> {
    return apiClient.post<Review>("/reviews", data);
  },
  async getUserReviews(userId: string): Promise<Review[]> {
    return apiClient.get<Review[]>(`/reviews/user/${userId}`);
  },
};

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    return apiClient.get<Notification[]>("/notifications");
  },
  async markRead(id: string): Promise<void> {
    return apiClient.post(`/notifications/${id}/read`);
  },
  async markAllRead(): Promise<void> {
    return apiClient.post("/notifications/read-all");
  },
};

export const safetyService = {
  async blockUser(blockedId: string): Promise<void> {
    return apiClient.post("/reports/block", { blocked_id: blockedId });
  },
  async unblockUser(blockedId: string): Promise<void> {
    return apiClient.delete(`/reports/block/${blockedId}`);
  },
  async listBlocked(): Promise<Array<{ id: string; blocked_id: string; blocked_username: string }>> {
    return apiClient.get("/reports/blocked");
  },
  async submitReport(data: { reported_id: string; category: string; description: string }): Promise<void> {
    return apiClient.post("/reports", data);
  },
  async getPrivacySettings(): Promise<{ email_privacy: string; phone_privacy: string }> {
    return apiClient.get("/settings/privacy");
  },
  async updatePrivacySettings(data: { email_privacy: string; phone_privacy: string }): Promise<void> {
    return apiClient.put("/settings/privacy", data);
  },
};
