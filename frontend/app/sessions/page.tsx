"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowRightLeft, CalendarDays, Check, CheckCircle2, Clock3, MapPin, Plus, RefreshCw, Sparkles, Users, Video, X, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LearningSession, SkillSwap } from "@/types";
import { sessionService, swapService } from "@/services";
import { formatDateTime } from "@/lib/utils";

type SessionTab = "Upcoming" | "Past" | "Cancelled";
const sessionTabs: SessionTab[] = ["Upcoming", "Past", "Cancelled"];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function SessionsPage() {
  const searchParams = useSearchParams();
  const swapIdParam = searchParams.get("swap_id") || "";
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [tab, setTab] = useState<SessionTab>("Upcoming");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionList, swapList] = await Promise.all([sessionService.getSessions(), swapService.getMySwaps()]);
      setSessions(sessionList);
      setSwaps(swapList);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadData();
    else setLoading(false);
  }, [isAuthenticated]);

  const swapById = useMemo(() => new Map(swaps.map((swap) => [swap.id, swap])), [swaps]);
  const now = Date.now();
  const isOverdue = (session: LearningSession) => session.status === "Upcoming" && new Date(session.date_time).getTime() < now;
  const visibleSessions = useMemo(() => {
    let list = sessions.filter((session) => tab === "Upcoming" ? session.status === "Upcoming" && new Date(session.date_time).getTime() >= now : tab === "Cancelled" ? session.status === "Cancelled" : session.status === "Completed" || isOverdue(session));
    if (selectedDate) list = list.filter((session) => dateKey(new Date(session.date_time)) === selectedDate);
    return list.sort((left, right) => new Date(left.date_time).getTime() - new Date(right.date_time).getTime());
  }, [sessions, tab, selectedDate, now]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  }, [month]);
  const sessionDates = new Set(sessions.map((session) => dateKey(new Date(session.date_time))));
  const tabCounts = {
    Upcoming: sessions.filter((session) => session.status === "Upcoming" && new Date(session.date_time).getTime() >= now).length,
    Past: sessions.filter((session) => session.status === "Completed" || isOverdue(session)).length,
    Cancelled: sessions.filter((session) => session.status === "Cancelled").length,
  };

  const updateStatus = async (sessionId: string, status: "Completed" | "Cancelled") => {
    setActionLoading(sessionId);
    setError(null);
    try {
      await sessionService.updateSession(sessionId, { status });
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update the session.");
    } finally {
      setActionLoading(null);
    }
  };

  const saveReschedule = async (session: LearningSession) => {
    if (!rescheduleValue) return;
    setActionLoading(session.id);
    setError(null);
    try {
      await sessionService.updateSession(session.id, { date_time: new Date(rescheduleValue).toISOString() });
      setRescheduleId(null);
      setRescheduleValue("");
      await loadData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not reschedule.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) return <div className="sessions-dashboard-empty"><CalendarDays /><h1>Sign in to manage sessions</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;

  const preferredSwapId = swapIdParam || swaps.find((swap) => swap.status === "Active")?.id;

  return (
    <main className="sessions-dashboard-page">
      <div className="sessions-dashboard-layout">
        <section className="sessions-dashboard-main">
          <header className="sessions-dashboard-header"><div><h1>My Sessions</h1><p>Manage your upcoming and past skill exchange sessions.</p></div><Link href={preferredSwapId ? `/sessions/schedule/${preferredSwapId}` : "/matches"} className="sessions-add-button"><Plus />Schedule a Session</Link></header>
          <nav className="sessions-status-tabs" aria-label="Session status">{sessionTabs.map((status) => <button key={status} className={tab === status ? "active" : ""} onClick={() => { setTab(status); setSelectedDate(""); }}>{status}<span>{tabCounts[status]}</span></button>)}</nav>
          <div className="sessions-section-heading"><div><h2>{tab} Sessions</h2><p>{tab === "Upcoming" ? "Your scheduled skill exchange sessions." : tab === "Past" ? "Completed sessions and learning history." : "Sessions you or your partner cancelled."}</p></div><button className="sessions-reload" onClick={loadData} title="Refresh sessions" aria-label="Refresh sessions"><RefreshCw /></button></div>
          {error && <div className="sessions-inline-error"><XCircle />{error}</div>}
          {loading ? <div className="sessions-loading" role="status">Loading sessions...</div> : visibleSessions.length ? <div className="session-card-list">{visibleSessions.map((session) => {
            const swap = swapById.get(session.swap_id);
            const partnerName = swap?.partner_name || "Exchange partner";
            const partnerUsername = swap?.partner_username;
            const date = new Date(session.date_time);
            return <article className="session-dashboard-card" key={session.id}>
              <div className="session-date-badge"><strong>{date.toLocaleDateString(undefined, { month: "short" })}</strong><b>{date.getDate()}</b><span>{date.toLocaleDateString(undefined, { weekday: "short" })}</span></div>
              <Avatar src={swap?.partner_avatar} name={partnerName} size="lg" />
              <div className="session-card-info"><h3>{session.title}</h3><p>with {partnerUsername ? <Link href={`/profile/${partnerUsername}`}>{partnerName}</Link> : partnerName}</p><div className="session-skill-pills">{swap && <><span className="learn">You learn · {swap.i_learn_skill}</span><span className="teach">You teach · {swap.i_teach_skill}</span></>}</div><div className="session-time-line"><span><Clock3 />{date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {session.duration_minutes} min</span><span>{session.meeting_link ? <><Video />Online session</> : <><MapPinIcon />Session details</>}</span></div></div>
              <div className="session-card-actions"><Badge variant={isOverdue(session) ? "warning" : session.status === "Upcoming" ? "warning" : session.status === "Completed" ? "success" : "secondary"}>{isOverdue(session) ? "Overdue" : session.status}</Badge>{session.status === "Upcoming" && <>{!isOverdue(session) && session.meeting_link && <a className="session-join-button" href={session.meeting_link} target="_blank" rel="noreferrer"><Video />Join Session</a>}<button className="session-reschedule-button" onClick={() => { setRescheduleId(rescheduleId === session.id ? null : session.id); setRescheduleValue(new Date(new Date(session.date_time).getTime() - new Date(session.date_time).getTimezoneOffset() * 60000).toISOString().slice(0, 16)); }}><CalendarDays />Reschedule</button>{isOverdue(session) ? <button className="session-feedback-button" disabled={actionLoading === session.id} onClick={() => updateStatus(session.id, "Completed")}><Check />Mark complete</button> : <button className="session-cancel-button" disabled={actionLoading === session.id} onClick={() => updateStatus(session.id, "Cancelled")}><X />Cancel</button>}</>}{session.status === "Completed" && <Link className="session-feedback-button" href={`/reviews?swap_id=${session.swap_id}&partner_id=${swap?.partner_id || ""}`}><Sparkles />Give feedback</Link>}</div>
              {rescheduleId === session.id && <form className="session-reschedule-form" onSubmit={(event) => { event.preventDefault(); void saveReschedule(session); }}><label>New date and time<input type="datetime-local" value={rescheduleValue} min={new Date().toISOString().slice(0, 16)} onChange={(event) => setRescheduleValue(event.target.value)} required /></label><Button type="submit" size="sm" variant="primary" isLoading={actionLoading === session.id}>Save time</Button></form>}
            </article>;
          })}</div> : <div className="sessions-empty-state"><span><CalendarDays /></span><h2>{selectedDate ? "No sessions on this date" : `No ${tab.toLowerCase()} sessions`}</h2><p>{selectedDate ? "Choose another date or clear the calendar filter." : tab === "Upcoming" ? "Schedule a session with one of your active skill-swap partners." : "Your session history will show here."}</p>{selectedDate ? <button onClick={() => setSelectedDate("")}>Clear date filter</button> : tab === "Upcoming" && preferredSwapId ? <Link href={`/sessions/schedule/${preferredSwapId}`}><Button variant="primary" size="sm">Schedule a Session</Button></Link> : null}</div>}
        </section>
        <aside className="sessions-dashboard-aside">
          <section className="sessions-calendar-panel"><header><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><div><button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ArrowLeft /></button><button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ArrowRight /></button></div></header><div className="sessions-calendar-grid">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span className="weekday" key={day}>{day}</span>)}{calendarCells.map((day, index) => day ? <button type="button" key={`${day}-${index}`} className={`${selectedDate === dateKey(new Date(month.getFullYear(), month.getMonth(), day)) ? "selected" : ""} ${sessionDates.has(dateKey(new Date(month.getFullYear(), month.getMonth(), day))) ? "has-session" : ""}`} onClick={() => { const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day)); setSelectedDate(selectedDate === key ? "" : key); }}>{day}</button> : <span key={`empty-${index}`} />)}</div></section>
          <section className="sessions-stats-panel"><header><h2>Session Statistics</h2><button onClick={() => setTab("Past")}>View history <ArrowRight /></button></header><div><span><CalendarDays /><strong>{sessions.length}</strong><small>Total sessions</small></span><span><CheckCircle2 /><strong>{tabCounts.Past}</strong><small>Completed</small></span><span><Clock3 /><strong>{tabCounts.Upcoming}</strong><small>Upcoming</small></span><span><Users /><strong>{swaps.filter((swap) => swap.status === "Active").length}</strong><small>Active swaps</small></span></div></section>
          <blockquote className="sessions-quote"><span>✳</span><p>Every session is a step towards a better you.</p><small>Keep learning. Keep growing.</small></blockquote>
          <section className="sessions-quick-links"><h2>Quick Links</h2><Link href={preferredSwapId ? `/sessions/schedule/${preferredSwapId}` : "/matches"}><CalendarDays /><span><strong>Schedule a Session</strong><small>Find a time and book a new session</small></span><ArrowRight /></Link><Link href="/progress"><CheckCircle2 /><span><strong>View My Progress</strong><small>Track skills you’re learning and teaching</small></span><ArrowRight /></Link><Link href="/reviews"><Sparkles /><span><strong>Give Feedback</strong><small>Help your peers grow</small></span><ArrowRight /></Link></section>
        </aside>
      </div>
    </main>
  );
}

function MapPinIcon() {
  return <MapPin aria-hidden="true" />;
}