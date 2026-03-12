import type { HookDiagnosticData } from "@/types/formula-card";
import InfoTip from "@/components/InfoTip";

function GateBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const barColors: Record<string, string> = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <span className="text-sm font-bold tabular-nums text-zinc-200">
          {value}
          <span className="text-zinc-500 font-normal text-xs ml-1">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColors[color] ?? "bg-zinc-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TrifectaRing({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const circumference = 2 * Math.PI * 20;
  const offset = circumference - (pct / 100) * circumference;

  const strokeColors: Record<string, string> = {
    emerald: "#10b981",
    amber: "#f59e0b",
    zinc: "#71717a",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-14 w-14">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" stroke="#27272a" strokeWidth="4" fill="none" />
          <circle
            cx="24"
            cy="24"
            r="20"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{
              stroke: strokeColors[color] ?? strokeColors.zinc,
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              transition: "stroke-dashoffset 0.8s ease-out",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold tabular-nums">{value}</span>
        </div>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
    </div>
  );
}

export default function HookDiagnostic({ data }: { data: HookDiagnosticData }) {
  const t = data.twoStepTestResults;
  const b = data.brainTriggerTrifectaUsage;
  const totalHooks = t
    ? t.passedBothGates + t.clarityOnlyNoGap + t.gapOnlyNoClarity + t.failedBoth
    : 0;
  const totalTrifecta = b ? b.fullTrifecta + b.partialCount + b.noneCount : 0;

  return (
    <div className="space-y-6">
      {/* Two-Step Hook Test */}
      {t && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-violet-500/15 p-1.5">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Two-Step Hook Test<InfoTip termKey="twoStepTest" /></h4>
          </div>

          <div className="space-y-3">
            <GateBar label="Passed Both Gates" value={t.passedBothGates} total={totalHooks} color="emerald" />
            <GateBar label="Clarity Only (No Gap)" value={t.clarityOnlyNoGap} total={totalHooks} color="amber" />
            <GateBar label="Gap Only (No Clarity)" value={t.gapOnlyNoClarity} total={totalHooks} color="amber" />
            <GateBar label="Failed Both" value={t.failedBoth} total={totalHooks} color="red" />
          </div>

          {t.insight && (
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
              {t.insight}
            </p>
          )}
        </div>
      )}

      {/* Brain Trigger Trifecta */}
      {b && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-violet-500/15 p-1.5">
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Brain Trigger Trifecta<InfoTip termKey="brainTriggerTrifecta" /></h4>
          </div>

          <div className="flex justify-center gap-8 mb-4">
            <TrifectaRing label="Full" value={b.fullTrifecta} total={totalTrifecta} color="emerald" />
            <TrifectaRing label="Partial" value={b.partialCount} total={totalTrifecta} color="amber" />
            <TrifectaRing label="None" value={b.noneCount} total={totalTrifecta} color="zinc" />
          </div>

          {b.recommendation && (
            <p className="text-sm text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
              {b.recommendation}
            </p>
          )}
        </div>
      )}

      {/* Dominant hook */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4">
        <div className="shrink-0 rounded-lg bg-violet-500/15 p-2">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Dominant Hook Category</p>
          <p className="text-lg font-bold text-zinc-200">
            {data.dominantHookCategory?.replace(/_/g, " ")}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({data.dominantHookCategoryFrequency} reels)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
