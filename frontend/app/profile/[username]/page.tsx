"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Profile, Review } from "@/types";
import { profileService, reviewService, skillService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  MapPin, Globe, Clock, ShieldCheck, Mail, Phone,
  ArrowRightLeft, Plus, Star, Trash2, Edit3, BookOpen, CheckCircle2
} from "lucide-react";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<Tab>("about");
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [skillType, setSkillType] = useState<"TEACH" | "LEARN">("TEACH");
import { SkillFormModal } from "@/components/skills/SkillFormModal";

export default function ProfileDetailPage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState<boolean>(false);
  const [addSkillDefaultType, setAddSkillDefaultType] = useState<"TEACH" | "LEARN">("TEACH");

  const isOwner = user?.username === username;

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const p = await profileService.getProfile(username);
      setProfile(p);
      const revs = await reviewService.getUserReviews(p.user_id);
      setReviews(revs);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const handleDeleteSkill = async (userSkillId: string) => {
    if (!confirm("Are you sure you want to remove this skill from your profile?")) return;
    try {
      await skillService.removeUserSkill(userSkillId);
      loadProfile();
    } catch (err) {
      alert("Failed to delete skill");
    }
  };

  if (isLoading) {
    return <div className="py-24 text-center text-slate-500">Loading user profile...</div>;
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-xs text-slate-500">The user you are looking for does not exist or has been disabled.</p>
        <Link href="/explore">
          <Button variant="outline">Browse Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Profile Header Card */}
      <Card className="border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700" />
        <CardContent className="relative px-6 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-12 mb-4">
            <div className="flex items-end space-x-4">
              <Avatar
                src={profile.avatar_url}
                name={profile.full_name || profile.username}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white shadow-md text-xl"
              />
              <div className="space-y-0.5 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
                <p className="text-xs text-slate-500 font-medium">@{profile.username} • {profile.profession}</p>
              </div>
            </div>

            {/* Header action buttons */}
            <div className="flex items-center space-x-2">
              {isOwner ? (
                <Link href="/profile/edit">
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRequestModalOpen(true)}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                  Request Skill Swap
                </Button>
              )}
            </div>
          </div>

          {/* Bio & Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="md:col-span-2 space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                {profile.bio || "This user hasn't added a bio yet."}
              </p>

              <div className="flex flex-wrap gap-4 pt-1 text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{[profile.city, profile.state, profile.country].filter(Boolean).join(", ")}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Learning Mode: {profile.preferred_learning_mode}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Availability: {profile.availability.join(", ")}</span>
                </div>
              </div>
            </div>

            {/* Privacy-Guarded Contact Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Contact Details</span>
                <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Privacy Protected
                </span>
              </div>

              {profile.email ? (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Email visible only after swap request is accepted
                </p>
              )}

              {profile.phone_number ? (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{profile.phone_number}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">
                  Phone number hidden by privacy settings
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Showcase Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Skills I Can Teach */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base text-indigo-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Skills I Can Teach
              </CardTitle>
              <p className="text-xs text-slate-500">Skills offered for peer exchange</p>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddSkillDefaultType("TEACH");
                  setIsAddSkillModalOpen(true);
                }}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Skill
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.skills_teach.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No teaching skills listed yet.</p>
            ) : (
              profile.skills_teach.map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{s.skill_name}</span>
                      <Badge variant="default" className="text-[10px]">
                        {s.experience_level || "Proficient"}
                      </Badge>
                    </div>
                    {s.description && <p className="text-xs text-slate-600">{s.description}</p>}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteSkill(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Skills I Want to Learn */}
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base text-violet-700 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Skills I Want to Learn
              </CardTitle>
              <p className="text-xs text-slate-500">Learning targets & aspirations</p>
            </div>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAddSkillDefaultType("LEARN");
                  setIsAddSkillModalOpen(true);
                }}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Goal
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {profile.skills_learn.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No learning goals listed yet.</p>
            ) : (
              profile.skills_learn.map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{s.skill_name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        Target: {s.target_level || "Intermediate"}
                      </Badge>
                    </div>
                    {s.description && <p className="text-xs text-slate-600">{s.description}</p>}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteSkill(s.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews & Feedback */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Peer Reviews & Feedback
              </CardTitle>
              <p className="text-xs text-slate-500">Ratings from completed skill exchanges</p>
            </div>
            <div className="flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold">
              <span>{profile.rating_average || 5.0}★</span>
              <span className="text-amber-600/70">({reviews.length} reviews)</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No reviews submitted yet.</p>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Avatar src={rev.reviewer_avatar} name={rev.reviewer_name} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.reviewer_name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <span>{rev.overall_rating}★</span>
                  </div>
                </div>
                {rev.comment && <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {isRequestModalOpen && (
        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          targetProfile={profile}
        />
      )}

      {isAddSkillModalOpen && (
        <SkillFormModal
          isOpen={isAddSkillModalOpen}
          onClose={() => setIsAddSkillModalOpen(false)}
          defaultType={addSkillDefaultType}
          onSuccess={loadProfile}
        />
      )}
    </div>
  );
}
