"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { CheckCircle2, AlertCircle, Mail, ArrowRightLeft } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [token, setToken] = useState(tokenParam);
  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      handleVerify(tokenParam);
    }
  }, [tokenParam]);

  const handleVerify = async (tok: string) => {
    setStatus("verifying");
    setMessage("");
    try {
      const res = await authService.verifyEmail(tok);
      setStatus("success");
      setMessage(res.message);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to verify email token");
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await authService.resendVerification(email);
      setResendStatus(res.message);
    } catch (err: any) {
      setResendStatus(err.message || "Failed to resend link");
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
          <h2 className="text-xl font-bold text-slate-900">Email Verification</h2>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">Confirm Your Account</CardTitle>
            <CardDescription className="text-xs">
              Verify your email address to ensure community safety and unlock full exchange privileges.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "success" ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Email Verified!</h3>
                <p className="text-xs text-slate-600">{message}</p>
                <div className="pt-3">
                  <Link href="/login">
                    <Button variant="primary" className="w-full">
                      Proceed to Login →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : status === "error" ? (
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>

                {/* Resend option */}
                <form onSubmit={handleResend} className="space-y-3 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-600">Need a new verification link?</p>
                  <Input
                    label="Account Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                  <Button type="submit" variant="secondary" className="w-full text-xs">
                    Send New Link
                  </Button>
                  {resendStatus && (
                    <p className="text-xs text-indigo-700 font-medium">{resendStatus}</p>
                  )}
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Verification Token"
                  placeholder="Paste your 32-character token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={status === "verifying"}
                  onClick={() => handleVerify(token)}
                  disabled={!token.trim()}
                >
                  Verify Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
