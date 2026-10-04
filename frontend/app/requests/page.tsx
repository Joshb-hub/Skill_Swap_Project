"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, ArrowRightLeft, BookOpen, CalendarDays, Check, CheckCircle2, Clock3, MessageCircle, RefreshCw, Send, Sparkles, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { sessionService, swapService } from "@/services";
import { SwapRequest } from "@/types";
import { formatDate } from "@/lib/utils";

type RequestTab = "Received" | "Sent" | "Accepted" | "Declined";

const requestTabs: RequestTab[] = ["Received", "Sent", "Accepted", "Declined"];

export default function RequestsPage() {
  const { isAuthenticated } = useAuth();
  const [received, setReceived] = useState<SwapRequest[]>([]);
  const [sent, setSent] = useState<SwapRequest[]>([]);
  const [activeSwapCount, setActiveSwapCount] = useState(0);
  const [completedSessionCount, setCompletedSessionCount] = useState(0);
  const [activeTab, setActiveTab] = useState<RequestTab>("Received");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [receivedRequests, sentRequests, swaps, sessions] = await Promise.all([
        swapService.getReceivedRequests(),
        swapService.getSentRequests(),
        swapService.getMySwaps(),
        sessionService.getSessions(),
      ]);
      setReceived(receivedRequests);
      setSent(sentRequests);
      setActiveSwapCount(swaps.filter((swap) => swap.status === "Active").length);
      setCompletedSessionCount(sessions.filter((session) => session.status === "Completed").length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadRequests();
    else setIsLoading(false);
  }, [isAuthenticated]);

  const counts = useMemo(() => ({
    Received: received.filter((request) => request.status === "Pending").length,
    Sent: sent.filter((request) => request.status === "Pending").length,
    Accepted: [...received, ...sent].filter((request) => request.status === "Accepted").length,
    Declined: [...received, ...sent].filter((request) => request.status === "Declined" || request.status === "Cancelled").length,
  }), [received, sent]);

  const visibleRequests = useMemo(() => {
    let list: SwapRequest[];
    if (activeTab === "Received") list = received.filter((request) => request.status === "Pending");
    else if (activeTab === "Sent") list = sent.filter((request) => request.status === "Pending");
    else if (activeTab === "Accepted") list = [...received, ...sent].filter((request) => request.status === "Accepted");
    else list = [...received, ...sent].filter((request) => request.status === "Declined" || request.status === "Cancelled");
    return list.sort((left, right) => (new Date(left.created_at).getTime() - new Date(right.created_at).getTime()) * (sortOrder === "newest" ? -1 : 1));
  }, [activeTab, received, sent, sortOrder]);

  const actOnRequest = async (request: SwapRequest, action: "accept" | "decline" | "cancel") => {
    setActionLoading(request.id);
    setError(null);
    try {
      if (action === "accept") await swapService.acceptRequest(request.id);
      if (action === "decline") await swapService.declineRequest(request.id);
      if (action === "cancel") await swapService.cancelRequest(request.id);
      await loadRequests();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "The request could not be updated.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthenticated) {
    return <div className="request-empty-state"><ArrowRightLeft /><h1>Sign in to manage requests</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;
  }

  const pendingCount = received.filter((request) => request.status === "Pending").length;
  const activeCount = counts.Accepted;

  return (
    <main className="requests-hub-page">
      <div className="requests-hub-layout">
        <section className="requests-hub-main">
          <header className="requests-hub-header"><div><span className="requests-kicker"><Sparkles />Requests & Matches</span><h1>Requests & Matches</h1><p>Manage your skill swap requests and active connections.</p></div><button className="requests-refresh" onClick={loadRequests} title="Refresh requests" aria-label="Refresh requests"><RefreshCw /></button></header>
          <nav className="requests-status-tabs" aria-label="Request status">
            {requestTabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}<span>{counts[tab]}</span></button>)}
          </nav>
          <div className="requests-list-heading"><div><h2>{activeTab} Requests</h2><p>{activeTab === "Received" ? "People who want to skill swap with you." : activeTab === "Sent" ? "Proposals you have sent to other learners." : `${activeTab} skill swap proposals.`}</p></div><label>Sort by<select aria-label="Sort requests" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>
          {error && <div className="request-inline-error"><AlertCircle />{error}</div>}
          {isLoading ? <div className="request-loading" role="status">Loading requests...</div> : visibleRequests.length ? (
            <div className="requests-card-list">
              {visibleRequests.map((request) => {
                const incoming = activeTab === "Received" || (activeTab === "Accepted" && received.some((item) => item.id === request.id)) || (activeTab === "Declined" && received.some((item) => item.id === request.id));
                const name = incoming ? request.sender_name : request.receiver_name;
                const username = incoming ? request.sender_username : request.receiver_username;
                const avatar = incoming ? request.sender_avatar : request.receiver_avatar;
                const pending = request.status === "Pending";
                return (
                  <article className="request-card" key={`${incoming ? "in" : "out"}-${request.id}`}>
                    <div className="request-card-top"><Avatar src={avatar} name={name} size="md" /><div className="request-person"><Link href={`/profile/${username}`}>{name}</Link><span>{[incoming ? "Incoming request" : "Sent proposal", formatDate(request.created_at)].join(" · ")}</span></div><button className="request-card-menu" title="More request options" aria-label="More request options">···</button></div>
                    <div className="request-exchange-intro">{incoming ? "Wants to learn from you" : "You want to learn from them"}</div>
                    <div className="request-exchange-pair"><div className="request-skill-tile teach"><small>{incoming ? "Can teach you" : "You can teach"}</small><strong><BookOpen />{request.offered_skill_name}</strong></div><ArrowRightLeft className="request-exchange-arrow" /><div className="request-skill-tile learn"><small>{incoming ? "You can teach" : "They can teach"}</small><strong><Sparkles />{request.requested_skill_name}</strong></div></div>
                    {request.message && <blockquote className="request-message-quote">“{request.message}”</blockquote>}
                    <footer className="request-card-footer"><Badge variant={request.status === "Accepted" ? "success" : pending ? "warning" : "secondary"}>{request.status}</Badge><div className="request-card-actions">{pending && incoming && <><Button variant="primary" size="sm" isLoading={actionLoading === request.id} onClick={() => actOnRequest(request, "accept")}><Check />Accept</Button><Button variant="outline" size="sm" isLoading={actionLoading === request.id} onClick={() => actOnRequest(request, "decline")}><X />Decline</Button></>}{pending && !incoming && <Button variant="outline" size="sm" isLoading={actionLoading === request.id} onClick={() => actOnRequest(request, "cancel")}><X />Cancel</Button>}{request.status === "Accepted" && <Link href="/chat" className="request-chat-link"><MessageCircle />Open chat</Link>}<Link className="request-view-profile" href={`/profile/${username}`}>View profile <ArrowRight /></Link></div></footer>
                  </article>
                );
              })}
            </div>
          ) : <div className="requests-empty"><span><ArrowRightLeft /></span><h2>No {activeTab.toLowerCase()} requests</h2><p>{activeTab === "Received" ? "New skill swap proposals from other members will appear here." : activeTab === "Sent" ? "Explore the community and propose your first skill exchange." : `There are no ${activeTab.toLowerCase()} requests to show.`}</p>{activeTab === "Sent" && <Link href="/explore"><Button variant="primary" size="sm">Explore people</Button></Link>}</div>}
        </section>
        <aside className="requests-hub-aside">
          <section className="requests-growth-card"><span><Users /></span><div><strong>Your network is growing</strong><p>Respond to requests and start meaningful skill exchanges.</p></div></section>
          <blockquote className="requests-quote">“Learn from anyone, teach everyone.” <span>♡</span></blockquote>
          <section className="requests-tips-card"><h2><Sparkles />Tips for responding</h2><ul><li><Check />Check their profile and skills</li><li><Check />Make sure interests align</li><li><Check />Be clear about your availability</li><li><Check />Discuss details in chat after accepting</li><li><Check />You can decline anytime</li></ul></section>
          <section className="requests-stats-card"><h2><ArrowRightLeft />Your Stats</h2><div><span><Send /><strong>{pendingCount}</strong><small>Pending requests</small></span><span><Users /><strong>{activeSwapCount}</strong><small>Active swaps</small></span><span><Users /><strong>{activeSwapCount}</strong><small>Connections</small></span><span><CalendarDays /><strong>{completedSessionCount}</strong><small>Sessions completed</small></span></div></section>
          <Link className="requests-keep-learning" href="/explore"><span><Sparkles /></span><strong>Small skills, big opportunities</strong><small>Keep learning <ArrowRight /></small></Link>
        </aside>
      </div>
    </main>
  );
}