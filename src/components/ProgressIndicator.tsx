"use client";

import { useState } from "react";

interface SkipReason {
  url: string;
  reason: string;
}

interface Progress {
  stage: string;
  completed: number;
  total: number;
  skipped: number;
  skipReasons: SkipReason[];
}

const STAGE_ORDER = ["scraping", "transcribing", "analyzing", "synthesizing", "complete"];
const STAGE_LABELS: Record<string, string> = {
  scraping: "Scraping Reels",
  transcribing: "Transcribing Audio",
  analyzing: "Analyzing Content",
  synthesizing: "Generating Formula Card",
  complete: "Complete",
};

function stageIndex(stage: string): number {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? 0 : idx;
}

export default function ProgressIndicator({
  status,
  progress,
  error,
}: {
  status: string;
  progress: Progress;
  error?: string;
}) {
  const [skipsOpen, setSkipsOpen] = useState(false);

  if (status === "error") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Error</h2>
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  const currentIdx = stageIndex(progress.stage);
  const pct =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Stage steps */}
      <div className="flex items-center justify-between gap-2">
        {STAGE_ORDER.slice(0, 4).map((stage, i) => {
          const done = currentIdx > i;
          const active = currentIdx === i && status !== "complete";
          return (
            <div key={stage} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-2 ring-offset-[#0a0a0a]"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  done
                    ? "text-emerald-400"
                    : active
                    ? "text-violet-300"
                    : "text-zinc-500"
                }`}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      {status !== "complete" && progress.total > 0 && (
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
            <span>
              {progress.completed} / {progress.total} {STAGE_LABELS[progress.stage]?.toLowerCase() ?? progress.stage}
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Spinner for active stage */}
      {status !== "complete" && (
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <svg
            className="h-4 w-4 animate-spin text-violet-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Processing...
        </div>
      )}

      {/* Skipped items */}
      {progress.skipped > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setSkipsOpen(!skipsOpen)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
          >
            <svg
              className={`h-3 w-3 transition-transform ${skipsOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {progress.skipped} skipped
          </button>
          {skipsOpen && (
            <ul className="mt-2 space-y-1 pl-4">
              {progress.skipReasons.map((s, i) => (
                <li key={i} className="text-xs text-zinc-500">
                  <span className="text-zinc-400 break-all">{s.url}</span>
                  {" — "}
                  {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
