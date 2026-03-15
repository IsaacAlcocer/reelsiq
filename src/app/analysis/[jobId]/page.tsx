"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import ProgressIndicator from "@/components/ProgressIndicator";
import FormulaCard from "@/components/FormulaCard/FormulaCard";
import ScriptAuditView from "@/components/ScriptAudit/ScriptAuditView";
import GuidedTour from "@/components/GuidedTour";

// ---------------------------------------------------------------------------
// Types (mirroring job-store)
// ---------------------------------------------------------------------------

interface SkipReason {
  url: string;
  reason: string;
}

interface JobProgress {
  stage: string;
  completed: number;
  total: number;
  skipped: number;
  skipReasons: SkipReason[];
}

interface JobStatus {
  status: string;
  jobType?: string;
  progress: JobProgress;
  result: {
    // Reels job result
    formulaCard?: Record<string, unknown>;
    individualAnalyses?: Array<{
      url?: string;
      title?: string;
      analysis: Record<string, unknown> | null;
      error: string | null;
    }>;
    // Script job result
    auditResult?: Record<string, unknown>;
  } | null;
  error?: string;
}

// ---------------------------------------------------------------------------
// SWR fetcher
// ---------------------------------------------------------------------------

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Job not found or expired.");
    return res.json() as Promise<JobStatus>;
  });

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalysisPage({
  params,
}: {
  params: { jobId: string };
}) {
  const { jobId } = params;

  const { data, error: fetchError } = useSWR<JobStatus>(
    `/api/jobs/${jobId}/status`,
    fetcher,
    {
      refreshInterval: (latestData) =>
        latestData?.status === "complete" || latestData?.status === "error"
          ? 0
          : 2000,
    }
  );

  if (fetchError) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">
            This analysis has expired or could not be found. Please run a new analysis.
          </p>
          <a href="/" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300 underline">
            Back to home
          </a>
        </div>
      </Shell>
    );
  }

  if (!data) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-3 py-20 text-zinc-400">
          <Spinner />
          Loading...
        </div>
      </Shell>
    );
  }

  const isComplete = data.status === "complete" && data.result;
  const isScriptJob = data.jobType === "scripts";

  // Reels-specific data
  const reelsAnalyses = data.result?.individualAnalyses?.filter((a) => a.url) ?? [];
  const reelsSuccessCount = reelsAnalyses.filter((a) => a.analysis).length;

  return (
    <Shell>
      {/* Progress */}
      <ProgressIndicator
        status={data.status}
        progress={data.progress}
        error={data.error}
        jobType={data.jobType}
      />

      {/* Low-data warning (reels only) */}
      {isComplete && !isScriptJob && reelsSuccessCount > 0 && reelsSuccessCount < 5 && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          Analysis based on limited data ({reelsSuccessCount} reel{reelsSuccessCount > 1 ? "s" : ""}) — patterns may be less reliable.
        </div>
      )}

      {/* Results */}
      {isComplete && data.result && (
        <div className="mt-8 space-y-8">
          {/* Export + guide link */}
          <div className="flex items-center justify-between">
            <ExportBar jobId={jobId} />
            {!isScriptJob && (
              <a
                href="/guide"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How to read this
              </a>
            )}
          </div>

          {/* Script audit results */}
          {isScriptJob && data.result.auditResult && (
            <>
              <ScriptAuditView
                data={data.result.auditResult as unknown as import("@/types/script-audit").ScriptAuditResult}
                jobId={jobId}
              />
              {/* Individual script analyses (collapsed) */}
              {data.result.individualAnalyses && data.result.individualAnalyses.length > 0 && (
                <IndividualScripts analyses={data.result.individualAnalyses} />
              )}
            </>
          )}

          {/* Reels formula card results */}
          {!isScriptJob && data.result.formulaCard && (
            <>
              <FormulaCard data={data.result.formulaCard} />
              <IndividualReels analyses={reelsAnalyses} />
              <GuidedTour />
            </>
          )}
        </div>
      )}
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
      <a href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        New analysis
      </a>
      {children}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Export buttons
// ---------------------------------------------------------------------------

function ExportBar({ jobId }: { jobId: string }) {
  const [copied, setCopied] = useState(false);

  const copyMarkdown = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}/export?format=markdown`, {
      method: "POST",
    });
    const text = await res.text();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jobId]);

  const downloadJson = useCallback(async () => {
    const res = await fetch(`/api/jobs/${jobId}/export?format=json`, {
      method: "POST",
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formula-card-${jobId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [jobId]);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={copyMarkdown}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-all"
      >
        {copied ? (
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {copied ? "Copied!" : "Copy as Markdown"}
      </button>
      <button
        onClick={downloadJson}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download JSON
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual reel cards (collapsed)
// ---------------------------------------------------------------------------

function IndividualReels({
  analyses,
}: {
  analyses: Array<{
    url?: string;
    analysis: Record<string, unknown> | null;
    error: string | null;
  }>;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (analyses.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-500 tabular-nums">
          {analyses.length}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          Individual Reel Analyses
        </h3>
        <div className="flex-1 h-px bg-zinc-800/80" />
      </div>
      <div className="space-y-2">
        {analyses.map((a, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-800/30 transition-colors"
              >
                <span className="text-sm text-zinc-300 truncate max-w-[80%] font-mono">
                  {a.url}
                </span>
                <span className="flex items-center gap-2">
                  {a.error && (
                    <span className="text-[10px] text-red-400 bg-red-500/10 rounded-full px-2 py-0.5 border border-red-500/20">
                      error
                    </span>
                  )}
                  {a.analysis && !a.error && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/20">
                      analyzed
                    </span>
                  )}
                  <svg
                    className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-zinc-800 px-5 py-4">
                  {a.error && (
                    <p className="text-sm text-red-400 mb-2">{a.error}</p>
                  )}
                  {a.analysis && (
                    <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {JSON.stringify(a.analysis, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual script analyses (collapsed)
// ---------------------------------------------------------------------------

function IndividualScripts({
  analyses,
}: {
  analyses: Array<{
    title?: string;
    analysis: Record<string, unknown> | null;
    error: string | null;
  }>;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (analyses.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-500 tabular-nums">
          {analyses.length}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          Raw Script Analyses
        </h3>
        <div className="flex-1 h-px bg-zinc-800/80" />
      </div>
      <div className="space-y-2">
        {analyses.map((a, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-800/30 transition-colors"
              >
                <span className="text-sm text-zinc-300 truncate max-w-[80%]">
                  {a.title ?? `Script ${i + 1}`}
                </span>
                <span className="flex items-center gap-2">
                  {a.error && (
                    <span className="text-[10px] text-red-400 bg-red-500/10 rounded-full px-2 py-0.5 border border-red-500/20">
                      error
                    </span>
                  )}
                  {a.analysis && !a.error && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 rounded-full px-2 py-0.5 border border-emerald-500/20">
                      analyzed
                    </span>
                  )}
                  <svg
                    className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-zinc-800 px-5 py-4">
                  {a.error && (
                    <p className="text-sm text-red-400 mb-2">{a.error}</p>
                  )}
                  {a.analysis && (
                    <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {JSON.stringify(a.analysis, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-violet-400" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
