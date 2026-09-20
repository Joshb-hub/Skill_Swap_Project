"use client";

import React, { useState } from "react";
import { Profile } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { swapService } from "@/services";
import { ArrowRightLeft, AlertCircle, CheckCircle2 } from "lucide-react";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProfile: Profile;
  onSuccess?: () => void;
}

export function RequestModal({ isOpen, onClose, targetProfile, onSuccess }: RequestModalProps) {
  const { user } = useAuth();
  const [offeredSkillId, setOfferedSkillId] = useState<string>("");
  const [requestedSkillId, setRequestedSkillId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const myTeachSkills = user?.profile?.skills_teach || [];
  const targetTeachSkills = targetProfile.skills_teach || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeredSkillId || !requestedSkillId) {
      setError("Please select both a skill to offer and a skill you want to learn.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await swapService.sendRequest({
        receiver_id: targetProfile.user_id,
        offered_skill_id: offeredSkillId,
        requested_skill_id: requestedSkillId,
        message: message.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Request Skill Swap with ${targetProfile.full_name}`}
      description="Propose a reciprocal exchange: teach what you know in return for learning their skill."
      maxWidth="lg"
    >
      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Request Sent Successfully!</h4>
          <p className="text-sm text-slate-500">
            {targetProfile.full_name} has been notified and can accept to unlock real-time chat and scheduling.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Offer Skill */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              1. Skill You Will Teach
            </label>
            {myTeachSkills.length > 0 ? (
              <select
                value={offeredSkillId}
                onChange={(e) => setOfferedSkillId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select one of your teaching skills...</option>
                {myTeachSkills.map((s) => (
                  <option key={s.skill_id} value={s.skill_id}>
                    {s.skill_name} ({s.experience_level || "Standard"})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                You have not listed any skills you can teach yet. Please add a teaching skill to your profile first!
              </div>
            )}
          </div>

          {/* Requested Skill */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              2. Skill You Want to Learn from {targetProfile.full_name}
            </label>
            {targetTeachSkills.length > 0 ? (
              <select
                value={requestedSkillId}
                onChange={(e) => setRequestedSkillId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a skill they teach...</option>
                {targetTeachSkills.map((s) => (
                  <option key={s.skill_id} value={s.skill_id}>
                    {s.skill_name} ({s.experience_level || "Standard"})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
                This user has not listed teaching skills yet.
              </div>
            )}
          </div>

          {/* Custom Message */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              3. Message / Exchange Proposal (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Introduce yourself, describe your goals, or propose a weekly rhythm..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={myTeachSkills.length === 0 || targetTeachSkills.length === 0}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
