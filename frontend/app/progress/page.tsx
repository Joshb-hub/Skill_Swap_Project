"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LearningProgress, SkillSwap } from "@/types";
import { progressService, swapService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp, CheckCircle2, Circle, Clock, Plus,
  Sparkles, ArrowRightLeft, Target, RefreshCw
} from "lucide-react";

export default function ProgressPage() {
  const searchParams = useSearchParams();
  const swapIdParam = searchParams.get("swap_id") || "";

  const { isAuthenticated } = useAuth();
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [selectedSwapId, setSelectedSwapId] = useState<string>(swapIdParam);
  const [progressRecords, setProgressRecords] = useState<LearningProgress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Milestone Modal
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [targetProgressId, setTargetProgressId] = useState<string>("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSwapsAndProgress = async () => {
    setIsLoading(true);
    try {
      const allSwaps = await swapService.getMySwaps();
      setSwaps(allSwaps);

      const targetId = selectedSwapId || (allSwaps.length > 0 ? allSwaps[0].id : "");
      if (targetId) {
        setSelectedSwapId(targetId);
        const progs = await progressService.getSwapProgress(targetId);
        setProgressRecords(progs);
      }
    } catch (err) {
      console.error("Failed to load progress:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSwapsAndProgress();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedSwapId]);

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await progressService.toggleMilestone(milestoneId);
      if (selectedSwapId) {
        const progs = await progressService.getSwapProgress(selectedSwapId);
        setProgressRecords(progs);
      }
    } catch (err) {
      alert("Failed to update milestone status");
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !targetProgressId) return;

    setIsSubmitting(true);
    try {
      await progressService.addMilestone(targetProgressId, {
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim() || undefined,
        order: 99,
      });
      setIsAddMilestoneOpen(false);
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
      if (selectedSwapId) {
        const progs = await progressService.getSwapProgress(selectedSwapId);
        setProgressRecords(progs);
      }
    } catch (err: any) {
      alert(err.message || "Failed to add milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <TrendingUp className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to track learning milestones</h2>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const currentSwap = swaps.find((s) => s.id === selectedSwapId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-indigo-600" />
            Learning Progress & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your structured learning journey, check off mastered concepts, and log session completions.
          </p>
        </div>

        {swaps.length > 1 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-600">Active Swap:</label>
            <select
              value={selectedSwapId}
              onChange={(e) => setSelectedSwapId(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {swaps.map((s) => (
                <option key={s.id} value={s.id}>
                  Partner: {s.partner_name} ({s.i_learn_skill})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading milestones...</div>
      ) : swaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto">
          <Target className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Active Swaps to Track</h3>
          <p className="text-xs text-slate-500">
            Progress records and milestones are created when you start an active skill exchange with a peer.
          </p>
          <Link href="/explore">
            <Button variant="primary" size="sm">
              Discover Mentors →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {progressRecords.map((prog) => {
            const completedCount = prog.milestones.filter((m) => m.status === "Completed").length;

            return (
              <Card key={prog.id} className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                          Learning Skill
                        </span>
                        <Badge variant="default" className="text-[10px]">
                          Target: {prog.target_level || "Intermediate"}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">
                        {prog.skill_name}
                      </CardTitle>
                      <p className="text-xs text-slate-500">
                        Exchanged with <span className="font-semibold text-slate-700">{currentSwap?.partner_name}</span>
                      </p>
                    </div>

                    {/* Progress percentage ring */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-black text-indigo-600">{prog.progress_percentage}%</p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {completedCount}/{prog.milestones.length} Milestones Done
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetProgressId(prog.id);
                          setIsAddMilestoneOpen(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 mt-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(prog.progress_percentage, 100)}%` }}
                    />
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Milestones Roadmap
                  </h3>

                  <div className="space-y-3">
                    {prog.milestones.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No milestones added yet. Click "+ Add Milestone" to define your goals!
                      </p>
                    ) : (
                      prog.milestones.map((m) => {
                        const isDone = m.status === "Completed";
                        const isInProgress = m.status === "In Progress";

                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(m.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                              isDone
                                ? "bg-emerald-50/40 border-emerald-200/70"
                                : isInProgress
                                ? "bg-indigo-50/40 border-indigo-200/70"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <button
                                type="button"
                                className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none"
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-300" />
                                )}
                              </button>
                              <div>
                                <h4
                                  className={`text-sm font-bold ${
                                    isDone ? "line-through text-slate-500" : "text-slate-900"
                                  }`}
                                >
                                  {m.title}
                                </h4>
                                {m.description && (
                                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                                    {m.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Badge
                              variant={
                                isDone ? "success" : isInProgress ? "default" : "secondary"
                              }
                              className="shrink-0 text-[10px]"
                            >
                              {m.status}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Milestone Modal */}
      {isAddMilestoneOpen && (
        <Modal
          isOpen={isAddMilestoneOpen}
          onClose={() => setIsAddMilestoneOpen(false)}
          title="Add Learning Milestone"
          description="Break your learning journey down into tangible deliverables."
        >
          <form onSubmit={handleAddMilestone} className="space-y-4">
            <Input
              label="Milestone Title"
              placeholder="e.g. Build First React Dashboard, Write Sourdough Starter"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
              <textarea
                rows={2}
                placeholder="Key concepts or project requirements to complete..."
                value={newMilestoneDesc}
                onChange={(e) => setNewMilestoneDesc(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Add Milestone
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
