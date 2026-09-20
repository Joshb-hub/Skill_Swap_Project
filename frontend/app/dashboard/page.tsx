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
import type { Conversation, LearningSession, MatchResult, SwapRequest } from "@/types";

const demoMatches = [
  { name: "Arjun Mehta", profession: "Data Analyst", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80", location: "Kolkata, India", teach: ["Python", "Data Science"], learn: "UI/UX Design" },
  { name: "Ishita Roy", profession: "Product Designer", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80", location: "Bangalore, India", teach: ["Graphic Design", "Illustration"], learn: "Web Development" },
  { name: "Rohan Singh", profession: "Software Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80", location: "Delhi, India", teach: ["Guitar", "Music Theory"], learn: "Public Speaking" },
  { name: "Ananya Das", profession: "Home Chef", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=80", location: "Mumbai, India", teach: ["Cooking", "Baking"], learn: "Photography" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
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
      sessionService.getSessions(),
      chatService.getConversations(),
      notificationService.getNotifications(),
    ]).then(([matchResult, requestResult, sessionResult, conversationResult, notificationResult]) => {
      if (matchResult.status === "fulfilled") setMatches(matchResult.value);
      if (requestResult.status === "fulfilled") setRequests(requestResult.value.filter((request) => request.status === "Pending"));
      if (sessionResult.status === "fulfilled") setSessions(sessionResult.value.filter((session) => session.status === "Upcoming").slice(0, 2));
      if (conversationResult.status === "fulfilled") setConversations(conversationResult.value.slice(0, 2));
      if (notificationResult.status === "fulfilled") setUnread(notificationResult.value.filter((notification) => !notification.is_read).length);
    });
  }, [authLoading, user]);

  if (authLoading) return <div className="dashboard-loading">Loading your workspace...</div>;

  const displayName = user?.profile?.full_name?.split(" ")[0] || user?.username || "Learner";
  const people = matches.length ? matches.map((match) => ({ name: match.user.full_name, profession: match.user.profession, avatar: match.user.avatar_url || demoMatches[0].avatar, location: [match.user.city, match.user.country].filter(Boolean).join(", "), teach: match.teach_matches, learn: match.learn_matches[0] || "A new skill" })) : demoMatches;
  const pendingCount = requests.length || 3;
  const sessionCount = sessions.length || 2;
  const progress = 68;

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
          <DashboardNavLink href="/notifications" icon={Bell} label="Notifications" badge={unread || 5} />
          <DashboardNavLink href="/settings" icon={Settings} label="Settings" />
        </nav>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar"><button className="dashboard-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button><form className="dashboard-search" onSubmit={handleDashboardSearch} role="search"><Search /><input value={dashboardSearch} onChange={(event) => setDashboardSearch(event.target.value)} placeholder="Search for skills, people or topics..." aria-label="Search for skills, people or topics" /><button type="submit" aria-label="Search"><ArrowRightSmall /></button></form><div className="dashboard-user-actions"><Link href="/notifications" className="dashboard-bell" aria-label="Open notifications" title="Notifications"><Bell />{unread > 0 && <i />}{unread > 0 && <b>{unread}</b>}</Link><Link href={`/profile/${user?.username || "me"}`} className="dashboard-user" aria-label="Open profile"><img src={user?.profile?.avatar_url || demoMatches[1].avatar} alt="" /><span><strong>Hi, {displayName}!</strong><small>Keep learning ✨</small></span><ChevronRight /></Link></div></header>

        <div className="dashboard-content">
          <section className="dashboard-welcome"><div><p className="dashboard-kicker">Welcome back,</p><h1>{displayName}!</h1><p>Keep learning. Keep sharing. Keep growing.</p><blockquote>“Small skills create big opportunities.”</blockquote></div><div className="welcome-art"><div className="welcome-orb" /><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=420&q=85" alt="" /></div></section>

          <section className="dashboard-metrics"><Metric icon={Users} value="12" label="Skill Matches" tone="blue" href="/matches" /><Metric icon={Send} value={pendingCount.toString()} label="Pending Requests" tone="pink" href="/requests" /><Metric icon={CalendarDays} value={sessionCount.toString()} label="Upcoming Sessions" tone="green" href="/sessions" /><Metric icon={TrendingUp} value={`${progress}%`} label="Learning Progress" tone="violet" href="/progress" /></section>

          <div className="dashboard-grid"><section className="dashboard-section recommended"><SectionHeading title="Recommended for You" subtitle="People who match your interests and skills" href="/explore" /><div className="match-grid">{people.map((person) => <article className="match-card" key={person.name}><div className="match-avatar"><img src={person.avatar} alt="" /><button aria-label={`Save ${person.name}`}><Star /></button></div><h3>{person.name}</h3><p className="match-location"><CircleUserRound /> {person.location || "India"}</p><small>Teaches</small><div className="tag-row">{person.teach.slice(0, 2).map((skill) => <span key={skill}>{skill}</span>)}</div><small>Wants to Learn</small><div className="tag-row"><span className="learn-tag">{person.learn}</span></div><Link href="/explore" className="connect-button">Connect</Link></article>)}</div></section>
            <aside className="dashboard-right"><ProgressCard progress={progress} /><GoalsCard /></aside></div>

          <div className="dashboard-bottom-grid"><section className="dashboard-section"><SectionHeading title="Upcoming Sessions" href="/sessions" /><div className="session-list">{(sessions.length ? sessions : [{ id: "demo-1", title: "Python for Data Analysis", skill_name: "Python", scheduled_by_name: "Arjun Mehta", date_time: "2026-09-18T18:00:00", duration_minutes: 60 } as LearningSession, { id: "demo-2", title: "Cooking Basics", skill_name: "Cooking", scheduled_by_name: "Ananya Das", date_time: "2026-09-18T17:00:00", duration_minutes: 60 } as LearningSession]).map((session) => <div className="session-row" key={session.id}><div className="session-icon"><BookOpen /></div><div><strong>{session.title}</strong><p>with {session.scheduled_by_name}</p><small><Clock3 /> {new Date(session.date_time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {session.duration_minutes} min</small></div><Link href="/sessions">Join</Link></div>)}</div></section><section className="dashboard-section messages"><SectionHeading title="Recent Messages" href="/chat" /><div>{(conversations.length ? conversations : [{ id: "demo-3", partner_name: "Ishita Roy", partner_avatar: demoMatches[1].avatar, last_message: "That sounds great! Let's schedule a session...", last_message_time: "10:24 AM", unread_count: 2 }, { id: "demo-4", partner_name: "Rohan Singh", partner_avatar: demoMatches[2].avatar, last_message: "Sure! I can help you with that. 😊", last_message_time: "Yesterday", unread_count: 0 }] as Conversation[]).map((conversation) => <Link href={`/chat/${conversation.id}`} className="message-row" key={conversation.id}><img src={conversation.partner_avatar || demoMatches[0].avatar} alt="" /><span><strong>{conversation.partner_name}</strong><small>{conversation.last_message}</small></span><time>{conversation.last_message_time}</time>{conversation.unread_count > 0 && <b>{conversation.unread_count}</b>}</Link>)}</div></section></div>
        </div>
      </main>
    </div>
  );
}

function DashboardNavLink({ href, icon: Icon, label, badge, active }: { href: string; icon: typeof Home; label: string; badge?: number; active?: boolean }) { return <Link href={href} className={`dashboard-nav-link ${active ? "active" : ""}`}><Icon /><span>{label}</span>{badge ? <b>{badge}</b> : null}</Link>; }
function Metric({ icon: Icon, value, label, tone, href }: { icon: typeof Users; value: string; label: string; tone: string; href: string }) { return <Link href={href} className={`dashboard-metric ${tone}`}><Icon /><span><strong>{value}</strong><small>{label}</small></span><ChevronRight /></Link>; }
function SectionHeading({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) { return <div className="section-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><Link href={href}>View all <ArrowRightSmall /></Link></div>; }
function ProgressCard({ progress }: { progress: number }) { return <section className="dashboard-section progress-card"><SectionHeading title="Your Learning Progress" href="/progress" /><div className="progress-content"><div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as CSSProperties}><span>{progress}%</span></div><div><strong>You&apos;re doing great!</strong><p>Keep going to reach your goals.</p></div></div></section>; }
function GoalsCard() { return <section className="dashboard-section goals-card"><SectionHeading title="Your Goals" href="/progress" /><Goal label="Learn UI/UX Design" level="Intermediate level" value="40%" width="40%" color="blue" /><Goal label="Improve Public Speaking" level="Track your progress" value="20%" width="20%" color="pink" /><Goal label="Learn Photography" level="Beginner level" value="10%" width="10%" color="violet" /><Link href="/progress" className="add-goal">+ Add a New Goal</Link></section>; }
function Goal({ label, level, value, width, color }: { label: string; level: string; value: string; width: string; color: string }) { return <div className="goal-row"><div className={`goal-icon ${color}`}><Sparkles /></div><div><strong>{label}</strong><small>{level}</small><div className="goal-bar"><i style={{ width }} /></div></div><b>{value}</b></div>; }
function ArrowRightSmall() { return <ChevronRight className="small-chevron" />; }
