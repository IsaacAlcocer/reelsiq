"use client";

import { useState, useMemo } from "react";
import { glossary } from "@/lib/glossary";

const pipelineSteps = [
  {
    num: 1,
    title: "Input",
    description: "Paste Reel URLs or Instagram handles",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    num: 2,
    title: "Scrape & Transcript",
    description: "yt-dlp extracts video data and metadata, Groq Whisper transcribes audio",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    num: 3,
    title: "Per-Reel Analysis",
    description: "Claude Haiku 4.5 extracts hooks, packaging, retention signals from each transcript",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    num: 4,
    title: "Theory-Enhanced Synthesis",
    description: "Claude Sonnet 4.5 cross-references patterns against Instagram Growth Theory",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    num: 5,
    title: "Formula Card",
    description: "A structured playbook with actionable insights and deployment steps",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const cardSections = [
  {
    num: "01",
    title: "Algorithm Alignment Score",
    description: "The hero metric. Shows how well the analyzed content aligns with what Instagram's algorithm rewards in 2026 — session time, viewer satisfaction, and engagement signals.",
  },
  {
    num: "02",
    title: "Hook Diagnostic",
    description: "Tests every hook against the Two-Step Test (clarity + curiosity gap) and Brain Trigger Trifecta (visual + text + spoken). Reveals what makes hooks work in your niche.",
  },
  {
    num: "03",
    title: "Winning Hook Formulas",
    description: "Reusable fill-in-the-blank templates extracted from top performers, ranked by frequency, with confidence levels and psychology notes explaining why they work.",
  },
  {
    num: "04",
    title: "Packaging Strategy",
    description: "The structural frameworks (Comparison A vs B, Contrarian Gap, etc.) used to make information inherently interesting. Packaging matters more than hooks.",
  },
  {
    num: "05",
    title: "Retention Architecture",
    description: "Payoff delay positioning, rhetorical interrupt density, and narrative structures. The engineering behind keeping viewers watching to the end.",
  },
  {
    num: "06",
    title: "Vocabulary & Rhythm",
    description: "Language register, sentence style, words that drive engagement, and words that kill trust. Includes an authenticity check against the 2026 Trust Recession.",
  },
  {
    num: "07",
    title: "Emotional Journey",
    description: "The emotional arc that runs through the content — from curiosity to insight, frustration to relief. Effective reels engineer a deliberate emotional sequence.",
  },
  {
    num: "08",
    title: "Session Time Strategy",
    description: "CTA session behavior analysis, session killer warnings, bingeability score, and signature series concepts to maximize time-on-platform.",
  },
  {
    num: "09",
    title: "CTA Patterns",
    description: "Call-to-action styles categorized as soft, direct, or embedded, each rated for whether they extend or kill the viewing session.",
  },
  {
    num: "10",
    title: "Cross-Niche Transferables",
    description: "Universal engagement mechanics that work regardless of niche — patterns you can adapt to any topic.",
  },
  {
    num: "11",
    title: "Script Opening",
    description: "A ready-to-use script opening synthesized from the winning patterns, with a copy button for immediate use.",
  },
  {
    num: "12",
    title: "Top Insight",
    description: "The single most impactful finding from the entire analysis. If you implement only one thing, make it this.",
  },
  {
    num: "13",
    title: "Deployment Playbook",
    description: "Week-by-week action plan: trial reel strategy, story sequences, optimization loops, series launch plans, PCR tracking, and posting cadence.",
  },
];

export default function GuidePage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"how" | "card" | "glossary">("how");

  const filteredGlossary = useMemo(() => {
    const entries = Object.entries(glossary);
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      ([, entry]) =>
        entry.label.toLowerCase().includes(q) ||
        entry.shortDescription.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition mb-6"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </a>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Reels<span className="text-violet-400">IQ</span> Guide
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Learn how the analysis works, what each section means, and the theory behind it all.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-1 mb-8">
        {([
          { key: "how", label: "How It Works" },
          { key: "card", label: "Reading Your Card" },
          { key: "glossary", label: "Glossary" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? "bg-violet-500/15 text-violet-400 border border-violet-500/25"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* How It Works */}
      {activeTab === "how" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-200 mb-6">Analysis Pipeline</h2>

            <div className="space-y-0">
              {pipelineSteps.map((step, i) => (
                <div key={step.num} className="relative flex gap-4">
                  {/* Vertical connector */}
                  {i < pipelineSteps.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-px bg-zinc-800" />
                  )}

                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/25">
                    {step.icon}
                  </div>

                  <div className="pb-8 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Step {step.num}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-200">{step.title}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#0c0c0e] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-200 mb-4">The Theory Engine</h2>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              ReelsIQ doesn&apos;t just report patterns — it evaluates them against a proven Instagram Growth Theory framework covering:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Algorithm Mechanics", desc: "Session time optimization, ranking signals, multi-wave distribution" },
                { label: "Hook Science", desc: "Two-Step Test, Brain Trigger Trifecta, cold audience psychology" },
                { label: "Retention Architecture", desc: "Payoff delay, rhetorical interrupts, narrative structures" },
                { label: "Session Strategy", desc: "Bingeability, signature series, CTA session impact" },
                { label: "Packaging > Hooks", desc: "Structural frameworks that make ideas inherently interesting" },
                { label: "Trust Recession", desc: "2026 authenticity demands and anti-AI audience sentiment" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">{item.label}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reading Your Card */}
      {activeTab === "card" && (
        <div className="space-y-3">
          {cardSections.map((section) => (
            <div
              key={section.num}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-500 tabular-nums mt-0.5">
                  {section.num}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200 mb-1">{section.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{section.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Glossary */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {filteredGlossary.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-8">No matching terms found.</p>
            )}
            {filteredGlossary.map(([key, entry]) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-700"
              >
                <h3 className="text-sm font-bold text-violet-400 mb-1.5">{entry.label}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed mb-2">{entry.shortDescription}</p>
                <div className="border-t border-zinc-800 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Example</p>
                  <p className="text-xs text-zinc-400 leading-relaxed italic">{entry.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-zinc-800/80 pt-4">
        <p className="text-[10px] text-zinc-600 text-center tracking-wider">
          ReelsIQ &middot; Theory-enhanced analysis powered by Instagram Growth Framework
        </p>
      </div>
    </main>
  );
}
