"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, BookOpen, CalendarDays, ChevronRight, CircleUserRound, Clock3,
  Home, Menu, MessageCircle, Search, Send, Settings, Shield,
  Sparkles, Star, TrendingUp, Users, X, ArrowRightLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { chatService, matchService, notificationService, sessionService, swapService } from "@/services";
import type { Conversation, LearningSession, MatchResult, SkillSwap, SwapRequest } from "@/types";

const defaultAvatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");

  const handleDashboardSearch = (event: React.FormEvent) => {
    event.preventDefault();
    router.push(dashboardSearch.trim() ? `/explore?q=${encodeURIComponent(dashboardSearch.trim())}` : "/explore");
  };

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.allSettled([
      matchService.getMatches(4),
      swapService.getReceivedRequests(),
      swapService.getMySwaps(),
      sessionService.getSessions(),
      chatService.getConversations(),
      notificationService.getNotifications(),
    ]).then(([matchResult, requestResult, swapResult, sessionResult, conversationResult, notificationResult]) => {
      if (matchResult.status === "fulfilled") setMatches(matchResult.value);
      if (requestResult.status === "fulfilled") setRequests(requestResult.value.filter((request) => request.status === "Pending"));
      if (swapResult.status === "fulfilled") setSwaps(swapResult.value);
      if (sessionResult.status === "fulfilled") setSessions(sessionResult.value.filter((session) => session.status === "Upcoming").slice(0, 2));
      if (conversationResult.status === "fulfilled") setConversations(conversationResult.value.slice(0, 2));
      if (notificationResult.status === "fulfilled") setUnread(notificationResult.value.filter((notification) => !notification.is_read).length);
    });
  }, [authLoading, user]);

  if (authLoading) return <div className="dashboard-loading">Loading your workspace...</div>;

  const displayName = user?.profile?.full_name?.split(" ")[0] || user?.username || "Learner";
  const people = matches.map((match) => ({
    name: match.user.full_name,
    profession: match.user.profession,
    avatar: match.user.avatar_url || defaultAvatar,
    location: [match.user.city, match.user.country].filter(Boolean).join(", "),
    teach: match.teach_matches,
    learn: match.learn_matches[0] || "No learning skill listed",
  }));
  const pendingCount = requests.length;
  const sessionCount = sessions.length;
  const progress = swaps.length
    ? Math.round(swaps.reduce((total, swap) => total + swap.progress_percentage, 0) / swaps.length)
    : null;

  return (
    <div className="dashboard-shell">
      <aside className={`dashboard-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="dashboard-brand"><div><ArrowRightLeft /></div><strong>SkillSwap</strong><button onClick={() => setMenuOpen(false)} className="sidebar-close"><X /></button></div>
        <nav className="dashboard-nav">
          <DashboardNavLink href="/dashboard" icon={Home} label="Home" active />
          <DashboardNavLink href="/explore" icon={Search} label="Explore" />
          <DashboardNavLink href="/matches" icon={Users} label="Matches" />
          <DashboardNavLink href="/requests" icon={Send} label="Requests" badge={pendingCount} />
          <DashboardNavLink href="/chat" icon={MessageCircle} label="Chat" />
          <DashboardNavLink href="/sessions" icon={CalendarDays} label="Sessions" />
          <DashboardNavLink href="/progress" icon={TrendingUp} label="Progress" />
          <DashboardNavLink href="/reviews" icon={Star} label="Reviews" />
          <DashboardNavLink href="/notifications" icon={Bell} label="Notifications" badge={unread || undefined} />
          <DashboardNavLink href="/settings" icon={Settings} label="Settings" />
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar"><button className="dashboard-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><form className="dashboard-search" onSubmit={handleDashboardSearch} role="search"><Search /><input value={dashboardSearch} onChange={(event) => setDashboardSearch(event.target.value)} placeholder="Search for skills, people or topics..." aria-label="Search for skills, people or topics" /><button type="submit" aria-label="Search"><ArrowRightSmall /></button></form><div className="dashboard-user-actions"><Link href="/notifications" className="dashboard-bell" aria-label="Open notifications" title="Notifications"><Bell />{unread > 0 && <i />}{unread > 0 && <b>{unread}</b>}</Link><Link href={`/profile/${user?.username || "me"}`} className="dashboard-user" aria-label="Open profile"><img src={user?.profile?.avatar_url || defaultAvatar} alt="" /><span><strong>Hi, {displayName}!</strong><small>Keep learning ✨</small></span><ChevronRight /></Link></div></header>

        <div className="dashboard-content">
          <section className="dashboard-welcome"><div><p className="dashboard-kicker">Welcome back,</p><h1>{displayName}!</h1><p>Keep learning. Keep sharing. Keep growing.</p><blockquote>“Small skills create big opportunities.”</blockquote></div><div className="welcome-art"><div className="welcome-orb" /><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=85" alt="" /></div></section>

          <section className="dashboard-metrics"><Metric icon={Users} value={String(matches.length)} label="Skill Matches" tone="blue" href="/matches" /><Metric icon={Send} value={pendingCount.toString()} label="Pending Requests" tone="pink" href="/requests" /><Metric icon={CalendarDays} value={sessionCount.toString()} label="Upcoming Sessions" tone="green" href="/sessions" /><Metric icon={TrendingUp} value={progress === null ? "—" : `${progress}%`} label="Learning Progress" tone="violet" href="/progress" /></section>

          <div className="dashboard-grid"><section className="dashboard-section recommended"><SectionHeading title="Recommended for You" subtitle="People who match your interests and skills" href="/explore" />{people.length ? <div className="match-grid">{people.map((person) => <article className="match-card" key={person.name}><div className="match-avatar"><img src={person.avatar} alt="" /><button aria-label={`Save ${person.name}`}><Star /></button></div><h3>{person.name}</h3><p className="match-location"><CircleUserRound /> {person.location || "Location not added"}</p><small>Teaches</small><div className="tag-row">{person.teach.slice(0, 2).map((skill) => <span key={skill}>{skill}</span>)}</div><small>Wants to Learn</small><div className="tag-row"><span className="learn-tag">{person.learn}</span></div><Link href="/explore" className="connect-button">Connect</Link></article>)}</div> : <div className="dashboard-empty-state"><p>No matches are available yet. Start exploring profiles to build your network.</p></div>}</section>
            <aside className="dashboard-right"><ProgressCard progress={progress} /><GoalsCard swaps={swaps} /></aside></div>

          <div className="dashboard-bottom-grid"><section className="dashboard-section"><SectionHeading title="Upcoming Sessions" href="/sessions" />{sessions.length ? <div className="session-list">{sessions.map((session) => <div className="session-row" key={session.id}><div className="session-icon"><BookOpen /></div><div><strong>{session.title}</strong><p>with {session.scheduled_by_name}</p><small><Clock3 /> {new Date(session.date_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {session.duration_minutes} min</small></div><Link href="/sessions">Join</Link></div>)}</div> : <div className="dashboard-empty-state compact"><p>No upcoming sessions yet.</p></div>}</section><section className="dashboard-section messages"><SectionHeading title="Recent Messages" href="/chat" /><div>{conversations.length ? conversations.map((conversation) => <Link href={`/chat/${conversation.id}`} className="message-row" key={conversation.id}><img src={conversation.partner_avatar || defaultAvatar} alt="" /><span><strong>{conversation.partner_name}</strong><small>{conversation.last_message}</small></span><time>{conversation.last_message_time}</time>{conversation.unread_count > 0 && <b>{conversation.unread_count}</b>}</Link>) : <div className="dashboard-empty-state compact"><p>No recent conversations yet.</p></div>}</div></section></div>
        </div>
      </main>
    </div>
  );
}

function DashboardNavLink({ href, icon: Icon, label, badge, active }: { href: string; icon: typeof Home; label: string; badge?: number; active?: boolean }) { return <Link href={href} className={`dashboard-nav-link ${active ? "active" : ""}`}><Icon /><span>{label}</span>{badge ? <b>{badge}</b> : null}</Link>; }
function Metric({ icon: Icon, value, label, tone, href }: { icon: typeof Users; value: string; label: string; tone: string; href: string }) { return <Link href={href} className={`dashboard-metric ${tone}`}><Icon /><span><strong>{value}</strong><small>{label}</small></span><ChevronRight /></Link>; }
function SectionHeading({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) { return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><Link href={href}>View all <ArrowRightSmall /></Link></div>; }
function ProgressCard({ progress }: { progress: number | null }) { return <section className="dashboard-section progress-card"><SectionHeading title="Learning Progress" href="/progress" /><div className="progress-content"><div className="progress-ring" style={{ "--progress": `${(progress ?? 0) * 3.6}deg` } as CSSProperties}><span>{progress === null ? "—" : `${progress}%`}</span></div><div><strong>{progress === null ? "No active exchanges" : "Progress across your swaps"}</strong><p>{progress === null ? "Accept a skill swap to start tracking learning progress." : "Based on the progress recorded for your skill exchanges."}</p></div></div></section>; }
function GoalsCard({ swaps }: { swaps: SkillSwap[] }) { const activeSwaps = swaps.filter((swap) => swap.status === "Active"); return <section className="dashboard-section goals-card"><SectionHeading title="Learning Goals" href="/progress" />{activeSwaps.length ? activeSwaps.slice(0, 3).map((swap) => <div className="goal-row" key={swap.id}><div className="goal-icon blue"><Sparkles /></div><div><strong>Learn {swap.i_learn_skill}</strong><small>With {swap.partner_name}</small><div className="goal-bar"><i style={{ width: `${Math.min(Math.max(swap.progress_percentage, 0), 100)}%` }} /></div></div><b>{swap.progress_percentage}%</b></div>) : <div className="dashboard-empty-state compact"><p>Your accepted skill exchanges will appear here with their recorded learning progress.</p></div>}<Link href={activeSwaps[0] ? `/progress?swap_id=${activeSwaps[0].id}` : "/explore"} className="add-goal">{activeSwaps.length ? "View learning progress" : "Explore skills to learn"}</Link></section>; }
function ArrowRightSmall() { return <ChevronRight className="small-chevron" />; }
