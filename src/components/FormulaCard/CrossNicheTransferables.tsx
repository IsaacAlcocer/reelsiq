export default function CrossNicheTransferables({ data }: { data: string[] }) {
  return (
    <div className="space-y-2.5">
      {data.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-zinc-700"
        >
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400">
            {i + 1}
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  );
}
