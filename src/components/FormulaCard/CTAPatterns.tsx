import type { CTAPattern } from "@/types/formula-card";

const impactConfig = {
  session_extending: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    label: "Session Extending",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  session_neutral: {
    bg: "bg-zinc-700/30",
    border: "border-zinc-700/40",
    text: "text-zinc-400",
    label: "Session Neutral",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
      </svg>
    ),
  },
  session_killing: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    label: "Session Killing",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
} as const;

export default function CTAPatterns({ data }: { data: CTAPattern[] }) {
  return (
    <div className="space-y-3">
      {data.map((cta, i) => {
        const impact = impactConfig[cta.sessionImpact] ?? impactConfig.session_neutral;
        return (
          <div key={i} className={`rounded-xl border p-5 transition-all ${impact.border} ${impact.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-300 capitalize">
                {cta.style}
              </span>
              <div className={`flex items-center gap-1.5 ${impact.text}`}>
                {impact.icon}
                <span className="text-xs font-medium">{impact.label}</span>
              </div>
              {cta.frequency > 0 && (
                <span className="ml-auto text-xs text-zinc-500 tabular-nums">
                  {cta.frequency}x found
                </span>
              )}
            </div>
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 px-4 py-3">
              <p className="text-sm font-mono text-violet-300 leading-relaxed">{cta.template}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
