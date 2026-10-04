"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowRightLeft, BookOpen, CalendarDays, Check, CheckCircle2, Clock3, MessageCircle, Search, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { matchService, sessionService, swapService } from "@/services";
import { LearningSession, SkillSwap } from "@/types";

type MatchTab = "All Matches" | "Active" | "Upcoming Sessions" | "Completed";
const tabs: MatchTab[] = ["All Matches", "Active", "Upcoming Sessions", "Completed"];

export default function MatchesPage() {
  const { isAuthenticated } = useAuth();
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [tab, setTab] = useState<MatchTab>("All Matches");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [swapList, sessionList] = await Promise.all([swapService.getMySwaps(), sessionService.getSessions()]);
      setSwaps(swapList);
      setSessions(sessionList);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load your connections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadData();
    else setLoading(false);
  }, [isAuthenticated]);

  const upcomingBySwap = useMemo(() => {
    const map = new Map<string, LearningSession>();
    sessions.filter((session) => session.status === "Upcoming" && new Date(session.date_time).getTime() >= Date.now()).forEach((session) => {
      const existing = map.get(session.swap_id);
      if (!existing || new Date(session.date_time) < new Date(existing.date_time)) map.set(session.swap_id, session);
    });
    return map;
  }, [sessions]);

  const filteredSwaps = useMemo(() => swaps.filter((swap) => {
    const matchesSearch = `${swap.partner_name} ${swap.partner_profession} ${swap.i_teach_skill} ${swap.i_learn_skill}`.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (tab === "Active") return swap.status === "Active";
    if (tab === "Completed") return swap.status === "Completed";
    if (tab === "Upcoming Sessions") return upcomingBySwap.has(swap.id);
    return true;
  }), [swaps, tab, search, upcomingBySwap]);

  const tabCounts: Record<MatchTab, number> = {
    "All Matches": swaps.length,
    Active: swaps.filter((swap) => swap.status === "Active").length,
    "Upcoming Sessions": upcomingBySwap.size,
    Completed: swaps.filter((swap) => swap.status === "Completed").length,
  };

  if (!isAuthenticated) return <div className="matches-dashboard-empty"><Users /><h1>Sign in to view your connections</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;

  return (
    <main className="matches-dashboard-page">
      <div className="matches-dashboard-layout">
        <section className="matches-main-column">
          <header className="matches-dashboard-header"><div><h1>Your Matches</h1><p>People you’re connected with through skill swaps.</p></div><label className="matches-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your matches..." aria-label="Search your matches" /></label></header>
          <nav className="matches-tabs" aria-label="Filter connections">{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{tabCounts[item]}</span></button>)}</nav>
          {loadError && <p className="matches-load-error">{loadError}</p>}
          {loading ? <div className="matches-empty-state" role="status">Loading your connections...</div> : filteredSwaps.length ? (
            <div className="matches-connection-list">{filteredSwaps.map((swap) => {
              const nextSession = upcomingBySwap.get(swap.id);
              const lastSession = sessions.filter((session) => session.swap_id === swap.id && session.status === "Completed").sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())[0];
              return (
                <article className="match-connection-card" key={swap.id}>
                  <div className="match-member"><Avatar src={swap.partner_avatar} name={swap.partner_name} size="lg" /><div className="match-member-copy"><div><Link href={`/profile/${swap.partner_username}`}>{swap.partner_name}</Link><span className={`match-status ${swap.status.toLowerCase()}`}><i />{swap.status}</span></div><p><span>{swap.partner_profession}</span><span>{swap.partner_username}</span></p><p className="match-member-quote">Your skills connect through a shared learning exchange.</p><div className="match-skill-tags"><span className="learn">{swap.i_learn_skill}</span><span>{swap.i_teach_skill}</span></div></div></div>
                  <div className="match-session-summary"><strong>{nextSession ? "Next Session" : lastSession ? "Last Session" : "Skill Exchange"}</strong>{nextSession ? <><span><CalendarDays />{new Date(nextSession.date_time).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span><span><Clock3 />{new Date(nextSession.date_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {nextSession.duration_minutes} min</span><span><CheckCircle2 />{nextSession.meeting_link ? "Online session" : "Session scheduled"}</span></> : lastSession ? <><span><CalendarDays />{new Date(lastSession.date_time).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span><span><Check />Completed</span></> : <><span><BookOpen />{swap.i_learn_skill}</span><span><ArrowRightLeft />{swap.completed_sessions} completed sessions</span></>}</div>
                  <div className="match-card-actions"><Link href={swap.conversation_id ? `/chat/${swap.conversation_id}` : "/chat"}><MessageCircle />Chat</Link><Link href={`/profile/${swap.partner_username}`}><Users />View Profile</Link><button className="match-more-button" aria-label={`More options for ${swap.partner_name}`}>···</button></div>
                </article>
              );
            })}</div>
          ) : <div className="matches-empty-state"><span><Users /></span><h2>{search ? "No matches found" : tab === "All Matches" ? "Your connections will appear here" : `No ${tab.toLowerCase()} yet`}</h2><p>{search ? "Try another name or skill." : "Accept a skill swap request to start building your learning network."}</p><Link href={tab === "All Matches" ? "/requests" : "/explore"}><Button variant="primary" size="sm">{tab === "All Matches" ? "View requests" : "Explore people"}</Button></Link></div>}
        </section>
        <aside className="matches-dashboard-aside">
          <section className="matches-stats-panel"><h2><Sparkles />Your Match Stats</h2><div><span><Users /><strong>{swaps.length}</strong><small>Total matches</small></span><span><CheckCircle2 /><strong>{tabCounts.Active}</strong><small>Active swaps</small></span><span><CalendarDays /><strong>{sessions.filter((session) => session.status === "Upcoming").length}</strong><small>Upcoming sessions</small></span><span><Check /><strong>{sessions.filter((session) => session.status === "Completed").length}</strong><small>Completed</small></span></div></section>
          <blockquote className="matches-quote">“Learn from anyone, teach everyone.”<span>♡</span></blockquote>
          <section className="matches-tips-panel"><h2><Sparkles />Tips for great skill swaps</h2><ul><li><Check />Be open and communicative</li><li><Check />Discuss your learning goals</li><li><Check />Respect each other’s time</li><li><Check />Be consistent with sessions</li><li><Check />Share resources and feedback</li></ul></section>
          <Link className="matches-grow-panel" href="/explore"><span><Users /></span><strong>Build meaningful connections</strong><small>More skills. More people. A brighter you. <ArrowRight /></small></Link>
        </aside>
      </div>
    </main>
  );
}