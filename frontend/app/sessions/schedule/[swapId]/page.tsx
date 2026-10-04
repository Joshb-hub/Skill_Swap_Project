"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowRightLeft, BookOpen, CalendarDays, Check, CheckCircle2, Clock3, Globe2, MapPin, Video, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { profileService, sessionService, swapService } from "@/services";
import { Profile, SkillSwap } from "@/types";

const durations = [30, 60, 90, 120];
const timeSlots = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];
const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateTime(date: string, time: string) {
  const [hoursText, minutesText] = time.split(":");
  const [hourPart, meridiem] = minutesText.split(" ");
  let hours = Number(hoursText) % 12;
  if (meridiem === "PM") hours += 12;
  return new Date(`${date}T${String(hours).padStart(2, "0")}:${hourPart}:00`);
}

export default function ScheduleSwapSessionPage() {
  const params = useParams();
  const router = useRouter();
  const swapId = params.swapId as string;
  const { isAuthenticated } = useAuth();
  const [swap, setSwap] = useState<SkillSwap | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date(Date.now() + 86400000)));
  const [selectedTime, setSelectedTime] = useState("2:00 PM");
  const [duration, setDuration] = useState(60);
  const [sessionType, setSessionType] = useState<"Online" | "In-person">("Online");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !swapId) return;
    let cancelled = false;
    swapService.getMySwaps().then(async (swaps) => {
      const match = swaps.find((item) => item.id === swapId && item.status === "Active");
      if (!match) throw new Error("This active skill swap could not be found.");
      const partnerProfile = await profileService.getProfile(match.partner_username);
      if (cancelled) return;
      setSwap(match);
      setPartner(partnerProfile);
      setTitle(`${match.i_learn_skill} learning session`);
    }).catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load this swap.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, swapId]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  }, [currentMonth]);

  const scheduledAt = selectedDate && selectedTime ? localDateTime(selectedDate, selectedTime) : null;
  const summaryDate = scheduledAt?.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) || "Choose a date";
  const summaryTime = scheduledAt?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZoneName: "short" }) || "Choose a time";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!swap || !scheduledAt || !title.trim()) return;
    if (sessionType === "In-person" && !location.trim()) {
      setError("Enter a meeting location for an in-person session.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const sessionNotes = [
      `Session type: ${sessionType}`,
      sessionType === "In-person" ? `Location: ${location.trim()}` : "",
      notes.trim(),
    ].filter(Boolean).join("\n");
    try {
      await sessionService.scheduleSession({
        swap_id: swap.id,
        skill_id: swap.i_learn_skill_id,
        title: title.trim(),
        date_time: scheduledAt.toISOString(),
        duration_minutes: duration,
        notes: sessionNotes || undefined,
        meeting_link: sessionType === "Online" ? meetingLink.trim() || undefined : undefined,
      });
      setSuccess(true);
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : "Unable to schedule the session.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return <div className="session-schedule-empty"><h1>Sign in to schedule a session</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;
  if (loading) return <div className="session-schedule-empty" role="status">Loading swap details...</div>;
  if (!swap || !partner) return <div className="session-schedule-empty"><XCircle /><h1>Schedule unavailable</h1><p>{error || "This active swap could not be found."}</p><Link href="/sessions"><Button variant="outline">Back to sessions</Button></Link></div>;
  if (success) return <main className="session-schedule-page"><section className="session-schedule-success"><span><CheckCircle2 /></span><h1>Session scheduled</h1><p>{title} with {partner.full_name} is set for {summaryDate} at {summaryTime}.</p><div><Link href="/sessions"><Button variant="outline">View sessions</Button></Link><Link href={swap.conversation_id ? `/chat/${swap.conversation_id}` : "/chat"}><Button variant="primary">Open chat</Button></Link></div></section></main>;

  return (
    <main className="session-schedule-page">
      <div className="session-schedule-layout">
        <section className="session-schedule-main">
          <Link className="session-schedule-back" href="/sessions"><ArrowLeft /> Back</Link>
          <header className="session-schedule-banner"><span><CalendarDays /></span><div><h1>Schedule a Session</h1><p>Plan a skill exchange session with {partner.full_name.split(" ")[0]} and start learning together.</p></div><div className="session-banner-art" /></header>
          <form className="session-schedule-form" onSubmit={submit}>
            <section className="session-form-section">
              <div className="session-section-heading"><span>1</span><div><h2>Session Details</h2><p>Tell us about the session you want to schedule.</p></div></div>
              <div className="session-skills-row"><label><span>I want to learn</span><div className="session-skill-select"><BookOpen /><input value={swap.i_learn_skill} readOnly aria-label="Skill I want to learn" /></div></label><ArrowRightLeft className="session-skill-exchange" /><label><span>I will teach</span><div className="session-skill-select"><ArrowRight /><input value={swap.i_teach_skill} readOnly aria-label="Skill I will teach" /></div></label></div>
              <label className="session-title-field"><span>Session title</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
              <fieldset className="session-type-field"><legend>Session type</legend><div className="session-type-options"><button type="button" className={sessionType === "Online" ? "active" : ""} onClick={() => setSessionType("Online")}><Video /><span><strong>Online session</strong><small>Meet in a video call</small></span><i /></button><button type="button" className={sessionType === "In-person" ? "active" : ""} onClick={() => setSessionType("In-person")}><MapPin /><span><strong>In-person session</strong><small>Meet at a public place</small></span><i /></button></div></fieldset>
              {sessionType === "Online" ? <label className="session-title-field"><span>Meeting link <small>(optional)</small></span><input type="url" value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} placeholder="https://meet.example.com/..." /></label> : <label className="session-title-field"><span>Meeting location</span><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Public place or venue" required /></label>}
              <fieldset className="session-duration-field"><legend>Duration</legend><div>{durations.map((minutes) => <button type="button" className={duration === minutes ? "active" : ""} key={minutes} onClick={() => setDuration(minutes)}>{minutes === 60 ? "1 hour" : minutes === 120 ? "2 hours" : `${minutes} mins`}</button>)}</div></fieldset>
            </section>

            <section className="session-form-section session-date-section">
              <div className="session-section-heading"><span>2</span><div><h2>Select Date & Time</h2><p>Choose a time that works for both of you.</p></div></div>
              <div className="session-date-grid"><div className="session-calendar"><header><strong>{currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><div><button type="button" aria-label="Previous month" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ArrowLeft /></button><button type="button" aria-label="Next month" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ArrowRight /></button></div></header><div className="session-calendar-grid">{dayLabels.map((day) => <span className="session-calendar-day" key={day}>{day}</span>)}{calendarCells.map((day, index) => day ? <button type="button" key={`${day}-${index}`} disabled={new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day) < new Date(new Date().setHours(0, 0, 0, 0))} className={selectedDate === dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)) ? "selected" : ""} onClick={() => setSelectedDate(dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)))}>{day}</button> : <span key={`empty-${index}`} />)}</div></div>
                <div className="session-times"><header><strong>Suggested time slots</strong><span><Globe2 />{Intl.DateTimeFormat().resolvedOptions().timeZone}</span></header><div>{timeSlots.map((time) => <button type="button" key={time} className={selectedTime === time ? "selected" : ""} onClick={() => setSelectedTime(time)}>{time}</button>)}</div><small>Choose a time and confirm it with your partner in chat.</small></div></div>
            </section>

            <section className="session-form-section session-notes-section"><div className="session-section-heading"><span>3</span><div><h2>Add a Message <small>(Optional)</small></h2><p>Share any additional details or preparation notes.</p></div></div><textarea maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={`Hi ${partner.full_name.split(" ")[0]}! Looking forward to working on ${swap.i_learn_skill} together.`} /><div className="session-notes-count">{notes.length}/500</div></section>
            {error && <div className="session-schedule-error"><XCircle />{error}</div>}
            <footer className="session-schedule-actions"><Link href="/sessions">Cancel</Link><Button variant="primary" type="submit" isLoading={submitting}><CalendarDays />Schedule Session</Button></footer>
          </form>
        </section>

        <aside className="session-schedule-aside">
          <section className="session-partner-card"><div className="session-partner-banner" /><Avatar src={partner.avatar_url} name={partner.full_name} size="xl" className="session-partner-avatar" /><h2>{partner.full_name}</h2><span className="session-partner-online">Active swap</span><p>{partner.profession} · {[partner.city, partner.country].filter(Boolean).join(", ")}</p><div className="session-partner-skills">{[...partner.skills_teach.slice(0, 3), ...partner.skills_learn.slice(0, 2)].map((skill) => <span key={skill.id}>{skill.skill_name}</span>)}</div><p className="session-partner-bio">{partner.bio || "Your skill exchange partner."}</p></section>
          <section className="session-summary-card"><header><h2><CalendarDays />Session Summary</h2><button type="button" onClick={() => document.querySelector(".session-form-section")?.scrollIntoView({ behavior: "smooth" })}>Edit</button></header><dl><div><dt><BookOpen />Learn</dt><dd>{swap.i_learn_skill}</dd></div><div><dt><ArrowRight />Teach</dt><dd>{swap.i_teach_skill}</dd></div><div><dt>{sessionType === "Online" ? <Video /> : <MapPin />}Type</dt><dd>{sessionType} session</dd></div><div><dt><Clock3 />Duration</dt><dd>{duration === 60 ? "1 hour" : `${duration} minutes`}</dd></div><div><dt><CalendarDays />Date</dt><dd>{summaryDate}</dd></div><div><dt><Clock3 />Time</dt><dd>{summaryTime}</dd></div></dl></section>
          <section className="session-guidelines-card"><h2><CheckCircle2 />Session Guidelines</h2><ul><li><Check />Be respectful and on time</li><li><Check />Discuss your goals and expectations</li><li><Check />Use a stable internet connection for online sessions</li><li><Check />You can reschedule or cancel if needed</li><li><Check />Leave a review after the session</li></ul></section>
          <Link className="session-swap-card" href={swap.conversation_id ? `/chat/${swap.conversation_id}` : "/chat"}><ArrowRightLeft /><span><strong>Different skills, brighter people</strong><small>Open your chat with {partner.full_name.split(" ")[0]} <ArrowRight /></small></span></Link>
        </aside>
      </div>
    </main>
  );
}
