"use client";

import { useState } from "react";
import type { RefinedScript } from "@/types/script-audit";

// ---------------------------------------------------------------------------
// Change area badge
// ---------------------------------------------------------------------------

function AreaBadge({ area }: { area: string }) {
  const cfg: Record<string, string> = {
    hook: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    structure: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    retention: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    authenticity: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    cta: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    pacing: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    emotion: "bg-pink-500/10 border-pink-500/20 text-pink-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        cfg[area] ?? cfg.structure
      }`}
    >
      {area}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RefinedScriptView({
  refined,
  originalScore,
}: {
  refined: RefinedScript;
  originalScore: number;
}) {
  const [copied, setCopied] = useState(false);
  const [showChanges, setShowChanges] = useState(false);

  const copyScript = async () => {
    await navigator.clipboard.writeText(refined.refinedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreDelta = refined.estimatedScoreAfter - originalScore;

  return (
    <div className="mt-4 space-y-4">
      {/* Score improvement banner */}
      <div className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-zinc-400 tabular-nums line-through decoration-zinc-600">
            {originalScore}
          </span>
          <svg
            className="h-5 w-5 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <span className="text-2xl font-black text-emerald-400 tabular-nums">
            {refined.estimatedScoreAfter}
          </span>
        </div>
        {scoreDelta > 0 && (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 text-xs font-bold text-emerald-400">
            +{scoreDelta} pts
          </span>
        )}
        <p className="flex-1 text-sm text-zinc-400">
          {refined.summaryOfChanges}
        </p>
      </div>

      {/* Hook comparison */}
      {refined.hookComparison && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/70 mb-2">
              Original Hook
            </p>
            <p className="text-sm text-zinc-400 italic leading-relaxed">
              &ldquo;{refined.hookComparison.before}&rdquo;
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400/70 mb-2">
              Refined Hook
            </p>
            <p className="text-sm text-zinc-200 italic leading-relaxed">
              &ldquo;{refined.hookComparison.after}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* Refined script content */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400">
            Refined Script
          </h4>
          <button
            onClick={copyScript}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:border-zinc-500 hover:text-white transition-all"
          >
            {copied ? (
              <>
                <svg
                  className="h-3.5 w-3.5 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Script
              </>
            )}
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {refined.refinedContent}
          </p>
        </div>
      </div>

      {/* Changes log (collapsible) */}
      {refined.changes?.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowChanges(!showChanges)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/20 transition-colors"
          >
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
              What Changed ({refined.changes.length} changes)
            </span>
            <svg
              className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${
                showChanges ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showChanges && (
            <div className="border-t border-zinc-800 p-4 space-y-3">
              {refined.changes.map((change, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AreaBadge area={change.area} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300">{change.what}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {change.why}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
