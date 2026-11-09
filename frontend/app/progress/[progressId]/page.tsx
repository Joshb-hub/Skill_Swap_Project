"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { progressService } from "@/services";
import type { LearningProgress } from "@/types";
import { Button } from "@/components/ui/Button";

export default function ProgressDetailPage() {
  const params = useParams();
  const progressId = String(params.progressId || "");
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !progressId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    progressService.getProgressRecord(progressId)
      .then((record) => { if (active) setProgress(record); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this progress record."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, progressId]);

  if (!isAuthenticated) return <main className="mx-auto max-w-3xl px-4 py-12"><section className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold text-slate-900">Sign in to view learning progress</h1><Link href="/login"><Button className="mt-5" variant="primary">Sign in</Button></Link></section></main>;
  if (isLoading) return <main className="mx-auto max-w-3xl px-4 py-12" role="status">Loading learning progress...</main>;
  if (!progress) return <main className="mx-auto max-w-3xl px-4 py-12"><section className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-bold text-slate-900">Progress record unavailable</h1><p className="mt-3 text-slate-600">{error || "This record may have been removed or you may not have access to it."}</p><Link className="mt-5 inline-flex items-center gap-2 text-indigo-700" href="/progress"><ArrowLeft /> Back to progress</Link></section></main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900" href={`/progress?swap_id=${progress.swap_id}`}><ArrowLeft /> Back to exchange progress</Link>
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-indigo-600">Learning Progress</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{progress.skill_name}</h1>
        <p className="mt-2 text-slate-600">Current level: {progress.current_level || "Not set"} · Target: {progress.target_level || "Not set"}</p>
        <div className="mt-6 flex items-center gap-3"><TrendingUp className="text-indigo-600" /><strong>{progress.progress_percentage}% complete</strong><span className="text-sm text-slate-500">{progress.completed_sessions} of {progress.total_sessions} sessions</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-600" style={{ width: `${Math.min(Math.max(progress.progress_percentage, 0), 100)}%` }} /></div>
        <h2 className="mt-8 text-lg font-semibold text-slate-900">Milestones</h2>
        {progress.milestones.length ? <ul className="mt-4 space-y-3">{progress.milestones.map((milestone) => <li key={milestone.id} className="flex items-start gap-3 border-b border-slate-100 pb-3"><span className="mt-0.5 text-indigo-600">{milestone.status === "Completed" ? <CheckCircle2 /> : <Circle />}</span><span><strong>{milestone.title}</strong><span className="ml-2 text-sm text-slate-500">{milestone.status}</span>{milestone.description && <p className="mt-1 text-sm text-slate-600">{milestone.description}</p>}</span></li>)}</ul> : <p className="mt-3 text-sm text-slate-600">No milestones have been added to this progress record yet.</p>}
      </section>
    </main>
  );
}
