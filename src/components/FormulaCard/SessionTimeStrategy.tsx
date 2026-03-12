import type { SessionTimeStrategyData } from "@/types/formula-card";
import InfoTip from "@/components/InfoTip";

function BehaviorBar({
  label,
  value,
  total,
  warn,
}: {
  label: string;
  value: number;
  total: number;
  warn?: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-zinc-400">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            warn && value > 0 ? "bg-red-500/80" : "bg-violet-500/70"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`w-6 text-right text-xs font-bold tabular-nums ${warn && value > 0 ? "text-red-400" : "text-zinc-300"}`}>
        {value}
      </span>
    </div>
  );
}

export default function SessionTimeStrategy({ data }: { data: SessionTimeStrategyData }) {
  const b = data.sessionBehaviorBreakdown;
  const total = b
    ? b.profileDrivers + b.externalLinks + b.engagementPrompts + b.seriesReferences + b.noCta
    : 0;

  const bingeColor =
    data.bingeabilityScore === "high"
      ? "text-emerald-400"
      : data.bingeabilityScore === "low"
      ? "text-red-400"
      : "text-amber-400";

  const bingeBg =
    data.bingeabilityScore === "high"
      ? "bg-emerald-500/10 border-emerald-500/20"
      : data.bingeabilityScore === "low"
      ? "bg-red-500/10 border-red-500/20"
      : "bg-amber-500/10 border-amber-500/20";

  return (
    <div className="space-y-5">
      {/* Session Behavior Breakdown */}
      {b && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            CTA Session Behavior<InfoTip termKey="sessionBehavior" />
          </p>
          <BehaviorBar label="Profile drivers" value={b.profileDrivers} total={total} />
          <BehaviorBar label="External links" value={b.externalLinks} total={total} warn />
          <BehaviorBar label="Engagement" value={b.engagementPrompts} total={total} />
          <BehaviorBar label="Series refs" value={b.seriesReferences} total={total} />
          <BehaviorBar label="No CTA" value={b.noCta} total={total} />
        </div>
      )}

      {/* Session Killer Warning */}
      {data.sessionKillerWarning && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-4">
          <div className="flex items-start gap-2.5">
            <svg className="h-5 w-5 shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
                Session Killer Detected<InfoTip termKey="sessionKiller" />
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">{data.sessionKillerWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bingeability Score */}
      <div className={`rounded-xl border p-5 ${bingeBg}`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-zinc-200">Bingeability<InfoTip termKey="bingeabilityScore" /></h4>
          <span className={`text-lg font-black uppercase ${bingeColor}`}>
            {data.bingeabilityScore}
          </span>
        </div>
        {data.bingeabilityNote && (
          <p className="text-sm text-zinc-400 leading-relaxed">{data.bingeabilityNote}</p>
        )}
      </div>

      {/* Series Recommendation */}
      {data.seriesRecommendation && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg bg-violet-500/15 p-1.5 mt-0.5">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-1.5">
                Signature Series Concept<InfoTip termKey="signatureSeries" />
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{data.seriesRecommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
