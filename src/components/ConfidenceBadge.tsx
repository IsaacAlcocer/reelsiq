interface ConfidenceBadgeProps {
  level: "high" | "medium" | "low";
}

const config = {
  high: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  medium: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  low: {
    bg: "bg-zinc-700/40",
    border: "border-zinc-600/30",
    text: "text-zinc-500",
    dot: "bg-zinc-500",
  },
} as const;

export default function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const c = config[level] ?? config.low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.border} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {level}
    </span>
  );
}
