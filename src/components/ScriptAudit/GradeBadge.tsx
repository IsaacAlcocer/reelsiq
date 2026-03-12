const gradeConfig = {
  strong: {
    label: "Strong",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
  },
  moderate: {
    label: "Moderate",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
  },
  weak: {
    label: "Weak",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
  },
} as const;

export default function GradeBadge({
  grade,
}: {
  grade: "strong" | "moderate" | "weak";
}) {
  const cfg = gradeConfig[grade] ?? gradeConfig.moderate;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
