"use client";

import type { ScriptAuditResult } from "@/types/script-audit";
import ScriptScorecardCard from "./ScriptScorecardCard";

export default function ScriptAuditView({
  data,
  jobId,
}: {
  data: ScriptAuditResult;
  jobId: string;
}) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-black text-zinc-100">
          Script Audit Results
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {data.scriptsAudited} script{data.scriptsAudited > 1 ? "s" : ""} audited
          {data.niche ? ` in ${data.niche}` : ""}
        </p>
      </div>

      {/* Top recommendation */}
      {data.topRecommendation && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <div className="shrink-0 rounded-xl bg-violet-500/20 p-3">
              <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-400 mb-3">
                Top Recommendation
              </h3>
              <p className="text-base font-medium text-zinc-200 leading-relaxed">
                {data.topRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cross-script patterns */}
      {data.crossScriptPatterns?.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            Patterns Across Your Scripts
          </h3>
          <ul className="space-y-2">
            {data.crossScriptPatterns.map((pattern, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-500 tabular-nums">
                  {i + 1}
                </span>
                <p className="text-sm text-zinc-300 leading-relaxed">{pattern}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Individual scorecards */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-500 tabular-nums">
            {data.scorecards?.length ?? 0}
          </span>
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
            Script Scorecards
          </h3>
          <div className="flex-1 h-px bg-zinc-800/80" />
        </div>

        {data.scorecards?.map((scorecard, i) => (
          <ScriptScorecardCard key={i} scorecard={scorecard} index={i} jobId={jobId} />
        ))}
      </div>
    </div>
  );
}
