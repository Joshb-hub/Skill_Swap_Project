"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { profileService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ArrowLeft, Save, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    full_name: "",
    profession: "",
    country: "",
    state: "",
    city: "",
    phone_number: "",
    bio: "",
    avatar_url: "",
    preferred_learning_mode: "Online",
    email_privacy: "Visible After Request Acceptance",
    phone_privacy: "Hidden",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile) {
      const p = user.profile;
      setFormData({
        full_name: p.full_name || "",
        profession: p.profession || "",
        country: p.country || "United States",
        state: p.state || "",
        city: p.city || "",
        phone_number: p.phone_number || "",
        bio: p.bio || "",
        avatar_url: p.avatar_url || "",
        preferred_learning_mode: p.preferred_learning_mode || "Online",
        email_privacy: p.email_privacy || "Visible After Request Acceptance",
        phone_privacy: p.phone_privacy || "Hidden",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await profileService.updateMyProfile(formData as any);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => {
        router.push(`/profile/${user?.username}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${user?.username}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Profile
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Edit Profile & Privacy</h1>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Public Information & Preferences</CardTitle>
          <CardDescription className="text-xs">
            Manage your personal bio, learning mode, and privacy controls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Profile updated successfully! Redirecting...</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <Input
                label="Profession / Occupation"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
              <Input
                label="State / Region"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Preferred Learning Mode</label>
                <select
                  value={formData.preferred_learning_mode}
                  onChange={(e) => setFormData({ ...formData, preferred_learning_mode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Online">Online</option>
                  <option value="In Person">In Person</option>
                  <option value="Either">Either Online / In Person</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Bio</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Privacy Section */}
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Contact Privacy Rules</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Control how and when your contact details are shared with other exchange partners.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Email Visibility</label>
                  <select
                    value={formData.email_privacy}
                    onChange={(e) => setFormData({ ...formData, email_privacy: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Hidden">Hidden (Never shown)</option>
                    <option value="Visible After Request Acceptance">Visible After Request Acceptance</option>
                    <option value="Visible With Permission">Visible With Permission</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Phone Visibility</label>
                  <select
                    value={formData.phone_privacy}
                    onChange={(e) => setFormData({ ...formData, phone_privacy: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Hidden">Hidden (Never shown)</option>
                    <option value="Visible After Request Acceptance">Visible After Request Acceptance</option>
                    <option value="Visible With Permission">Visible With Permission</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Link href={`/profile/${user?.username}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
