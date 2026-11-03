"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Heart,
  MapPin,
  MoreVertical,
  Pencil,
  Target,
  TrendingUp,
  Youtube,
} from "lucide-react";

import { LearningProgress, SkillSwap } from "@/types";
import { progressService, swapService } from "@/services";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const demoMilestones = [
  {
    title: "Understand the basics of UI/UX",
    description: "Learn key terms, principles and design thinking.",
    date: "Aug 10, 2026",
    status: "Completed",
    type: "completed",
  },
  {
    title: "Learn Figma basics",
    description: "Explore interface, tools and create simple designs.",
    date: "Aug 28, 2026",
    status: "Completed",
    type: "completed",
  },
  {
    title: "Design a complete UI project",
    description: "Create a full app or website design from scratch.",
    date: "In Progress",
    status: "65%",
    type: "progress",
  },
  {
    title: "Build a portfolio with 3–5 projects",
    description: "Showcase your best work.",
    date: "Not Started",
    status: "Not Started",
    type: "pending",
  },
  {
    title: "Get feedback from experienced designers",
    description: "Improve your work through peer review.",
    date: "Not Started",
    status: "Not Started",
    type: "pending",
  },
  {
    title: "Reach intermediate level",
    description: "Be confident in real-world UI/UX projects.",
    date: "Not Started",
    status: "Not Started",
    type: "pending",
  },
];

const demoSessions = [
  {
    title: "Figma Basics",
    date: "Aug 12, 2026 • 5:00 PM",
    status: "Completed",
    type: "completed",
  },
  {
    title: "Design Principles",
    date: "Aug 20, 2026 • 6:00 PM",
    status: "Completed",
    type: "completed",
  },
  {
    title: "User Research Basics",
    date: "Aug 28, 2026 • 5:00 PM",
    status: "Completed",
    type: "completed",
  },
  {
    title: "Wireframing & Prototyping",
    date: "Sep 5, 2026 • 6:00 PM",
    status: "Attended",
    type: "attended",
  },
  {
    title: "Designing a Landing Page",
    date: "Sep 12, 2026 • 5:00 PM",
    status: "Upcoming",
    type: "upcoming",
  },
];

export default function ProgressDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600">Loading progress...</div>}>
      <ProgressDetailPageContent />
    </Suspense>
  );
}

function ProgressDetailPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const progressId = String(params.progressId || "");
  const swapIdParam = searchParams.get("swap_id") || "";

  const { isAuthenticated } = useAuth();

  const [swaps, setSwaps] = useState<SkillSwap[]>([]);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [selectedSwapId, setSelectedSwapId] = useState(swapIdParam);
  const [isLoading, setIsLoading] = useState(true);

  /* Add Milestone */
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [targetProgressId, setTargetProgressId] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProgress = async () => {
    setIsLoading(true);

    try {
      const allSwaps = await swapService.getMySwaps();

      setSwaps(allSwaps);

      if (swapIdParam) {
        const records = await progressService.getSwapProgress(swapIdParam);

        setSelectedSwapId(swapIdParam);

        const matching =
          records.find((record) => record.id === progressId) ||
          records[0] ||
          null;

        setProgress(matching);
        return;
      }

      let foundProgress: LearningProgress | null = null;
      let foundSwapId = "";

      for (const swap of allSwaps) {
        try {
          const records = await progressService.getSwapProgress(swap.id);

          const matching = records.find(
            (record) => record.id === progressId
          );

          if (matching) {
            foundProgress = matching;
            foundSwapId = swap.id;
            break;
          }
        } catch (error) {
          console.error(
            `Failed to load progress for swap ${swap.id}:`,
            error
          );
        }
      }

      setSelectedSwapId(foundSwapId);
      setProgress(foundProgress);
    } catch (error) {
      console.error("Failed to load progress:", error);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgress();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, progressId, swapIdParam]);

  const handleToggleMilestone = async (milestoneId: string) => {
    try {
      await progressService.toggleMilestone(milestoneId);
      await fetchProgress();
    } catch (error) {
      console.error("Failed to update milestone:", error);
      alert("Failed to update milestone status.");
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMilestoneTitle.trim() || !targetProgressId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await progressService.addMilestone(targetProgressId, {
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim() || undefined,
        order: 99,
      });

      setIsAddMilestoneOpen(false);
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");

      await fetchProgress();
    } catch (error: any) {
      alert(error.message || "Failed to add milestone");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="goal-detail-empty">
        <TrendingUp />
        <h2>Sign in to track learning milestones</h2>

        <p>
          You need to be signed in to view your learning goals and
          milestones.
        </p>

        <Link href="/login">
          <Button variant="primary">Sign In</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <main className="goal-detail-page">
        <div className="goal-detail-loading">
          Loading your learning goal...
        </div>
      </main>
    );
  }

  const currentSwap = swaps.find(
    (swap) => swap.id === selectedSwapId
  );

  /*
   * Real data is preferred whenever available.
   * The fallback values reproduce the reference design until
   * the account has real learning-goal data.
   */
  const progressPercentage = Math.min(
    Math.max(progress?.progress_percentage ?? 65, 0),
    100
  );

  const skillName = progress?.skill_name || "UI/UX Design";
  const targetLevel = progress?.target_level || "Intermediate";

  const partnerName =
    currentSwap?.partner_name || "Priya Sharma";

  const partnerLocation = "Kolkata, India";

  const milestones =
    progress && progress.milestones.length > 0
      ? progress.milestones.map((milestone) => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description || "",
          date:
            milestone.status === "Completed"
              ? "Completed"
              : milestone.status === "In Progress"
              ? "In Progress"
              : "Not Started",
          status:
            milestone.status === "Completed"
              ? "Completed"
              : milestone.status === "In Progress"
              ? `${progressPercentage}%`
              : "Not Started",
          type:
            milestone.status === "Completed"
              ? "completed"
              : milestone.status === "In Progress"
              ? "progress"
              : "pending",
        }))
      : demoMilestones.map((milestone, index) => ({
          ...milestone,
          id: `demo-${index}`,
        }));

  return (
    <main className="goal-detail-page">
      <div className="goal-detail-layout">
        {/* =========================================================
            HEADER
        ========================================================= */}

        <section className="goal-detail-header">
          <div>
            <Link
              href="/progress"
              className="goal-back-link"
            >
              <ArrowLeft size={15} />
              Back to Goals
            </Link>

            <div className="goal-title-row">
              <Target className="goal-title-icon" />

              <div>
                <h1>Learn {skillName}</h1>

                <p>
                  Turn ideas into beautiful and user-friendly
                  digital experiences.
                </p>
              </div>
            </div>
          </div>

          <div className="goal-header-actions">
            <button
              type="button"
              className="goal-edit-button"
            >
              <Pencil size={14} />
              Edit Goal
            </button>

            <div className="goal-header-quote">
              <span>
                “Progress
                <br />
                Not Perfection”
              </span>

              <Heart
                size={21}
                fill="currentColor"
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            TOP OVERVIEW
        ========================================================= */}

        <section className="goal-overview-grid">
          {/* OVERALL PROGRESS */}

          <article className="goal-panel goal-progress-panel">
            <h2>Overall Progress</h2>

            <div className="goal-progress-body">
              <div
                className="goal-progress-ring"
                style={
                  {
                    "--progress": `${progressPercentage * 3.6}deg`,
                  } as React.CSSProperties
                }
              >
                <div>
                  <strong>{progressPercentage}%</strong>
                  <span>Complete</span>
                </div>
              </div>

              <div className="goal-progress-details">
                <div>
                  <span>Current Level</span>
                  <strong>Beginner</strong>
                </div>

                <div>
                  <span>Target Level</span>
                  <strong>{targetLevel}</strong>
                </div>

                <div>
                  <span>Start Date</span>
                  <strong>Aug 1, 2026</strong>
                </div>

                <div>
                  <span>Target Date</span>
                  <strong>Dec 31, 2026</strong>
                </div>

                <div>
                  <span>Time Invested</span>
                  <strong>12 hours</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="goal-primary-button"
            >
              Update Progress
            </button>
          </article>

          {/* SKILL LEVEL JOURNEY */}

          <article className="goal-panel skill-journey-panel">
            <div className="goal-panel-title-row">
              <h2>Skill Level Journey</h2>
            </div>

            <div className="journey-chart">
              <div className="journey-y-axis">
                <span>Advanced</span>
                <span>Intermediate</span>
                <span>Beginner</span>
                <span>Novice</span>
              </div>

              <div className="journey-chart-area">
                <svg
                  viewBox="0 0 500 230"
                  preserveAspectRatio="none"
                  className="journey-svg"
                >
                  <defs>
                    <linearGradient
                      id="goalJourneyGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#cfc6ff"
                        stopOpacity="0.65"
                      />

                      <stop
                        offset="100%"
                        stopColor="#f1efff"
                        stopOpacity="0.25"
                      />
                    </linearGradient>
                  </defs>

                  <path
                    d="M15 190 L105 165 L195 140 L285 110 L375 90 L475 50 L475 205 L15 205 Z"
                    fill="url(#goalJourneyGradient)"
                  />

                  <polyline
                    points="15,190 105,165 195,140 285,110 375,90 475,50"
                    fill="none"
                    stroke="#6950df"
                    strokeWidth="3"
                  />

                  {[
                    [15, 190],
                    [105, 165],
                    [195, 140],
                    [285, 110],
                    [375, 90],
                    [475, 50],
                  ].map(([cx, cy], index) => (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r="5"
                      fill="#6950df"
                    />
                  ))}

                  <line
                    x1="285"
                    y1="110"
                    x2="285"
                    y2="70"
                    stroke="#6950df"
                    strokeDasharray="4 4"
                  />
                </svg>

                <div className="journey-current">
                  <span>You are here</span>
                  <strong>{progressPercentage}%</strong>
                </div>

                <div className="journey-months">
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>
              </div>
            </div>

            <div className="journey-legend">
              <span>
                <i className="legend-progress" />
                Your Progress
              </span>

              <span>
                <i className="legend-target" />
                Target Path
              </span>
            </div>
          </article>
        </section>

        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}

        <section className="goal-detail-content-grid">
          {/* MILESTONES */}

          <article className="goal-panel milestones-panel">
            <div className="goal-section-heading">
              <div>
                <h2>Milestones</h2>

                <p>
                  Track your progress with small, achievable
                  steps.
                </p>
              </div>

              <button
                type="button"
                className="goal-add-milestone-button"
                onClick={() => {
                  if (progress?.id) {
                    setTargetProgressId(progress.id);
                    setIsAddMilestoneOpen(true);
                  }
                }}
              >
                + Add Milestone
              </button>
            </div>

            <div className="goal-milestones">
              {milestones.map((milestone, index) => {
                const isCompleted =
                  milestone.type === "completed";

                const isProgress =
                  milestone.type === "progress";

                const isRealMilestone =
                  !String(milestone.id).startsWith("demo-");

                return (
                  <div
                    key={milestone.id}
                    className={`goal-milestone-row ${milestone.type}`}
                    onClick={() => {
                      if (isRealMilestone) {
                        handleToggleMilestone(
                          String(milestone.id)
                        );
                      }
                    }}
                  >
                    <div className="goal-milestone-marker">
                      {isCompleted ? (
                        <CheckCircle2 className="completed-icon" />
                      ) : isProgress ? (
                        <span className="progress-marker" />
                      ) : (
                        <Circle className="pending-icon" />
                      )}

                      {index !== milestones.length - 1 && (
                        <span className="goal-milestone-line" />
                      )}
                    </div>

                    <div className="goal-milestone-content">
                      <div className="goal-milestone-main">
                        <div>
                          <h3>{milestone.title}</h3>

                          {milestone.description && (
                            <p>{milestone.description}</p>
                          )}
                        </div>

                        <span className="goal-milestone-date">
                          {milestone.date}
                        </span>
                      </div>

                      <div className="goal-milestone-bottom">
                        <span
                          className={`goal-milestone-status ${milestone.type}`}
                        >
                          {milestone.status}
                        </span>

                        <MoreVertical size={15} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          {/* SESSIONS */}

          <article className="goal-panel sessions-panel">
            <div className="goal-section-heading">
              <div>
                <h2>
                  Sessions Contributing to This Goal
                </h2>

                <p>
                  These sessions are helping you reach your
                  goal.
                </p>
              </div>
            </div>

            <div className="goal-session-list">
              {demoSessions.map((session) => (
                <div
                  className="goal-session-row"
                  key={session.title}
                >
                  <div className="goal-session-icon">
                    <CalendarDays size={15} />
                  </div>

                  <div className="goal-session-info">
                    <strong>{session.title}</strong>
                    <span>{session.date}</span>
                  </div>

                  <span
                    className={`goal-session-status ${session.type}`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/sessions"
              className="goal-outline-button"
            >
              View All Sessions
              <ArrowRight size={14} />
            </Link>
          </article>

          {/* =====================================================
              RIGHT SIDEBAR
          ===================================================== */}

          <aside className="goal-detail-aside">
            {/* LEARNING PARTNER */}

            <article className="goal-side-card">
              <h2>Learning Partner</h2>

              <div className="learning-partner">
                <div className="partner-avatar">
                  PS
                </div>

                <div className="partner-info">
                  <div className="partner-name-row">
                    <strong>{partnerName}</strong>

                    <span className="partner-active">
                      ● Active
                    </span>
                  </div>

                  <span>
                    <MapPin size={13} />
                    {partnerLocation}
                  </span>

                  <small>
                    Teaches you: {skillName}
                  </small>
                </div>
              </div>

              <Link
                href="/profile/priya-sharma"
                className="goal-outline-button"
              >
                View Profile
              </Link>
            </article>

            {/* GOAL TIMELINE */}

            <article className="goal-side-card">
              <h2>
                <CalendarDays size={18} />
                Goal Timeline
              </h2>

              <div className="goal-timeline">
                <div className="timeline-date">
                  <CalendarDays size={15} />

                  <span>
                    Aug 1, 2026 – Dec 31, 2026
                    <strong>4 months left</strong>
                  </span>
                </div>

                <div className="timeline-bar">
                  <span
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </article>

            {/* MOTIVATION */}

            <article className="goal-detail-quote">
              <span>
                “A new skill
                <br />
                is a new possibility.”
              </span>

              <Heart
                size={22}
                fill="currentColor"
              />
            </article>

            {/* RESOURCES */}

            <article className="goal-side-card resources-card">
              <h2>
                <BookOpen size={18} />
                Resources
              </h2>

              <div className="resource-list">
                <a
                  href="#"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  <div>
                    <span className="resource-icon">
                      <BookOpen size={14} />
                    </span>

                    <span>
                      Figma Official Guide
                    </span>
                  </div>

                  <ExternalLink size={14} />
                </a>

                <a
                  href="#"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  <div>
                    <span className="resource-icon pdf">
                      <FileText size={14} />
                    </span>

                    <span>
                      UI/UX Best Practices
                      <small>PDF</small>
                    </span>
                  </div>

                  <ExternalLink size={14} />
                </a>

                <a
                  href="#"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  <div>
                    <span className="resource-icon">
                      <BookOpen size={14} />
                    </span>

                    <span>
                      Inspiring UI Portfolios
                      <small>
                        External Link
                      </small>
                    </span>
                  </div>

                  <ExternalLink size={14} />
                </a>

                <a
                  href="#"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  <div>
                    <span className="resource-icon youtube">
                      <Youtube size={14} />
                    </span>

                    <span>
                      Design Thinking Basics
                      <small>YouTube</small>
                    </span>
                  </div>

                  <ExternalLink size={14} />
                </a>
              </div>

              <button
                type="button"
                className="goal-outline-button"
              >
                + Add Resource
              </button>
            </article>
          </aside>
        </section>
      </div>

      {/* =========================================================
          ADD MILESTONE MODAL
      ========================================================= */}

      {isAddMilestoneOpen && (
        <Modal
          isOpen={isAddMilestoneOpen}
          onClose={() =>
            setIsAddMilestoneOpen(false)
          }
          title="Add Learning Milestone"
          description="Break your learning journey down into tangible deliverables."
        >
          <form
            onSubmit={handleAddMilestone}
            className="space-y-4"
          >
            <Input
              label="Milestone Title"
              placeholder="e.g. Build First React Dashboard"
              value={newMilestoneTitle}
              onChange={(event) =>
                setNewMilestoneTitle(
                  event.target.value
                )
              }
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Description (Optional)
              </label>

              <textarea
                rows={2}
                placeholder="Key concepts or project requirements to complete..."
                value={newMilestoneDesc}
                onChange={(event) =>
                  setNewMilestoneDesc(
                    event.target.value
                  )
                }
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setIsAddMilestoneOpen(false)
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
              >
                Add Milestone
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}


// "use client";

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { useSearchParams } from "next/navigation";
// import { LearningProgress, SkillSwap } from "@/types";
// import { progressService, swapService } from "@/services";
// import { useAuth } from "@/hooks/useAuth";
// import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { Modal } from "@/components/ui/Modal";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
// import { Badge } from "@/components/ui/Badge";
// import {
//   TrendingUp, CheckCircle2, Circle, Clock, Plus,
//   Sparkles, ArrowRightLeft, Target, RefreshCw
// } from "lucide-react";

// export default function ProgressPage() {
//   const searchParams = useSearchParams();
//   const swapIdParam = searchParams.get("swap_id") || "";

//   const { isAuthenticated } = useAuth();
//   const [swaps, setSwaps] = useState<SkillSwap[]>([]);
//   const [selectedSwapId, setSelectedSwapId] = useState<string>(swapIdParam);
//   const [progressRecords, setProgressRecords] = useState<LearningProgress[]>([]);
//   const [isLoading, setIsLoading] = useState<boolean>(true);

//   // Add Milestone Modal
//   const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
//   const [targetProgressId, setTargetProgressId] = useState<string>("");
//   const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
//   const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const fetchSwapsAndProgress = async () => {
//     setIsLoading(true);
//     try {
//       const allSwaps = await swapService.getMySwaps();
//       setSwaps(allSwaps);

//       const targetId = selectedSwapId || (allSwaps.length > 0 ? allSwaps[0].id : "");
//       if (targetId) {
//         setSelectedSwapId(targetId);
//         const progs = await progressService.getSwapProgress(targetId);
//         setProgressRecords(progs);
//       }
//     } catch (err) {
//       console.error("Failed to load progress:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isAuthenticated) {
//       fetchSwapsAndProgress();
//     } else {
//       setIsLoading(false);
//     }
//   }, [isAuthenticated, selectedSwapId]);

//   const handleToggleMilestone = async (milestoneId: string) => {
//     try {
//       await progressService.toggleMilestone(milestoneId);
//       if (selectedSwapId) {
//         const progs = await progressService.getSwapProgress(selectedSwapId);
//         setProgressRecords(progs);
//       }
//     } catch (err) {
//       alert("Failed to update milestone status");
//     }
//   };

//   const handleAddMilestone = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newMilestoneTitle.trim() || !targetProgressId) return;

//     setIsSubmitting(true);
//     try {
//       await progressService.addMilestone(targetProgressId, {
//         title: newMilestoneTitle.trim(),
//         description: newMilestoneDesc.trim() || undefined,
//         order: 99,
//       });
//       setIsAddMilestoneOpen(false);
//       setNewMilestoneTitle("");
//       setNewMilestoneDesc("");
//       if (selectedSwapId) {
//         const progs = await progressService.getSwapProgress(selectedSwapId);
//         setProgressRecords(progs);
//       }
//     } catch (err: any) {
//       alert(err.message || "Failed to add milestone");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (!isAuthenticated) {
//     return (
//       <div className="max-w-md mx-auto py-24 text-center space-y-4">
//         <TrendingUp className="w-12 h-12 text-indigo-600 mx-auto" />
//         <h2 className="text-xl font-bold text-slate-900">Sign in to track learning milestones</h2>
//         <Link href="/login">
//           <Button variant="primary">Sign In</Button>
//         </Link>
//       </div>
//     );
//   }

//   const currentSwap = swaps.find((s) => s.id === selectedSwapId);

//   return (
//     <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
//             <TrendingUp className="w-7 h-7 text-indigo-600" />
//             Learning Progress & Milestones
//           </h1>
//           <p className="text-xs sm:text-sm text-slate-500 mt-1">
//             Track your structured learning journey, check off mastered concepts, and log session completions.
//           </p>
//         </div>

//         {swaps.length > 1 && (
//           <div className="flex items-center space-x-2">
//             <label className="text-xs font-semibold text-slate-600">Active Swap:</label>
//             <select
//               value={selectedSwapId}
//               onChange={(e) => setSelectedSwapId(e.target.value)}
//               className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             >
//               {swaps.map((s) => (
//                 <option key={s.id} value={s.id}>
//                   Partner: {s.partner_name} ({s.i_learn_skill})
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}
//       </div>

//       {isLoading ? (
//         <div className="py-24 text-center text-slate-400 text-sm">Loading milestones...</div>
//       ) : swaps.length === 0 ? (
//         <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto">
//           <Target className="w-10 h-10 text-slate-400 mx-auto" />
//           <h3 className="font-bold text-slate-900 text-base">No Active Swaps to Track</h3>
//           <p className="text-xs text-slate-500">
//             Progress records and milestones are created when you start an active skill exchange with a peer.
//           </p>
//           <Link href="/explore">
//             <Button variant="primary" size="sm">
//               Discover Mentors →
//             </Button>
//           </Link>
//         </div>
//       ) : (
//         <div className="space-y-8">
//           {progressRecords.map((prog) => {
//             const completedCount = prog.milestones.filter((m) => m.status === "Completed").length;

//             return (
//               <Card key={prog.id} className="border-slate-200 shadow-sm overflow-hidden">
//                 <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
//                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                     <div className="space-y-1">
//                       <div className="flex items-center space-x-2">
//                         <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
//                           Learning Skill
//                         </span>
//                         <Badge variant="default" className="text-[10px]">
//                           Target: {prog.target_level || "Intermediate"}
//                         </Badge>
//                       </div>
//                       <CardTitle className="text-xl font-bold text-slate-900">
//                         <Link href={`/progress/${prog.id}`} className="hover:text-indigo-700">{prog.skill_name}</Link>
//                       </CardTitle>
//                       <p className="text-xs text-slate-500">
//                         Exchanged with <span className="font-semibold text-slate-700">{currentSwap?.partner_name}</span>
//                       </p>
//                     </div>

//                     {/* Progress percentage ring */}
//                     <div className="flex items-center space-x-4">
//                       <div className="text-right">
//                         <p className="text-2xl font-black text-indigo-600">{prog.progress_percentage}%</p>
//                         <p className="text-[11px] text-slate-400 font-medium">
//                           {completedCount}/{prog.milestones.length} Milestones Done
//                         </p>
//                       </div>
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         onClick={() => {
//                           setTargetProgressId(prog.id);
//                           setIsAddMilestoneOpen(true);
//                         }}
//                         className="text-xs"
//                       >
//                         <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
//                       </Button>
//                     </div>
//                   </div>

//                   {/* Progress bar */}
//                   <div className="w-full bg-slate-200/80 rounded-full h-2 mt-4 overflow-hidden">
//                     <div
//                       className="bg-gradient-to-r from-indigo-500 to-violet-600 h-2 rounded-full transition-all duration-300"
//                       style={{ width: `${Math.min(prog.progress_percentage, 100)}%` }}
//                     />
//                   </div>
//                 </CardHeader>

//                 <CardContent className="p-6 space-y-4">
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
//                     Milestones Roadmap
//                   </h3>

//                   <div className="space-y-3">
//                     {prog.milestones.length === 0 ? (
//                       <p className="text-xs text-slate-400 italic py-4 text-center">
//                         No milestones added yet. Click "+ Add Milestone" to define your goals!
//                       </p>
//                     ) : (
//                       prog.milestones.map((m) => {
//                         const isDone = m.status === "Completed";
//                         const isInProgress = m.status === "In Progress";

//                         return (
//                           <div
//                             key={m.id}
//                             onClick={() => handleToggleMilestone(m.id)}
//                             className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
//                               isDone
//                                 ? "bg-emerald-50/40 border-emerald-200/70"
//                                 : isInProgress
//                                 ? "bg-indigo-50/40 border-indigo-200/70"
//                                 : "bg-white border-slate-200 hover:border-slate-300"
//                             }`}
//                           >
//                             <div className="flex items-start space-x-3">
//                               <button
//                                 type="button"
//                                 className="mt-0.5 text-slate-400 hover:text-indigo-600 focus:outline-none"
//                               >
//                                 {isDone ? (
//                                   <CheckCircle2 className="w-5 h-5 text-emerald-600" />
//                                 ) : (
//                                   <Circle className="w-5 h-5 text-slate-300" />
//                                 )}
//                               </button>
//                               <div>
//                                 <h4
//                                   className={`text-sm font-bold ${
//                                     isDone ? "line-through text-slate-500" : "text-slate-900"
//                                   }`}
//                                 >
//                                   {m.title}
//                                 </h4>
//                                 {m.description && (
//                                   <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
//                                     {m.description}
//                                   </p>
//                                 )}
//                               </div>
//                             </div>

//                             <Badge
//                               variant={
//                                 isDone ? "success" : isInProgress ? "default" : "secondary"
//                               }
//                               className="shrink-0 text-[10px]"
//                             >
//                               {m.status}
//                             </Badge>
//                           </div>
//                         );
//                       })
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}

//       {/* Add Milestone Modal */}
//       {isAddMilestoneOpen && (
//         <Modal
//           isOpen={isAddMilestoneOpen}
//           onClose={() => setIsAddMilestoneOpen(false)}
//           title="Add Learning Milestone"
//           description="Break your learning journey down into tangible deliverables."
//         >
//           <form onSubmit={handleAddMilestone} className="space-y-4">
//             <Input
//               label="Milestone Title"
//               placeholder="e.g. Build First React Dashboard, Write Sourdough Starter"
//               value={newMilestoneTitle}
//               onChange={(e) => setNewMilestoneTitle(e.target.value)}
//               required
//             />
//             <div className="space-y-1.5">
//               <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
//               <textarea
//                 rows={2}
//                 placeholder="Key concepts or project requirements to complete..."
//                 value={newMilestoneDesc}
//                 onChange={(e) => setNewMilestoneDesc(e.target.value)}
//                 className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>
//             <div className="pt-2 flex justify-end space-x-3">
//               <Button type="button" variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>
//                 Cancel
//               </Button>
//               <Button type="submit" variant="primary" isLoading={isSubmitting}>
//                 Add Milestone
//               </Button>
//             </div>
//           </form>
//         </Modal>
//       )}
//     </div>
//   );
// }
