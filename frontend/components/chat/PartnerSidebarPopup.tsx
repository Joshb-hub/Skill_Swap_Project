"use client";

import React, { useEffect, useState } from "react";
import { ChatPartnerProfile } from "@/types";
import { chatService } from "@/services";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  X, Mail, Phone, Calendar, Target, TrendingUp,
  ShieldCheck, ArrowRightLeft, CheckCircle2, Circle
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface PartnerSidebarPopupProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PartnerSidebarPopup({ conversationId, isOpen, onClose }: PartnerSidebarPopupProps) {
  const [profile, setProfile] = useState<ChatPartnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      chatService
        .getPartnerProfile(conversationId)
        .then((data) => setProfile(data))
        .catch(() => setProfile(null))
        .finally(() => setIsLoading(false));
    }
  }, [conversationId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            Skill Exchange Overview
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading exchange details...</div>
        ) : !profile ? (
          <div className="p-8 text-center text-slate-400 text-sm">Exchange details unavailable.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Partner Avatar & Info */}
            <div className="flex items-center space-x-4">
              <Avatar
                src={profile.partner_avatar}
                name={profile.partner_name}
                size="xl"
              />
              <div>
                <h4 className="font-bold text-lg text-slate-900">{profile.partner_name}</h4>
                <p className="text-xs text-slate-500">{profile.partner_profession}</p>
                <span className="text-xs text-indigo-600 font-medium">@{profile.partner_username}</span>
              </div>
            </div>

            {/* Privacy-Enforced Contact Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Shared Contact Info</span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Privacy Protected
                </span>
              </div>

              {profile.partner_email ? (
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{profile.partner_email}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Email hidden by partner privacy settings
                </div>
              )}

              {profile.partner_phone ? (
                <div className="flex items-center space-x-2 text-xs text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{profile.partner_phone}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Phone number hidden by partner privacy settings
                </div>
              )}
            </div>

            {/* The Exchange Pair */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Skills in this Active Swap
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">You Teach</span>
                  <p className="font-bold text-sm text-indigo-950">{profile.i_can_teach}</p>
                </div>
                <div className="p-3.5 bg-violet-50/70 border border-violet-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-violet-600 uppercase">You Learn</span>
                  <p className="font-bold text-sm text-violet-950">{profile.i_want_to_learn}</p>
                </div>
              </div>
            </div>

            {/* Current Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Learning Progress
                </span>
                <span className="font-bold text-indigo-600">{profile.current_progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(profile.current_progress, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Completed {profile.completed_sessions} of {profile.total_sessions} planned sessions
              </p>
            </div>

            {/* Upcoming Session */}
            {profile.upcoming_session && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-2">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Next Scheduled Session
                </span>
                <p className="text-sm font-semibold text-slate-900">{profile.upcoming_session.title}</p>
                <p className="text-xs text-slate-600">{formatDateTime(profile.upcoming_session.date_time)}</p>
                {profile.upcoming_session.meeting_link && (
                  <a
                    href={profile.upcoming_session.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Join Virtual Room →
                  </a>
                )}
              </div>
            )}

            {/* Learning Goals */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-slate-400" /> Milestone Goals
              </h5>
              <div className="space-y-2">
                {profile.learning_goals.map((g, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    {g.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                    )}
                    <span className={g.done ? "line-through text-slate-400" : "text-slate-700"}>
                      {g.goal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
