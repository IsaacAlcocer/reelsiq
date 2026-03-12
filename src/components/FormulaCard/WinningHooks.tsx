import type { WinningHook } from "@/types/formula-card";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import InfoTip from "@/components/InfoTip";

const verdictStyles: Record<string, { bg: string; text: string }> = {
  "passes both gates": { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "strong clarity, weak gap": { bg: "bg-amber-500/10", text: "text-amber-400" },
  "strong gap, weak clarity": { bg: "bg-amber-500/10", text: "text-amber-400" },
};

function HookCard({ hook, index }: { hook: WinningHook; index: number }) {
  const verdict = verdictStyles[hook.twoStepVerdict] ?? { bg: "bg-zinc-800", text: "text-zinc-400" };

  return (
    <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700">
      {/* Number badge */}
      <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400 border border-violet-500/30">
        {index + 1}
      </div>

      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300">
            {hook.category?.replace(/_/g, " ")}
          </span>
          <ConfidenceBadge level={hook.confidenceLevel} /><InfoTip termKey="confidenceLevel" />
          {hook.frequencyPercent > 0 && (
            <span className="text-xs text-zinc-500 tabular-nums">
              {hook.frequencyPercent}% of reels
            </span>
          )}
        </div>

        {/* Template */}
        <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-4 py-3">
          <p className="text-sm font-mono text-violet-300 leading-relaxed">{hook.template}</p>
        </div>

        {/* Example */}
        <p className="text-sm text-zinc-400 italic pl-1">
          &ldquo;{hook.example}&rdquo;
        </p>

        {/* Two-step verdict */}
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${verdict.bg} ${verdict.text}`}>
          {hook.twoStepVerdict === "passes both gates" ? (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
            </svg>
          )}
          {hook.twoStepVerdict}
        </div>

        {/* Psychology note */}
        {hook.psychologyNote && (
          <p className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800/80 pt-3">
            {hook.psychologyNote}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WinningHooks({ data }: { data: WinningHook[] }) {
  return (
    <div className="space-y-5 pl-2">
      {data.map((hook, i) => (
        <HookCard key={i} hook={hook} index={i} />
      ))}
    </div>
  );
}
