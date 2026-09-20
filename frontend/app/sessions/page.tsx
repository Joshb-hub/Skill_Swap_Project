"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LearningSession, SkillSwap } from "@/types";
import { sessionService, swapService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar, Clock, Video, Plus, CheckCircle2,
  XCircle, AlertCircle, RefreshCw, ArrowRightLeft
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function SessionsPage() {
  const searchParams = useSearchParams();
  const swapIdParam = searchParams.get("swap_id") || "";

  const { isAuthenticated, user } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  // New session state
  const [selectedSwapId, setSelectedSwapId] = useState<string>(swapIdParam);
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [sessionDateTime, setSessionDateTime] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchSessionsAndSwaps = async () => {
    setIsLoading(true);
    try {
      const [sessList, swapList] = await Promise.all([
        sessionService.getSessions(selectedSwapId || undefined),
        swapService.getMySwaps(),
      ]);
      setSessions(sessList);
      setSwaps(swapList);
      if (!selectedSwapId && swapList.length > 0) {
        setSelectedSwapId(swapList[0].id);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSessionsAndSwaps();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, selectedSwapId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSwapId || !sessionTitle || !sessionDateTime) {
      setModalError("Please complete all required fields.");
      return;
    }

    const swapObj = swaps.find((s) => s.id === selectedSwapId);
    if (!swapObj) {
      setModalError("Please select a valid active swap.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      // Pick skill id (either the teach or learn skill of the swap)
      await sessionService.scheduleSession({
        swap_id: selectedSwapId,
        skill_id: swapObj.i_learn_skill, // or i_teach_skill
        title: sessionTitle.trim(),
        date_time: new Date(sessionDateTime).toISOString(),
        duration_minutes: Number(durationMinutes),
        meeting_link: meetingLink.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsScheduleModalOpen(false);
      setSessionTitle("");
      setSessionDateTime("");
      setNotes("");
      fetchSessionsAndSwaps();
    } catch (err: any) {
      setModalError(err.message || "Failed to schedule session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: "Completed" | "Cancelled") => {
    try {
      await sessionService.updateSession(sessionId, { status: status as any });
      fetchSessionsAndSwaps();
    } catch (err: any) {
      alert(err.message || "Failed to update session status");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <Calendar className="w-12 h-12 text-indigo-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to schedule learning sessions</h2>
        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  const upcomingSessions = sessions.filter((s) => s.status === "Upcoming");
  const pastSessions = sessions.filter((s) => s.status !== "Upcoming");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-indigo-600" />
            Learning Sessions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Coordinate 1-on-1 video or in-person mentorship sessions with your exchange partners.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsScheduleModalOpen(true)}
            disabled={swaps.length === 0}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule Session
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-slate-400 text-sm">Loading learning sessions...</div>
      ) : swaps.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto">
          <ArrowRightLeft className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No Active Swaps</h3>
          <p className="text-xs text-slate-500">
            You must be in an active skill swap to schedule collaborative learning sessions.
          </p>
          <Link href="/explore">
            <Button variant="primary" size="sm">
              Discover Mentors →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Sessions Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Upcoming Sessions ({upcomingSessions.length})
            </h2>

            {upcomingSessions.length === 0 ? (
              <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                No upcoming sessions scheduled. Click "Schedule Session" above to set a date with your partner.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingSessions.map((sess) => (
                  <Card key={sess.id} className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">{sess.title}</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Focus Skill: <span className="text-indigo-600">{sess.skill_name}</span>
                          </p>
                        </div>
                        <Badge variant="warning">{sess.status}</Badge>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold">{formatDateTime(sess.date_time)}</span>
                          <span className="text-slate-400">({sess.duration_minutes} mins)</span>
                        </div>
                        {sess.meeting_link && (
                          <div className="flex items-center space-x-2">
                            <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <a
                              href={sess.meeting_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline truncate"
                            >
                              {sess.meeting_link}
                            </a>
                          </div>
                        )}
                      </div>

                      {sess.notes && (
                        <p className="text-xs text-slate-600 italic bg-white p-2 rounded-md border border-slate-100">
                          "{sess.notes}"
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          Scheduled by {sess.scheduled_by_name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(sess.id, "Completed")}
                            className="text-xs text-emerald-600 hover:text-emerald-700"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUpdateStatus(sess.id, "Cancelled")}
                            className="text-xs text-slate-400 hover:text-rose-600"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past / Completed Sessions */}
          {pastSessions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">Past & Completed Sessions</h2>
              <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200 overflow-hidden">
                {pastSessions.map((sess) => (
                  <div key={sess.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{sess.title}</p>
                      <p className="text-slate-400 mt-0.5">
                        {formatDateTime(sess.date_time)} • {sess.skill_name}
                      </p>
                    </div>
                    <Badge variant={sess.status === "Completed" ? "success" : "secondary"}>
                      {sess.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title="Schedule Learning Session"
          description="Set a date, duration, and virtual meeting link for your peer exchange."
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Select Active Swap</label>
              <select
                value={selectedSwapId}
                onChange={(e) => setSelectedSwapId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                {swaps.map((s) => (
                  <option key={s.id} value={s.id}>
                    With {s.partner_name} ({s.i_teach_skill} ↔ {s.i_learn_skill})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Session Title"
              placeholder="e.g. Python Functions Deep Dive, Figma Layouts Workshop"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date & Time"
                type="datetime-local"
                value={sessionDateTime}
                onChange={(e) => setSessionDateTime(e.target.value)}
                required
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (1 hour)</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            <Input
              label="Video Call / Meeting Link (Optional)"
              placeholder="e.g. https://meet.jit.si/skillswap-session or Zoom link"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Agenda / Prep Notes</label>
              <textarea
                rows={2}
                placeholder="What should the learner have prepared?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Confirm Schedule
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
