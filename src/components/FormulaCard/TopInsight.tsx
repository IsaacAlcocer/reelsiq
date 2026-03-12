export default function TopInsight({ data }: { data: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-6 sm:p-8">
      {/* Glow effect */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="shrink-0 rounded-xl bg-violet-500/20 p-3">
          <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-violet-400 mb-3">
            Top Insight
          </h3>
          <p className="text-base font-medium text-zinc-200 leading-relaxed">{data}</p>
        </div>
      </div>
    </div>
  );
}
