"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, Circle, Clock3, Edit3, Plus, Target, TrendingUp, Users, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { LearningProgress, LearningSession, SkillSwap } from "@/types";
import { progressService, sessionService, swapService } from "@/services";
import { formatDateTime } from "@/lib/utils";

export default function ProgressGoalDetailPage() {
  const params = useParams();
  const progressId = params.progressId as string;
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [swap, setSwap] = useState<SkillSwap | null>(null);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalSessions, setTotalSessions] = useState(10);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneDescription, setMilestoneDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadGoal = async () => {
    setLoading(true);
    setError(null);
    try {
      const record = await progressService.getProgressRecord(progressId);
      const [swapList, sessionList] = await Promise.all([swapService.getMySwaps(), sessionService.getSessions(record.swap_id)]);
      const relatedSwap = swapList.find((item) => item.id === record.swap_id) || null;
      setProgress(record);
      setSwap(relatedSwap);
      setSessions(sessionList);
      setCurrentLevel(record.current_level || "Beginner");
      setTargetLevel(record.target_level || "Intermediate");
      setProgressPercent(record.progress_percentage);
      setCompletedSessions(record.completed_sessions);
      setTotalSessions(record.total_sessions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this learning goal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && progressId) void loadGoal();
    else if (!isAuthenticated) setLoading(false);
  }, [isAuthenticated, progressId]);

  const completedMilestones = useMemo(() => progress?.milestones.filter((milestone) => milestone.status === "Completed").length || 0, [progress]);
  const toggleMilestone = async (milestoneId: string) => {
    try {
      await progressService.toggleMilestone(milestoneId);
      await loadGoal();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update milestone.");
    }
  };

  const saveProgress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!progress) return;
    setSaving(true);
    setError(null);
    try {
      await progressService.updateProgress(progress.id, {
        current_level: currentLevel,
        target_level: targetLevel,
        progress_percentage: progressPercent,
        completed_sessions: completedSessions,
        total_sessions: totalSessions,
      });
      setEditOpen(false);
      await loadGoal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update progress.");
    } finally {
      setSaving(false);
    }
  };

  const addMilestone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!progress || !milestoneTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await progressService.addMilestone(progress.id, { title: milestoneTitle.trim(), description: milestoneDescription.trim() || undefined, order: progress.milestones.length + 1 });
      setMilestoneTitle("");
      setMilestoneDescription("");
      setMilestoneOpen(false);
      await loadGoal();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add milestone.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) return <div className="goal-detail-empty"><Target /><h1>Sign in to view learning progress</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;
  if (loading) return <div className="goal-detail-empty" role="status">Loading learning goal...</div>;
  if (!progress) return <div className="goal-detail-empty"><XCircle /><h1>Learning goal unavailable</h1><p>{error || "This goal could not be found."}</p><Link href="/progress"><Button variant="outline">Back to Goals</Button></Link></div>;

  const upcomingSessions = sessions.filter((session) => session.status === "Upcoming").sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime());
  const recentSessions = [...sessions].sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()).slice(0, 5);

  return (
    <main className="goal-detail-page">
      <div className="goal-detail-layout">
        <section className="goal-detail-main">
          <header className="goal-detail-header"><div><Link href="/progress"><ArrowLeft />Back to Goals</Link><span className="goal-detail-title-icon"><Target /></span><div><h1>Learn {progress.skill_name}</h1><p>Build your skills through focused sessions and achievable milestones.</p></div></div><Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Edit3 />Edit Goal</Button></header>
          {error && <div className="goal-detail-error"><XCircle />{error}</div>}
          <div className="goal-overview-grid">
            <section className="goal-progress-panel"><h2>Overall Progress</h2><div className="goal-progress-body"><div className="goal-progress-ring" style={{ "--goal-progress": `${Math.min(progress.progress_percentage, 100) * 3.6}deg` } as React.CSSProperties}><span>{progress.progress_percentage}%<small>Complete</small></span></div><dl><div><dt>Current level</dt><dd>{progress.current_level || "Beginner"}</dd></div><div><dt>Target level</dt><dd>{progress.target_level || "Intermediate"}</dd></div><div><dt>Sessions</dt><dd>{progress.completed_sessions}/{progress.total_sessions}</dd></div><div><dt>Milestones</dt><dd>{completedMilestones}/{progress.milestones.length}</dd></div></dl></div><div className="goal-progress-bar"><i style={{ width: `${Math.min(progress.progress_percentage, 100)}%` }} /></div><button className="goal-update-button" onClick={() => setEditOpen(true)}>Update Progress</button></section>
            <section className="goal-level-panel"><h2>Skill Level Journey</h2><p>Progress from {progress.current_level || "Beginner"} toward {progress.target_level || "Intermediate"}.</p><div className="goal-journey"><div className="goal-journey-axis"><span>Advanced</span><span>Intermediate</span><span>Beginner</span><span>Novice</span></div><div className="goal-journey-plot"><div className="goal-journey-line"/><span className="goal-journey-marker" style={{ left: `${Math.max(5, Math.min(progress.progress_percentage, 95))}%` }}><b>You are here</b>{progress.progress_percentage}%</span><div className="goal-journey-months"><span>Start</span><span>Practice</span><span>Now</span><span>Target</span></div></div></div><div className="goal-journey-legend"><span><i />Your progress</span><span><i />Target path</span></div></section>
          </div>
          <div className="goal-detail-content-grid">
            <section className="goal-milestones-panel"><header><div><h2>Milestones</h2><p>Track progress in small, achievable steps.</p></div><button onClick={() => setMilestoneOpen(true)}><Plus />Add Milestone</button></header>{progress.milestones.length ? <div className="goal-milestone-list">{progress.milestones.map((milestone) => <article className={`goal-milestone-row ${milestone.status.toLowerCase().replaceAll(" ", "-")}`} key={milestone.id}><button aria-label={`Mark ${milestone.title} ${milestone.status === "Completed" ? "in progress" : "complete"}`} onClick={() => void toggleMilestone(milestone.id)}>{milestone.status === "Completed" ? <CheckCircle2 /> : milestone.status === "In Progress" ? <span className="in-progress-dot" /> : <Circle />}</button><div><h3>{milestone.title}</h3>{milestone.description && <p>{milestone.description}</p>}</div><span className="goal-milestone-status">{milestone.status}</span></article>)}</div> : <div className="goal-detail-empty-inline"><p>No milestones yet. Add a first step for this goal.</p><button onClick={() => setMilestoneOpen(true)}><Plus />Add Milestone</button></div>}</section>
            <section className="goal-sessions-panel"><header><div><h2>Sessions Contributing to This Goal</h2><p>Sessions associated with this skill swap.</p></div><Link href={`/sessions?swap_id=${progress.swap_id}`}>View all <ArrowRight /></Link></header>{recentSessions.length ? <div className="goal-session-list">{recentSessions.map((session) => <article key={session.id}><span><CalendarDays /></span><div><strong>{session.title}</strong><small>{formatDateTime(session.date_time)}</small></div><Badge variant={session.status === "Completed" ? "success" : session.status === "Upcoming" ? "warning" : "secondary"}>{session.status}</Badge></article>)}</div> : <p className="goal-detail-muted">No sessions are linked to this learning goal yet.</p>}<Link className="goal-view-sessions" href={swap ? `/sessions/schedule/${swap.id}` : "/sessions"}>Schedule a Session <ArrowRight /></Link></section>
          </div>
        </section>
        <aside className="goal-detail-aside">
          <section className="goal-partner-panel"><header><h2>Learning Partner</h2><span><i />{swap?.status || "Active"}</span></header>{swap && <><Avatar src={swap.partner_avatar} name={swap.partner_name} size="lg" /><div className="goal-partner-info"><strong>{swap.partner_name}</strong><small>{swap.partner_profession}</small><p>Teaches you: {swap.i_learn_skill}</p></div><Link href={`/profile/${swap.partner_username}`}>View Profile</Link></>}</section>
          <section className="goal-timeline-panel"><h2><CalendarDays />Goal Timeline</h2><p>{progress.completed_sessions} completed of {progress.total_sessions} planned sessions</p><div><i style={{ width: `${progress.total_sessions ? Math.min(progress.completed_sessions / progress.total_sessions * 100, 100) : 0}%` }} /></div><small>Progress is based on completed milestones.</small></section>
          <blockquote className="goal-detail-quote">“A new skill is a new possibility.”<span>Keep moving forward.</span></blockquote>
          <section className="goal-resources-panel"><h2><BookOpen />Learning Resources</h2><p>Resources can be shared with your partner in chat.</p><Link href={swap?.conversation_id ? `/chat/${swap.conversation_id}` : "/chat"}>Open Exchange Chat <ArrowRight /></Link></section>
        </aside>
      </div>

      {editOpen && <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Update learning goal" description="Adjust your current level and session progress."><form className="goal-modal-form" onSubmit={saveProgress}><label>Current level<select value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value)}><option>Novice</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Professional</option></select></label><label>Target level<select value={targetLevel} onChange={(event) => setTargetLevel(event.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>Professional</option></select></label><label>Progress percent<input type="number" min={0} max={100} value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} /></label><div className="goal-session-count-fields"><label>Completed sessions<input type="number" min={0} value={completedSessions} onChange={(event) => setCompletedSessions(Number(event.target.value))} /></label><label>Planned sessions<input type="number" min={1} value={totalSessions} onChange={(event) => setTotalSessions(Number(event.target.value))} /></label></div><footer><Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" isLoading={saving}>Save Goal</Button></footer></form></Modal>}
      {milestoneOpen && <Modal isOpen={milestoneOpen} onClose={() => setMilestoneOpen(false)} title="Add a milestone" description="Break the learning goal into a clear next step."><form className="goal-modal-form" onSubmit={addMilestone}><Input label="Milestone title" value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} required maxLength={200} placeholder="e.g. Complete a first design exercise" /><label>Description (optional)<textarea rows={3} value={milestoneDescription} onChange={(event) => setMilestoneDescription(event.target.value)} placeholder="What will you practice or complete?" /></label><footer><Button type="button" variant="outline" size="sm" onClick={() => setMilestoneOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" isLoading={saving}>Add Milestone</Button></footer></form></Modal>}
    </main>
  );
}
