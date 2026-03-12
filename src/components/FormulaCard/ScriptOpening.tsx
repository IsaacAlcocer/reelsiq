import { useState } from "react";

export default function ScriptOpening({ data }: { data: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] to-transparent p-6 overflow-hidden">
      {/* Decorative quote mark */}
      <div className="pointer-events-none absolute -left-2 -top-4 text-8xl font-black text-violet-500/[0.06] leading-none select-none">
        &ldquo;
      </div>

      <blockquote className="relative text-base font-medium text-zinc-200 leading-relaxed italic">
        {data}
      </blockquote>

      <button
        onClick={handleCopy}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-500/20 transition-colors"
      >
        {copied ? (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy script
          </>
        )}
      </button>
    </div>
  );
}
