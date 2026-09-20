"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SkillSwap } from "@/types";
import { swapService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  ArrowRightLeft, MessageSquare, Calendar, TrendingUp,
  CheckCircle2, RefreshCw, Star
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SwapsPage() {
  const { isAuthenticated } = useAuth();
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchSwaps = async () => {
    setIsLoading(true);
    try {
      const data = await swapService.getMySwaps();
      setSwaps(data);
    } catch (err) {
      console.error("Failed to load skill swaps:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSwaps();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleComplete = async (swapId: string) => {
    if (!confirm("Are you sure you want to mark this skill swap as completed? You'll be invited to review your peer!")) return;
    setCompletingId(swapId);
    try {
      await swapService.completeSwap(swapId);
      await fetchSwaps();
    } catch (err: any) {
      alert(err.message || "Failed to complete swap");
    } finally {
      setCompletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <ArrowRightLeft className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view active skill swaps</h2>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-7 h-7 text-indigo-600" />
            Active Skill Exchanges
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your ongoing partnerships, exchange skills, schedule sessions, and track learning milestones.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSwaps} className="self-start">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading exchanges...</div>
      ) : swaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Active Skill Swaps Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            When you accept or receive acceptance on a skill exchange proposal, your active swap will appear here along with your collaborative workspace.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/explore">
              <Button variant="primary" size="sm">
                Explore Mentors →
              </Button>
            </Link>
            <Link href="/requests">
              <Button variant="outline" size="sm">
                Check Pending Requests
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {swaps.map((swap) => (
            <Card key={swap.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={swap.partner_avatar}
                      name={swap.partner_name}
                      size="md"
                    />
                    <div>
                      <Link
                        href={`/profile/${swap.partner_username}`}
                        className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {swap.partner_name}
                      </Link>
                      <p className="text-xs text-slate-500 font-medium">{swap.partner_profession}</p>
                    </div>
                  </div>

                  <Badge variant={swap.status === "Active" ? "success" : "secondary"}>
                    {swap.status}
                  </Badge>
                </div>

                {/* Exchange Pair Box */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">You Teach</span>
                    <p className="font-bold text-sm text-slate-900 mt-0.5">{swap.i_teach_skill}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-violet-600 uppercase">You Learn</span>
                    <p className="font-bold text-sm text-slate-900 mt-0.5">{swap.i_learn_skill}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      Learning Progress
                    </span>
                    <span>{swap.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(swap.progress_percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Started {formatDate(swap.started_at)} • {swap.completed_sessions}/{swap.total_sessions} sessions completed
                  </p>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {swap.conversation_id && (
                      <Link href={`/chat/${swap.conversation_id}`}>
                        <Button size="sm" variant="primary" className="text-xs">
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    )}
                    <Link href={`/sessions?swap_id=${swap.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        Sessions
                      </Button>
                    </Link>
                    <Link href={`/progress?swap_id=${swap.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        Milestones
                      </Button>
                    </Link>
                  </div>

                  {swap.status === "Active" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={completingId === swap.id}
                      onClick={() => handleComplete(swap.id)}
                      className="text-xs text-slate-500 hover:text-emerald-600"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Mark Completed
                    </Button>
                  ) : (
                    <Link href={`/reviews?swap_id=${swap.id}&partner_id=${swap.partner_id}`}>
                      <Button size="sm" variant="outline" className="text-xs text-amber-700 bg-amber-50 border-amber-200">
                        <Star className="w-3.5 h-3.5 mr-1" />
                        Leave Review
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
