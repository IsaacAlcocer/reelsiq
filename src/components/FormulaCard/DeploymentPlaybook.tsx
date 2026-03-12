import type { DeploymentPlaybookData } from "@/types/formula-card";
import InfoTip from "@/components/InfoTip";

interface PlaybookItem {
  icon: React.ReactNode;
  title: string;
  infoKey?: string;
  content: string | null;
  accent: string;
}

function StorySequenceContent({ data }: { data: DeploymentPlaybookData["storySequence"] }) {
  if (!data) return null;
  const stories = [
    { num: 1, label: "Curiosity Opener", text: data.story1 },
    { num: 2, label: "Context Layer", text: data.story2 },
    { num: 3, label: "CTA to Watch", text: data.story3 },
  ];

  return (
    <div className="space-y-3 mt-3">
      {stories.map((s) => (
        <div key={s.num} className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-400 border border-violet-500/30">
            {s.num}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{s.label}</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{s.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DeploymentPlaybook({ data }: { data: DeploymentPlaybookData }) {
  const items: PlaybookItem[] = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Trial Reel Strategy",
      content: data.trialReelStrategy,
      accent: "from-emerald-500/20 to-emerald-500/5",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Story Sequence",
      content: data.storySequence ? "__story__" : null,
      accent: "from-violet-500/20 to-violet-500/5",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: "Optimization Loop",
      content: data.optimizationLoop,
      accent: "from-amber-500/20 to-amber-500/5",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      title: "Series Launch Plan",
      content: data.seriesLaunchPlan,
      accent: "from-blue-500/20 to-blue-500/5",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "PCR Tracking",
      infoKey: "pcr" as const,
      content: data.pcrTracking,
      accent: "from-cyan-500/20 to-cyan-500/5",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Posting Cadence",
      content: data.postingCadence,
      accent: "from-pink-500/20 to-pink-500/5",
    },
  ];

  const filteredItems = items.filter((item) => item.content);

  return (
    <div className="space-y-4">
      {/* Hero header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 p-2.5 border border-violet-500/20">
          <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">Your next steps</p>
          <p className="text-sm font-semibold text-zinc-200">Execute this week</p>
        </div>
      </div>

      {/* Playbook items */}
      {filteredItems.map((item, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
        >
          {/* Subtle gradient accent */}
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${item.accent} opacity-30`} />

          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-zinc-800/80 p-1.5 text-violet-400">
                {item.icon}
              </div>
              <h4 className="text-sm font-bold text-zinc-200">{item.title}{item.infoKey && <InfoTip termKey={item.infoKey} />}</h4>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                {i + 1}
              </span>
            </div>

            {item.content === "__story__" ? (
              <StorySequenceContent data={data.storySequence} />
            ) : (
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {item.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
