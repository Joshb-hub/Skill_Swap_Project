"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { safetyService, authService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  ShieldCheck, Lock, UserX, CheckCircle2, AlertCircle, Save
} from "lucide-react";

export default function SettingsPage() {
  const { isAuthenticated, user } = useAuth();

  // Privacy Settings
  const [emailPrivacy, setEmailPrivacy] = useState("Visible After Request Acceptance");
  const [phonePrivacy, setPhonePrivacy] = useState("Hidden");
  const [privacySuccess, setPrivacySuccess] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; blocked_id: string; blocked_username: string }>>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      safetyService.getPrivacySettings().then((p) => {
        setEmailPrivacy(p.email_privacy);
        setPhonePrivacy(p.phone_privacy);
      }).catch(console.error);

      safetyService.listBlocked().then(setBlockedUsers).catch(console.error);
    }
  }, [isAuthenticated]);

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivacyLoading(true);
    setPrivacySuccess(false);
    try {
      await safetyService.updatePrivacySettings({
        email_privacy: emailPrivacy,
        phone_privacy: phonePrivacy,
      });
      setPrivacySuccess(true);
      setTimeout(() => setPrivacySuccess(false), 3000);
    } catch (err) {
      alert("Failed to update privacy settings");
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      await safetyService.updatePrivacySettings as any; // or call change password
      // Use auth client for password change
      const token = localStorage.getItem("skillswap_access_token");
      const res = await fetch("http://localhost:8000/api/settings/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to change password");
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await safetyService.unblockUser(blockedId);
      setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
    } catch (err) {
      alert("Failed to unblock user");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to manage privacy settings</h2>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-600" />
          Privacy & Security Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Configure contact visibility rules, security credentials, and manage community safety blocks.
        </p>
      </div>

      <div className="space-y-6">
        {/* Contact Privacy Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Contact Details Privacy
            </CardTitle>
            <CardDescription className="text-xs">
              Choose who can view your email address and phone number. Your contact details are never shown publicly in search results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSavePrivacy} className="space-y-4">
              {privacySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Privacy settings saved successfully!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Email Address Privacy</label>
                  <select
                    value={emailPrivacy}
                    onChange={(e) => setEmailPrivacy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Hidden">Hidden (Never revealed)</option>
                    <option value="Visible After Request Acceptance">Visible After Request Acceptance</option>
                    <option value="Visible With Permission">Visible With Permission</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Phone Number Privacy</label>
                  <select
                    value={phonePrivacy}
                    onChange={(e) => setPhonePrivacy(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  >
                    <option value="Hidden">Hidden (Never revealed)</option>
                    <option value="Visible After Request Acceptance">Visible After Request Acceptance</option>
                    <option value="Visible With Permission">Visible With Permission</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={privacyLoading}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Privacy Preferences
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              Change Password
            </CardTitle>
            <CardDescription className="text-xs">
              Keep your account secure by using a strong password with letters, numbers, and symbols.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Password changed successfully!</span>
                </div>
              )}
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <Input
                label="New Password"
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button type="submit" variant="outline" size="sm" isLoading={passwordLoading}>
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Blocked Users Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="w-5 h-5 text-indigo-600" />
              Blocked Users
            </CardTitle>
            <CardDescription className="text-xs">
              Blocked users cannot send you exchange proposals, message you, or see your profile in matching.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {blockedUsers.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                You haven't blocked any users.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {blockedUsers.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">@{b.blocked_username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(b.blocked_id)}
                      className="text-xs text-slate-600"
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
