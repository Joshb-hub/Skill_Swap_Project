"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import {
  CheckCircle2, XCircle, AlertCircle, ArrowRightLeft, ShieldCheck
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    date_of_birth: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    country: "United States",
    state: "",
    city: "",
    profession: "",
    bio: "",
    accept_terms: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Live password requirements
  const passwordCriteria = {
    length: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    lower: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*()_\-+=\[\]{}|;:,.<>?/]/.test(formData.password),
    match: formData.password.length > 0 && formData.password === formData.confirm_password,
  };

  const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please ensure your password satisfies all security criteria.");
      return;
    }
    if (!formData.accept_terms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        full_name: formData.full_name.trim(),
        username: formData.username.trim().toLowerCase(),
        date_of_birth: formData.date_of_birth || undefined,
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim() || undefined,
        password: formData.password,
        confirm_password: formData.confirm_password,
        country: formData.country,
        state: formData.state.trim() || undefined,
        city: formData.city.trim() || undefined,
        profession: formData.profession.trim(),
        bio: formData.bio.trim() || undefined,
        accept_terms: formData.accept_terms,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl text-slate-900 tracking-tight">SkillSwap</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900">Create Your Free Account</h2>
          <p className="text-xs text-slate-500">
            Join a community of lifelong learners and mentors worldwide
          </p>
        </div>

        <Card className="shadow-lg border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Registration</CardTitle>
            <CardDescription className="text-xs">
              Complete your profile details. Contact info will be protected by your privacy settings.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Account Created Successfully!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your SkillSwap account has been set up. You can now log in to build your skills showcase and start exchanging knowledge.
                </p>
                <div className="pt-4">
                  <Link href="/login">
                    <Button variant="primary" size="lg">
                      Proceed to Sign In →
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Jordan Miller"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                  <Input
                    label="Username"
                    placeholder="e.g. jordan_m"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="jordan@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>

                {/* Profession & DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Profession / Occupation"
                    placeholder="e.g. UI Designer, Electrician, Student"
                    required
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  />
                  <Input
                    label="Date of Birth (Private)"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Country"
                    placeholder="United States"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                  <Input
                    label="State / Region"
                    placeholder="California"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                  <Input
                    label="City"
                    placeholder="San Francisco"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                {/* Bio */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">About You (Bio)</label>
                  <textarea
                    rows={2}
                    placeholder="Share what you are passionate about, your background, and learning goals..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  />
                </div>

                {/* Live Password Strength Meter */}
                {formData.password && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <p className="font-semibold text-slate-700">Password Security Requirements:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="flex items-center space-x-1.5">
                        {passwordCriteria.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={passwordCriteria.length ? "text-emerald-700 font-medium" : "text-slate-500"}>8+ characters</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {passwordCriteria.upper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={passwordCriteria.upper ? "text-emerald-700 font-medium" : "text-slate-500"}>Uppercase letter</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {passwordCriteria.lower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={passwordCriteria.lower ? "text-emerald-700 font-medium" : "text-slate-500"}>Lowercase letter</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {passwordCriteria.number ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={passwordCriteria.number ? "text-emerald-700 font-medium" : "text-slate-500"}>Number (0-9)</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {passwordCriteria.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={passwordCriteria.special ? "text-emerald-700 font-medium" : "text-slate-500"}>Special symbol</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {passwordCriteria.match ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-slate-400" />}
                        <span className={passwordCriteria.match ? "text-emerald-700 font-medium" : "text-slate-500"}>Passwords match</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terms Acceptance */}
                <div className="pt-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={formData.accept_terms}
                      onChange={(e) => setFormData({ ...formData, accept_terms: e.target.checked })}
                      className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the <span className="text-indigo-600 font-medium">Terms of Service</span> and acknowledge that my email and phone will never be publicly exposed without my consent according to the <span className="text-indigo-600 font-medium">Privacy Policy</span>.
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={!isPasswordValid || !formData.accept_terms}
                >
                  Create SkillSwap Account
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
