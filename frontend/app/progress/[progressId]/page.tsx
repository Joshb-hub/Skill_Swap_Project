"use client";

import { useParams } from "next/navigation";

export default function ProgressDetailPage() {
  const params = useParams();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-indigo-600">Progress</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Learning Progress</h1>
        <p className="mt-4 text-sm text-slate-600">
          Progress details for <span className="font-semibold text-slate-900">{String(params.progressId || "this milestone")}</span> are being prepared.
        </p>
      </div>
    </main>
  );
}
