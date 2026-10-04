"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, ArrowRightLeft, Check, CheckCircle2, Clock3, Flag, MessageCircle, Pencil, Star, Users } from "lucide-react";
import { Review, SkillSwap } from "@/types";
import { reviewService, safetyService, swapService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";

type ReviewTab = "Received" | "Given" | "Pending" | "All Reviews";
const reviewTabs: ReviewTab[] = ["Received", "Given", "Pending", "All Reviews"];

export default function ReviewsPage() {
  const { isAuthenticated, user } = useAuth();
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [received, setReceived] = useState<Review[]>([]);
  const [given, setGiven] = useState<Review[]>([]);
  const [tab, setTab] = useState<ReviewTab>("Received");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [swapId, setSwapId] = useState("");
  const [revieweeId, setRevieweeId] = useState("");
  const [commRating, setCommRating] = useState(5);
  const [teachRating, setTeachRating] = useState(5);
  const [helpRating, setHelpRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("Inappropriate Behavior");
  const [reportDesc, setReportDesc] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSwapId = params.get("swap_id") || "";
    const initialPartnerId = params.get("partner_id") || "";
    if (initialSwapId) {
      setSwapId(initialSwapId);
      setRevieweeId(initialPartnerId);
      setSubmitOpen(true);
    }
  }, []);

  const loadData = async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    setError(null);
    try {
      const [swapList, receivedList, givenList] = await Promise.all([
        swapService.getMySwaps(),
        reviewService.getUserReviews(user.id),
        reviewService.getReviewsGiven(),
      ]);
      setSwaps(swapList);
      setReceived(receivedList);
      setGiven(givenList);
      const alreadyReviewed = new Set(givenList.map((review) => review.swap_id));
      const eligible = swapList.filter((swap) => swap.status === "Completed" && !alreadyReviewed.has(swap.id));
      if (!swapId && eligible.length) {
        setSwapId(eligible[0].id);
        setRevieweeId(eligible[0].partner_id);
      }
      if (swapId && !success && !eligible.some((swap) => swap.id === swapId)) {
        setSubmitOpen(false);
        setError("Reviews can be submitted once per completed skill swap.");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) void loadData();
    else setLoading(false);
  }, [isAuthenticated, user?.id]);

  const reviewedSwapIds = useMemo(() => new Set(given.map((review) => review.swap_id)), [given]);
  const pendingSwaps = useMemo(() => swaps.filter((swap) => swap.status === "Completed" && !reviewedSwapIds.has(swap.id)), [swaps, reviewedSwapIds]);
  const swapById = useMemo(() => new Map(swaps.map((swap) => [swap.id, swap])), [swaps]);
  const average = received.length ? received.reduce((total, review) => total + review.overall_rating, 0) / received.length : null;
  const stars = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: received.filter((review) => Math.round(review.overall_rating) === rating).length }));
  const counts: Record<ReviewTab, number> = { Received: received.length, Given: given.length, Pending: pendingSwaps.length, "All Reviews": received.length + given.length };

  const selectSwap = (nextSwapId: string) => {
    setSwapId(nextSwapId);
    setRevieweeId(swaps.find((swap) => swap.id === nextSwapId)?.partner_id || "");
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!swapId || !revieweeId) return;
    setSubmitting(true);
    setError(null);
    try {
      await reviewService.submitReview({ swap_id: swapId, reviewee_id: revieweeId, communication_rating: commRating, teaching_rating: teachRating, helpfulness_rating: helpRating, overall_rating: overallRating, comment: comment.trim() || undefined });
      setSuccess(true);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!revieweeId || !reportDesc.trim()) return;
    try {
      await safetyService.submitReport({ reported_id: revieweeId, category: reportCategory, description: reportDesc.trim() });
      setReportOpen(false);
      setReportDesc("");
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "Failed to submit report.");
    }
  };

  const openReview = (swap: SkillSwap) => {
    setSwapId(swap.id);
    setRevieweeId(swap.partner_id);
    setSuccess(false);
    setSubmitOpen(true);
  };

  const visibleReviews = tab === "Received" ? received : tab === "Given" ? given : [...received, ...given].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!isAuthenticated) return <div className="reviews-dashboard-empty"><Star /><h1>Sign in to view reviews</h1><Link href="/login"><Button variant="primary">Sign in</Button></Link></div>;

  return (
    <main className="reviews-dashboard-page">
      <div className="reviews-dashboard-layout">
        <section className="reviews-dashboard-main">
          <header className="reviews-dashboard-header"><div><h1>Reviews</h1><p>See what others are saying and share your own experience.</p></div><span className="reviews-header-note">Real people, real growth <span>♡</span></span></header>
          <nav className="reviews-tabs" aria-label="Review categories">{reviewTabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}<span>{counts[item]}</span></button>)}</nav>
          {error && <div className="reviews-inline-error"><AlertCircle />{error}</div>}
          <div className="reviews-section-title"><h2>{tab === "Pending" ? "Reviews to Give" : tab === "All Reviews" ? "All Reviews" : `Reviews You ${tab}`}</h2><p>{tab === "Received" ? "Feedback from people you’ve skill swapped with." : tab === "Given" ? "Feedback you have shared with your exchange partners." : tab === "Pending" ? "Completed swaps that still need your feedback." : "Your full review history in the community."}</p></div>
          {loading ? <div className="reviews-loading" role="status">Loading reviews...</div> : tab === "Pending" ? pendingSwaps.length ? <div className="pending-review-list">{pendingSwaps.map((swap) => <article className="pending-review-card" key={swap.id}><Avatar src={swap.partner_avatar} name={swap.partner_name} size="md" /><div><strong>{swap.partner_name}</strong><p>{swap.i_teach_skill} ↔ {swap.i_learn_skill}</p></div><Button size="sm" variant="primary" onClick={() => openReview(swap)}><Pencil />Write a Review <ArrowRight /></Button></article>)}</div> : <div className="reviews-empty"><CheckCircle2 /><h3>You’re all caught up</h3><p>There are no completed swaps waiting for a review.</p></div> : visibleReviews.length ? <div className="review-card-list">{visibleReviews.map((review) => {
            const swap = swapById.get(review.swap_id);
            const isGiven = review.reviewer_id === user?.id;
            const personName = isGiven ? swap?.partner_name || "Exchange partner" : review.reviewer_name;
            const personAvatar = isGiven ? swap?.partner_avatar : review.reviewer_avatar;
            return <article className="community-review-card" key={review.id}><div className="review-person-column"><Avatar src={personAvatar} name={personName} size="md" /><div><Link href={isGiven && swap ? `/profile/${swap.partner_username}` : `/profile/${swap?.partner_username || ""}`}>{personName}</Link><small>{formatDate(review.created_at)}</small></div></div><div className="review-main-copy"><div className="review-exchange-line"><span>{isGiven ? swap?.i_learn_skill || "Skill exchange" : swap?.i_teach_skill || "Skill exchange"}</span><ArrowRightLeft /><span>{isGiven ? swap?.i_teach_skill || "Skill exchange" : swap?.i_learn_skill || "Skill exchange"}</span></div><div className="review-rating-line"><span className="review-stars" aria-label={`${review.overall_rating} out of 5`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={star <= Math.round(review.overall_rating) ? "filled" : ""} />)}</span><strong>{review.overall_rating.toFixed(1)}</strong></div>{review.comment && <p className="review-comment">“{review.comment}”</p>}<div className="review-criteria"><span>Communication {review.communication_rating}/5</span><span>Teaching {review.teaching_rating}/5</span><span>Preparedness {review.helpfulness_rating}/5</span></div></div><div className="review-card-side"><span>{formatDate(review.created_at)}</span>{swap && <Link href={`/profile/${swap.partner_username}`}>View Profile</Link>}</div></article>;
          })}</div> : <div className="reviews-empty"><Star /><h3>No {tab.toLowerCase()} reviews yet</h3><p>{tab === "Received" ? "Reviews from completed exchanges will appear here." : "After a completed swap, your submitted reviews will appear here."}</p></div>}
        </section>

        <aside className="reviews-dashboard-aside">
          <section className="review-summary-card"><h2><Star />Your Review Summary</h2><div className="review-summary-top"><div><strong>{average === null ? "—" : `${average.toFixed(1)} / 5`}</strong><span>Average rating</span></div><div><span><Users /><b>{received.length}</b>Reviews received</span><span><MessageCircle /><b>{given.length}</b>Reviews given</span></div></div><h3>Rating Breakdown</h3><div className="review-rating-breakdown">{stars.map(({ rating, count }) => <div key={rating}><span>{rating} star{rating === 1 ? "" : "s"}</span><i><b style={{ width: received.length ? `${(count / received.length) * 100}%` : "0%" }} /></i><strong>{received.length ? Math.round((count / received.length) * 100) : 0}%</strong></div>)}</div></section>
          <section className="pending-review-summary"><div><Clock3 /><span><strong>{pendingSwaps.length}</strong><small>Review{pendingSwaps.length === 1 ? "" : "s"} to give</small></span></div>{pendingSwaps[0] && <button onClick={() => openReview(pendingSwaps[0])}>Write a Review <ArrowRight /></button>}</section>
          <section className="share-review-card"><div><Pencil /><span><strong>Share your experience</strong><small>Help others by leaving feedback after a session.</small></span></div><button onClick={() => pendingSwaps[0] && openReview(pendingSwaps[0])} disabled={!pendingSwaps.length}>Write a Review <ArrowRight /></button></section>
          <div className="reviews-kind-words"><span>Kind words create brighter learners</span><i /><i /><i /></div>
          <p className="reviews-aside-caption">A supportive community for a better tomorrow.</p>
        </aside>
      </div>

      {submitOpen && <Modal isOpen={submitOpen} onClose={() => { setSubmitOpen(false); setSuccess(false); }} title="Review your skill exchange partner" description="Rate your experience to help the community build trust.">{success ? <div className="review-submit-success"><CheckCircle2 /><h3>Review submitted</h3><p>Thanks for helping your community grow.</p><Button variant="primary" size="sm" onClick={() => { setSubmitOpen(false); setSuccess(false); }}>Done</Button></div> : <form className="review-submit-form" onSubmit={submitReview}>{error && <p className="reviews-inline-error"><AlertCircle />{error}</p>}<label>Select completed swap<select value={swapId} onChange={(event) => { const selected = swaps.find((item) => item.id === event.target.value); setSwapId(event.target.value); setRevieweeId(selected?.partner_id || ""); }} required>{pendingSwaps.map((swap) => <option key={swap.id} value={swap.id}>With {swap.partner_name} ({swap.i_teach_skill} ↔ {swap.i_learn_skill})</option>)}</select></label>{[["Overall rating", overallRating, setOverallRating], ["Communication", commRating, setCommRating], ["Teaching quality", teachRating, setTeachRating], ["Helpfulness", helpRating, setHelpRating]].map(([label, value, setter]) => <div className="review-rating-input" key={label as string}><span>{label as string}</span><div>{[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${label} ${rating} stars`} onClick={() => (setter as (rating: number) => void)(rating)}><Star className={rating <= (value as number) ? "filled" : ""} /></button>)}</div></div>)}<label>Written feedback<textarea rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="What went well? Share helpful, constructive feedback." /></label><footer><button type="button" className="review-report-link" onClick={() => setReportOpen(true)}><Flag />Report issue</button><Button type="submit" variant="primary" size="sm" isLoading={submitting} disabled={!pendingSwaps.length}>Submit Review</Button></footer></form>}</Modal>}
      {reportOpen && <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Submit user report" description="Reports are reviewed confidentially by the trust and safety team."><form className="review-submit-form" onSubmit={submitReport}><label>Category<select value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}><option>Inappropriate Behavior</option><option>Spam or Scam</option><option>Harassment</option><option>Repeated No-Show</option><option>Inaccurate Skill Representation</option><option>Other</option></select></label><label>Incident details<textarea rows={4} required value={reportDesc} onChange={(event) => setReportDesc(event.target.value)} /></label><footer><Button type="button" variant="outline" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm">Submit report</Button></footer></form></Modal>}
    </main>
  );
}