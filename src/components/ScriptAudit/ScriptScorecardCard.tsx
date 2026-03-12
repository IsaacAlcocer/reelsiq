"use client";

import { useState } from "react";
import type { ScriptScorecard } from "@/types/script-audit";
import VerdictBadge from "./VerdictBadge";
import GradeBadge from "./GradeBadge";

// ---------------------------------------------------------------------------
// Score ring (reused pattern from AlgorithmAlignment)
// ---------------------------------------------------------------------------

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color =
    score >= 70 ? "emerald" : score >= 40 ? "amber" : "red";

  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96">
        <circle
          cx="48" cy="48" r="40"
          stroke="currentColor" strokeWidth="6" fill="none"
          className="text-zinc-800/60"
        />
        <circle
          cx="48" cy="48" r="40"
          strokeWidth="6" fill="none" strokeLinecap="round"
          className={`text-${color}-500`}
          style={{
            stroke: color === "emerald" ? "#10b981" : color === "amber" ? "#f59e0b" : "#ef4444",
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: "stroke-dashoffset 1s ease-out",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tabular-nums">{score}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Severity badge for issues
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = {
    critical: "bg-red-500/10 border-red-500/20 text-red-400",
    moderate: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    minor: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
  }[severity] ?? "bg-zinc-500/10 border-zinc-500/20 text-zinc-400";

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cfg}`}>
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Assessment section
// ---------------------------------------------------------------------------

function AssessmentSection({
  title,
  icon,
  grade,
  feedback,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  grade: "strong" | "moderate" | "weak";
  feedback: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">{icon}</span>
          <h4 className="text-sm font-semibold text-zinc-200">{title}</h4>
        </div>
        <GradeBadge grade={grade} />
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{feedback}</p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main scorecard component
// ---------------------------------------------------------------------------

export default function ScriptScorecardCard({
  scorecard,
  index,
}: {
  scorecard: ScriptScorecard;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-6 py-5 text-left hover:bg-zinc-800/20 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <ScoreRing score={scorecard.overallScore} />
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-zinc-100 truncate">
              {scorecard.scriptTitle}
            </h3>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <VerdictBadge verdict={scorecard.overallVerdict} />
              {scorecard.topIssues.filter((i) => i.severity === "critical").length > 0 && (
                <span className="text-[10px] text-red-400">
                  {scorecard.topIssues.filter((i) => i.severity === "critical").length} critical issue{scorecard.topIssues.filter((i) => i.severity === "critical").length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-zinc-500 transition-transform duration-200 shrink-0 ml-4 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-800 px-6 py-6 space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <p className="text-sm text-zinc-300 leading-relaxed">{scorecard.summaryNote}</p>
          </div>

          {/* Assessment grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Hook */}
            <AssessmentSection
              title="Hook"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              grade={scorecard.hookAssessment.grade}
              feedback={scorecard.hookAssessment.feedback}
            >
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Two-Step Test:</span>{" "}
                  {scorecard.hookAssessment.twoStepTestVerdict}
                </p>
                {scorecard.hookAssessment.hookText && (
                  <p className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-400">Hook:</span>{" "}
                    &ldquo;{scorecard.hookAssessment.hookText}&rdquo;
                  </p>
                )}
              </div>
            </AssessmentSection>

            {/* Packaging */}
            <AssessmentSection
              title="Packaging"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              grade={scorecard.packagingAssessment.grade}
              feedback={scorecard.packagingAssessment.feedback}
            >
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Detected:</span>{" "}
                  {scorecard.packagingAssessment.detectedFramework}
                </p>
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Recommended:</span>{" "}
                  {scorecard.packagingAssessment.recommendedFramework}
                </p>
              </div>
            </AssessmentSection>

            {/* Retention */}
            <AssessmentSection
              title="Retention"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              grade={scorecard.retentionAssessment.grade}
              feedback={scorecard.retentionAssessment.feedback}
            >
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Payoff:</span>{" "}
                  {scorecard.retentionAssessment.payoffPosition?.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">Interrupts:</span>{" "}
                  {scorecard.retentionAssessment.interruptDensity?.replace(/_/g, " ")}
                </p>
              </div>
            </AssessmentSection>

            {/* Authenticity */}
            <AssessmentSection
              title="Authenticity"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              grade={scorecard.authenticityAssessment.grade}
              feedback={scorecard.authenticityAssessment.feedback}
            >
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">
                  <span className="font-medium text-zinc-400">AI Detection Risk:</span>{" "}
                  <span className={
                    scorecard.authenticityAssessment.aiDetectionRisk === "high"
                      ? "text-red-400"
                      : scorecard.authenticityAssessment.aiDetectionRisk === "medium"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }>
                    {scorecard.authenticityAssessment.aiDetectionRisk}
                  </span>
                </p>
                {scorecard.authenticityAssessment.flaggedPhrases?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {scorecard.authenticityAssessment.flaggedPhrases.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400"
                      >
                        &ldquo;{p}&rdquo;
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </AssessmentSection>
          </div>

          {/* Algorithm Alignment */}
          {scorecard.algorithmAlignment?.signals?.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-zinc-200">Algorithm Signals</h4>
                </div>
                <GradeBadge grade={scorecard.algorithmAlignment.grade} />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {scorecard.algorithmAlignment.signals.map((s, i) => {
                  const statusCfg = {
                    aligned: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
                    partially_aligned: "border-amber-500/20 bg-amber-500/5 text-amber-400",
                    misaligned: "border-red-500/20 bg-red-500/5 text-red-400",
                  }[s.status] ?? "border-zinc-700 bg-zinc-800/50 text-zinc-400";

                  return (
                    <div key={i} className={`rounded-lg border p-2.5 ${statusCfg}`}>
                      <p className="text-xs font-semibold">{s.signal}</p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">{s.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Issues */}
          {scorecard.topIssues?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
                Issues to Fix
              </h4>
              <div className="space-y-2">
                {scorecard.topIssues.map((issue, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-[10px] font-medium text-zinc-500 uppercase">
                        {issue.area}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 mb-1.5">{issue.issue}</p>
                    <p className="text-sm text-violet-300/80">
                      <span className="font-medium">Fix:</span> {issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refined opening */}
          {scorecard.refinedOpening && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-400">
                Refined Opening
              </h4>
              <p className="text-sm text-zinc-200 leading-relaxed italic">
                &ldquo;{scorecard.refinedOpening}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
