import type { AlgorithmAlignmentScore, AlgorithmSignal } from "@/types/formula-card";

const overallConfig = {
  strong: {
    label: "Strong",
    gradient: "from-emerald-500 to-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    ring: "ring-emerald-500/20",
    glow: "shadow-emerald-500/20",
    percentage: 85,
  },
  moderate: {
    label: "Moderate",
    gradient: "from-amber-500 to-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    ring: "ring-amber-500/20",
    glow: "shadow-amber-500/20",
    percentage: 55,
  },
  weak: {
    label: "Weak",
    gradient: "from-red-500 to-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    ring: "ring-red-500/20",
    glow: "shadow-red-500/20",
    percentage: 25,
  },
} as const;

const statusConfig = {
  aligned: {
    icon: (
      <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
    label: "Aligned",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  partially_aligned: {
    icon: (
      <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
      </svg>
    ),
    label: "Partial",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  misaligned: {
    icon: (
      <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    label: "Misaligned",
    bg: "bg-red-500/8",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
} as const;

function ScoreRing({ percentage, gradient }: { percentage: number; gradient: string }) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-zinc-800/60"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={`text-transparent`}
          style={{
            stroke: `url(#scoreGradient)`,
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              className={gradient.includes("emerald") ? "text-emerald-500" : gradient.includes("amber") ? "text-amber-500" : "text-red-500"}
              style={{ stopColor: "currentColor" }}
            />
            <stop
              offset="100%"
              className={gradient.includes("emerald") ? "text-emerald-400" : gradient.includes("amber") ? "text-amber-400" : "text-red-400"}
              style={{ stopColor: "currentColor" }}
            />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black tabular-nums">{percentage}</span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Score</span>
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: AlgorithmSignal }) {
  const cfg = statusConfig[signal.status] ?? statusConfig.misaligned;
  return (
    <div
      className={`group relative rounded-xl border p-3.5 transition-all hover:scale-[1.02] ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{cfg.icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-200 leading-tight">{signal.signal}</p>
          <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{signal.note}</p>
        </div>
      </div>
    </div>
  );
}

export default function AlgorithmAlignment({ data }: { data: AlgorithmAlignmentScore }) {
  const cfg = overallConfig[data.overall] ?? overallConfig.weak;
  const aligned = data.signals?.filter((s) => s.status === "aligned").length ?? 0;
  const total = data.signals?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Hero score section */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 ${cfg.border} ${cfg.bg}`}
        style={{ boxShadow: `0 0 60px -15px ${cfg.glow.includes("emerald") ? "rgba(16,185,129,0.15)" : cfg.glow.includes("amber") ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"}` }}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.03]" style={{
          background: `radial-gradient(circle, ${cfg.gradient.includes("emerald") ? "#10b981" : cfg.gradient.includes("amber") ? "#f59e0b" : "#ef4444"} 0%, transparent 70%)`,
        }} />

        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <ScoreRing percentage={cfg.percentage} gradient={cfg.gradient} />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h3 className={`text-2xl font-black tracking-tight ${cfg.text}`}>
                {cfg.label} Alignment
              </h3>
            </div>
            <p className="text-sm text-zinc-400 mb-3">
              {aligned} of {total} algorithm signals aligned
            </p>
            <div className="flex gap-4 justify-center sm:justify-start">
              {(["aligned", "partially_aligned", "misaligned"] as const).map((status) => {
                const count = data.signals?.filter((s) => s.status === status).length ?? 0;
                const sc = statusConfig[status];
                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                    <span className="text-xs text-zinc-400">
                      {count} {sc.label.toLowerCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Signal grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {data.signals?.map((s, i) => (
          <SignalCard key={i} signal={s} />
        ))}
      </div>

      {/* Gap & Strength callouts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-amber-500/15 p-1.5">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
                #1 Opportunity
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{data.biggestGap}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-lg bg-emerald-500/15 p-1.5">
              <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1.5">
                Biggest Strength
              </p>
              <p className="text-sm text-zinc-300 leading-relaxed">{data.biggestStrength}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
