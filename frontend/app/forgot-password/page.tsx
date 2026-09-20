"use client";

import React, { useState } from "react";
import Link from "next/link";
import { authService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ArrowRightLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Failed to process request");
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
          <h2 className="text-xl font-bold text-slate-900">Reset Your Password</h2>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Forgot Password</CardTitle>
            <CardDescription className="text-xs">
              Enter your registered email address to receive secure reset instructions.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Instructions Sent</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If your email is registered in SkillSwap, password reset instructions have been generated.
                </p>
                <div className="pt-3">
                  <Link href="/login">
                    <Button variant="outline" className="w-full text-xs">
                      Return to Sign In
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
                  label="Email Address"
                  type="email"
                  placeholder="yourname@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Send Reset Link
                </Button>
                <div className="text-center pt-2">
                  <Link href="/login" className="text-xs text-slate-500 hover:text-indigo-600">
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
