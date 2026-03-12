import type { VocabularyProfileData } from "@/types/formula-card";

export default function VocabularyProfile({ data }: { data: VocabularyProfileData }) {
  return (
    <div className="space-y-4">
      {/* Level & Style */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Vocabulary Level
          </p>
          <p className="text-sm font-bold text-zinc-200">{data.level?.replace(/_/g, " ")}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
            Sentence Style
          </p>
          <p className="text-sm font-bold text-zinc-200">{data.sentenceStyle}</p>
        </div>
      </div>

      {/* Words to Use */}
      {data.wordsToUse && data.wordsToUse.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80 mb-2">
            Words to Use
          </p>
          <div className="flex flex-wrap gap-2">
            {data.wordsToUse.map((word, i) => (
              <span
                key={i}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-400"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Words to Avoid */}
      {data.wordsToAvoid && data.wordsToAvoid.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400/80 mb-2">
            Words to Avoid
          </p>
          <div className="flex flex-wrap gap-2">
            {data.wordsToAvoid.map((word, i) => (
              <span
                key={i}
                className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 line-through decoration-red-500/40"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Authenticity Note */}
      {data.authenticityNote && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
          <div className="flex items-start gap-2.5">
            <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                Authenticity Check
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">{data.authenticityNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
