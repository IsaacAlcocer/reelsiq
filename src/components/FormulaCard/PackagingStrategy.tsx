import type { PackagingStrategyData } from "@/types/formula-card";

function BreakdownBar({ framework, count, maxCount }: { framework: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 truncate text-xs text-zinc-400">{framework?.replace(/_/g, " ")}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          className="h-full rounded-full bg-violet-500/70 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs font-bold tabular-nums text-zinc-300">{count}</span>
    </div>
  );
}

export default function PackagingStrategy({ data }: { data: PackagingStrategyData }) {
  const maxCount = Math.max(...(data.packagingBreakdown?.map((b) => b.count) ?? [1]));

  return (
    <div className="space-y-5">
      {/* Dominant packaging callout */}
      <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-5 py-4">
        <div className="shrink-0 rounded-lg bg-violet-500/15 p-2">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Dominant Framework</p>
          <p className="text-lg font-bold text-zinc-200">
            {data.dominantPackaging?.replace(/_/g, " ")}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({data.dominantPackagingFrequency} reels)
            </span>
          </p>
        </div>
      </div>

      {/* Breakdown bars */}
      {data.packagingBreakdown && data.packagingBreakdown.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Distribution</p>
          {data.packagingBreakdown.map((b, i) => (
            <BreakdownBar key={i} framework={b.framework} count={b.count} maxCount={maxCount} />
          ))}
        </div>
      )}

      {/* Insight */}
      {data.insight && (
        <p className="text-sm text-zinc-400 leading-relaxed">{data.insight}</p>
      )}

      {/* Recommended packaging */}
      {data.recommendedPackaging && data.recommendedPackaging.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Recommended for Your Niche
          </p>
          {data.recommendedPackaging.map((r, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-violet-500/15 px-2.5 py-1 text-xs font-bold text-violet-400">
                  {r.framework?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-4 py-3">
                <p className="text-sm font-mono text-violet-300 leading-relaxed">{r.template}</p>
              </div>
              <p className="text-sm text-zinc-400 italic">&ldquo;{r.example}&rdquo;</p>
              <p className="text-xs text-zinc-500 leading-relaxed">{r.whyItWorks}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
