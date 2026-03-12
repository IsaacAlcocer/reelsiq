export default function EmotionalJourney({ data }: { data: string }) {
  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 overflow-hidden">
      {/* Subtle gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/[0.03] via-transparent to-violet-500/[0.03]" />

      <div className="relative flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-violet-500/15 p-2 mt-0.5">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{data}</p>
      </div>
    </div>
  );
}
