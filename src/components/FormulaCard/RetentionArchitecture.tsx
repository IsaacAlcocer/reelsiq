import type { RetentionArchitectureData } from "@/types/formula-card";
import InfoTip from "@/components/InfoTip";

function PayoffBlock({
  label,
  value,
  total,
  highlight,
}: {
  label: string;
  value: number;
  total: number;
  highlight?: "good" | "bad";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const borderColor =
    highlight === "good"
      ? "border-emerald-500/30"
      : highlight === "bad"
      ? "border-red-500/30"
      : "border-zinc-800";
  const textColor =
    highlight === "good"
      ? "text-emerald-400"
      : highlight === "bad"
      ? "text-red-400"
      : "text-zinc-200";

  return (
    <div className={`rounded-xl border bg-zinc-900/50 p-4 text-center ${borderColor}`}>
      <p className={`text-2xl font-black tabular-nums ${textColor}`}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mt-1">{label}</p>
      <p className="text-xs text-zinc-600 tabular-nums">{pct}%</p>
    </div>
  );
}

function StructureCard({ structure, isPrimary }: { structure: RetentionArchitectureData["dominantStructure"]; isPrimary: boolean }) {
  return (
    <div className={`rounded-xl border bg-zinc-900/50 p-5 ${isPrimary ? "border-violet-500/20" : "border-zinc-800"}`}>
      <div className="flex items-center gap-2 mb-3">
        {isPrimary && (
          <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-400">
            Primary
          </span>
        )}
        <span className="text-sm font-semibold text-zinc-200">
          {structure.type?.replace(/_/g, " ")}
        </span>
        <span className="text-xs text-zinc-500">({structure.frequency} reels)</span>
      </div>

      {structure.breakdown && structure.breakdown.length > 0 && (
        <div className="relative ml-3 space-y-0">
          {structure.breakdown.map((step, i) => (
            <div key={i} className="flex items-start gap-3 relative pb-3 last:pb-0">
              {/* Connector line */}
              {i < structure.breakdown.length - 1 && (
                <div className="absolute left-[5px] top-4 bottom-0 w-px bg-zinc-800" />
              )}
              <div className={`relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                isPrimary ? "border-violet-500 bg-violet-500/20" : "border-zinc-600 bg-zinc-800"
              }`} />
              <span className="text-sm text-zinc-400">{step}</span>
            </div>
          ))}
        </div>
      )}

      {structure.note && (
        <p className="mt-3 text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-3">
          {structure.note}
        </p>
      )}
    </div>
  );
}

export default function RetentionArchitecture({ data }: { data: RetentionArchitectureData }) {
  const p = data.payoffDelayAnalysis;
  const total = p ? p.earlyPayoff + p.middlePayoff + p.delayedPayoff + p.noClearPayoff : 0;

  const densityColor =
    data.interruptDensityVerdict === "high_density"
      ? "text-emerald-400"
      : data.interruptDensityVerdict === "low_density"
      ? "text-red-400"
      : "text-amber-400";

  return (
    <div className="space-y-5">
      {/* Payoff Delay Analysis */}
      {p && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-violet-500/15 p-1.5">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Payoff Delay Analysis<InfoTip termKey="payoffDelay" /></h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <PayoffBlock label="Early" value={p.earlyPayoff} total={total} />
            <PayoffBlock label="Middle" value={p.middlePayoff} total={total} />
            <PayoffBlock label="Delayed" value={p.delayedPayoff} total={total} highlight="good" />
            <PayoffBlock label="No Payoff" value={p.noClearPayoff} total={total} highlight="bad" />
          </div>

          {p.insight && (
            <p className="text-sm text-zinc-400 leading-relaxed">{p.insight}</p>
          )}
        </div>
      )}

      {/* Rhetorical Interrupts */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-zinc-200">Rhetorical Interrupts<InfoTip termKey="rhetoricalInterrupts" /></h4>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black tabular-nums ${densityColor}`}>
              {data.avgRhetoricalInterrupts}
            </span>
            <span className="text-xs text-zinc-500">avg / reel</span>
          </div>
        </div>
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          data.interruptDensityVerdict === "high_density"
            ? "bg-emerald-500/10 text-emerald-400"
            : data.interruptDensityVerdict === "low_density"
            ? "bg-red-500/10 text-red-400"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {data.interruptDensityVerdict?.replace(/_/g, " ")}
        </span>
        {data.interruptRecommendation && (
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
            {data.interruptRecommendation}
          </p>
        )}
      </div>

      {/* Narrative Structures */}
      <div className="space-y-3">
        {data.dominantStructure && (
          <StructureCard structure={data.dominantStructure} isPrimary />
        )}
        {data.secondaryStructure && (
          <StructureCard structure={data.secondaryStructure} isPrimary={false} />
        )}
      </div>
    </div>
  );
}
