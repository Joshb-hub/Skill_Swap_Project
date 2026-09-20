"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { CheckCircle2, AlertCircle, ArrowRightLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight">SkillSwap</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Set New Password</h2>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Create New Password</CardTitle>
            <CardDescription className="text-xs">
              Enter your reset token and your new strong password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
                <p className="text-xs text-slate-600">
                  Your password has been updated. You can now log in with your new credentials.
                </p>
                <div className="pt-3">
                  <Link href="/login">
                    <Button variant="primary" className="w-full text-xs">
                      Sign In Now →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Input
                  label="Reset Token"
                  placeholder="Paste token from email"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="At least 8 characters"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Update Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
