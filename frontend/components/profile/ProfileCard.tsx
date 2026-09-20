"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Profile } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MapPin, Sparkles, ArrowRightLeft, CheckCircle2, BookOpen } from "lucide-react";
import { RequestModal } from "@/components/requests/RequestModal";
import { useAuth } from "@/hooks/useAuth";

interface ProfileCardProps {
  profile: Profile;
  onSwapSent?: () => void;
}

export function ProfileCard({ profile, onSwapSent }: ProfileCardProps) {
  const { user } = useAuth();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const isSelf = user?.id === profile.user_id;

  return (
    <>
      <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 flex flex-col justify-between">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name || profile.username}
                size="lg"
              />
              <div>
                <Link
                  href={`/profile/${profile.username}`}
                  className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  {profile.full_name}
                </Link>
                <p className="text-xs text-slate-500 font-medium">{profile.profession}</p>
                <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Match Score Badge */}
            {typeof profile.match_score === "number" && (
              <div
                className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-xs font-semibold shrink-0"
                title={profile.match_explanation || "High reciprocal skill compatibility"}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{profile.match_score}% Match</span>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Explanation if matching */}
          {profile.match_explanation && (
            <div className="mt-3 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-900 leading-snug">
              <span className="font-semibold text-indigo-700">Why matched: </span>
              {profile.match_explanation}
            </div>
          )}

          {/* Skills Breakdown */}
          <div className="mt-4 space-y-3">
            {/* Can Teach */}
            <div>
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <CheckCircle2 className="w-3 h-3" /> Can Teach
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills_teach.slice(0, 3).map((st) => (
                  <Badge key={st.id} variant="default" className="text-xs py-0.5 font-normal">
                    {st.skill_name}
                    {st.experience_level && (
                      <span className="ml-1 opacity-70 text-[10px]">({st.experience_level})</span>
                    )}
                  </Badge>
                ))}
                {profile.skills_teach.length > 3 && (
                  <span className="text-xs text-slate-400 self-center">
                    +{profile.skills_teach.length - 3} more
                  </span>
                )}
                {profile.skills_teach.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No teaching skills listed</span>
                )}
              </div>
            </div>

            {/* Wants to Learn */}
            <div>
              <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <BookOpen className="w-3 h-3" /> Wants to Learn
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills_learn.slice(0, 3).map((sl) => (
                  <Badge key={sl.id} variant="secondary" className="text-xs py-0.5 font-normal">
                    {sl.skill_name}
                  </Badge>
                ))}
                {profile.skills_learn.length > 3 && (
                  <span className="text-xs text-slate-400 self-center">
                    +{profile.skills_learn.length - 3} more
                  </span>
                )}
                {profile.skills_learn.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No learning goals listed</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <Link
            href={`/profile/${profile.username}`}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Full Profile →
          </Link>

          {!isSelf && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsRequestModalOpen(true)}
              className="text-xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
              Request Swap
            </Button>
          )}
        </div>
      </Card>

      {/* Swap Request Modal */}
      {isRequestModalOpen && (
        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          targetProfile={profile}
          onSuccess={() => {
            setIsRequestModalOpen(false);
            if (onSwapSent) onSwapSent();
          }}
        />
      )}
    </>
  );
}
