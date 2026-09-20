"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Review, SkillSwap } from "@/types";
import { reviewService, swapService, safetyService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import {
  Star, MessageSquare, CheckCircle2, AlertCircle,
  Flag, ArrowRightLeft
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ReviewsPage() {
  const searchParams = useSearchParams();
  const initialSwapId = searchParams.get("swap_id") || "";
  const initialPartnerId = searchParams.get("partner_id") || "";

  const { isAuthenticated, user } = useAuth();
  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(!!initialSwapId);

  // Review Form state
  const [swapId, setSwapId] = useState(initialSwapId);
  const [revieweeId, setRevieweeId] = useState(initialPartnerId);
  const [commRating, setCommRating] = useState(5);
  const [teachRating, setTeachRating] = useState(5);
  const [helpRating, setHelpRating] = useState(5);
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Report modal state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState("");
  const [reportCategory, setReportCategory] = useState("Inappropriate Behavior");
  const [reportDesc, setReportDesc] = useState("");

  const fetchData = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const [allSwaps, userRevs] = await Promise.all([
        swapService.getMySwaps(),
        reviewService.getUserReviews(user.id),
      ]);
      setSwaps(allSwaps);
      setMyReviews(userRevs);

      if (!swapId && allSwaps.length > 0) {
        setSwapId(allSwaps[0].id);
        setRevieweeId(allSwaps[0].partner_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user?.id]);

  const handleSwapChange = (newSwapId: string) => {
    setSwapId(newSwapId);
    const selected = swaps.find((s) => s.id === newSwapId);
    if (selected) {
      setRevieweeId(selected.partner_id);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapId || !revieweeId) {
      setError("Please select an active or completed skill swap.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reviewService.submitReview({
        swap_id: swapId,
        reviewee_id: revieweeId,
        communication_rating: commRating,
        teaching_rating: teachRating,
        helpfulness_rating: helpRating,
        overall_rating: overallRating,
        comment: comment.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSuccess(false);
        setComment("");
        fetchData();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId || !reportDesc.trim()) return;

    try {
      await safetyService.submitReport({
        reported_id: reportTargetId,
        category: reportCategory,
        description: reportDesc.trim(),
      });
      alert("Report submitted to moderation team.");
      setIsReportOpen(false);
      setReportDesc("");
    } catch (err: any) {
      alert(err.message || "Failed to submit report");
    }
  };

  const renderStarSelector = (val: number, setVal: (n: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setVal(star)}
          className="p-1 focus:outline-none"
        >
          <Star
            className={`w-5 h-5 ${
              star <= val
                ? "text-amber-500 fill-amber-500"
                : "text-slate-200"
            } hover:text-amber-400 transition-colors`}
          />
        </button>
      ))}
      <span className="ml-2 text-xs font-bold text-slate-700">{val}/5</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Star className="w-7 h-7 text-amber-500 fill-amber-500" />
            Reviews & Community Trust
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build reciprocal trust. Review your partners after sessions and celebrate milestone achievements.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsSubmitModalOpen(true)}
          disabled={swaps.length === 0}
        >
          <Star className="w-3.5 h-3.5 mr-1.5" />
          Leave a Review
        </Button>
      </div>

      {/* Reviews on Current User */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Reviews You Received</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {myReviews.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-8 text-center">
              You haven't received any reviews yet. Complete skill swaps and mentor peers to earn feedback!
            </p>
          ) : (
            myReviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar src={rev.reviewer_avatar} name={rev.reviewer_name} size="md" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.reviewer_name}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(rev.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500 text-sm font-bold">
                    <Star className="w-4 h-4 fill-amber-500 mr-1" />
                    <span>{rev.overall_rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 py-1">
                  <span>Communication: {rev.communication_rating}/5</span>
                  <span>Teaching: {rev.teaching_rating}/5</span>
                  <span>Helpfulness: {rev.helpfulness_rating}/5</span>
                </div>

                {rev.comment && <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Leave Review Modal */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Review Your Skill Exchange Partner"
          description="Rate your mentor or learner to help our community grow safely."
        >
          {success ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Review Submitted!</h4>
              <p className="text-xs text-slate-500">Thank you for contributing to community trust.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Select Skill Swap</label>
                <select
                  value={swapId}
                  onChange={(e) => handleSwapChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {swaps.map((s) => (
                    <option key={s.id} value={s.id}>
                      With {s.partner_name} ({s.i_teach_skill} ↔ {s.i_learn_skill})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating criteria */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Overall Rating</span>
                  {renderStarSelector(overallRating, setOverallRating)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Communication</span>
                  {renderStarSelector(commRating, setCommRating)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Teaching Quality</span>
                  {renderStarSelector(teachRating, setTeachRating)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Helpfulness</span>
                  {renderStarSelector(helpRating, setHelpRating)}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Written Feedback</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What went well? How was the lesson structure? Share encouraging notes..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setReportTargetId(revieweeId);
                    setIsReportOpen(true);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Issue</span>
                </button>

                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsSubmitModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                    Submit Review
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Safety Report Modal */}
      {isReportOpen && (
        <Modal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          title="Submit User Report"
          description="Reports are reviewed confidentially by our trust & safety team."
        >
          <form onSubmit={handleReportUser} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Category</label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
              >
                <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                <option value="Spam or Scam">Spam or Scam</option>
                <option value="Harassment">Harassment</option>
                <option value="Repeated No-Show">Repeated No-Show</option>
                <option value="Inaccurate Skill Representation">Inaccurate Skill Representation</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Incident Details</label>
              <textarea
                rows={3}
                required
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Describe what occurred with as much context as possible..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsReportOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" size="sm">
                Submit Report
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
