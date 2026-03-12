const verdictConfig = {
  ready_to_post: {
    label: "Ready to Post",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  needs_refinement: {
    label: "Needs Refinement",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  },
  rework_needed: {
    label: "Rework Needed",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
} as const;

export default function VerdictBadge({
  verdict,
  size = "md",
}: {
  verdict: "ready_to_post" | "needs_refinement" | "rework_needed";
  size?: "sm" | "md";
}) {
  const cfg = verdictConfig[verdict] ?? verdictConfig.needs_refinement;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text} ${
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } font-bold`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
