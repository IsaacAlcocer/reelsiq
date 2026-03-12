"use client";

import type { FormulaCardData } from "@/types/formula-card";
import AlgorithmAlignment from "./AlgorithmAlignment";
import HookDiagnostic from "./HookDiagnostic";
import WinningHooks from "./WinningHooks";
import PackagingStrategy from "./PackagingStrategy";
import RetentionArchitecture from "./RetentionArchitecture";
import VocabularyProfile from "./VocabularyProfile";
import EmotionalJourney from "./EmotionalJourney";
import SessionTimeStrategy from "./SessionTimeStrategy";
import CTAPatterns from "./CTAPatterns";
import CrossNicheTransferables from "./CrossNicheTransferables";
import ScriptOpening from "./ScriptOpening";
import TopInsight from "./TopInsight";
import DeploymentPlaybook from "./DeploymentPlaybook";
import InfoTip from "@/components/InfoTip";

interface FormulaCardProps {
  data: Record<string, unknown>;
}

function Section({
  title,
  number,
  infoKey,
  children,
}: {
  title: string;
  number: number;
  infoKey?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative" data-tour={infoKey}>
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-500 tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
          {title}
        </h3>
        {infoKey && <InfoTip termKey={infoKey} />}
        <div className="flex-1 h-px bg-zinc-800/80" />
      </div>
      {children}
    </section>
  );
}

export default function FormulaCard({ data }: FormulaCardProps) {
  // Handle both { formulaCard: {...} } and direct formula card data
  const raw = data as Record<string, unknown>;
  const fc = ((raw.formulaCard as FormulaCardData) ?? raw) as FormulaCardData;
  const nicheName = (raw.nicheName as string) ?? "";
  const reelsAnalyzed = (raw.reelsAnalyzed as number) ?? 0;

  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="pointer-events-none absolute -inset-px rounded-[18px] bg-gradient-to-b from-violet-500/20 via-violet-500/5 to-transparent opacity-60" />

      <div className="relative rounded-2xl border border-zinc-800/80 bg-[#0c0c0e] overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-zinc-800/80 bg-gradient-to-r from-violet-500/[0.08] via-transparent to-transparent px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-md bg-violet-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-400 border border-violet-500/25">
                  Formula Card
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {nicheName || "Analysis"}
              </h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                {reelsAnalyzed} reel{reelsAnalyzed !== 1 ? "s" : ""} analyzed
                <span className="mx-2 text-zinc-700">&middot;</span>
                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-10 px-6 py-8 sm:px-8 sm:py-10">
          {/* 1. Algorithm Alignment Score — the hero */}
          {fc.algorithmAlignmentScore && (
            <Section title="Algorithm Alignment Score" number={1} infoKey="algorithmAlignmentScore">
              <AlgorithmAlignment data={fc.algorithmAlignmentScore} />
            </Section>
          )}

          {/* 2. Hook Diagnostic */}
          {fc.hookDiagnostic && (
            <Section title="Hook Diagnostic" number={2} infoKey="hookDiagnostic">
              <HookDiagnostic data={fc.hookDiagnostic} />
            </Section>
          )}

          {/* 3. Winning Hook Formulas */}
          {fc.winningHooks && fc.winningHooks.length > 0 && (
            <Section title="Winning Hook Formulas" number={3} infoKey="winningHooks">
              <WinningHooks data={fc.winningHooks} />
            </Section>
          )}

          {/* 4. Packaging Strategy */}
          {fc.packagingStrategy && (
            <Section title="Packaging Strategy" number={4} infoKey="packagingFramework">
              <PackagingStrategy data={fc.packagingStrategy} />
            </Section>
          )}

          {/* 5. Retention Architecture */}
          {fc.retentionArchitecture && (
            <Section title="Retention Architecture" number={5} infoKey="retentionArchitecture">
              <RetentionArchitecture data={fc.retentionArchitecture} />
            </Section>
          )}

          {/* 6. Vocabulary & Rhythm */}
          {fc.vocabularyProfile && (
            <Section title="Vocabulary & Rhythm" number={6} infoKey="vocabularyProfile">
              <VocabularyProfile data={fc.vocabularyProfile} />
            </Section>
          )}

          {/* 7. Emotional Journey */}
          {fc.emotionalJourney && (
            <Section title="Emotional Journey" number={7} infoKey="emotionalJourney">
              <EmotionalJourney data={fc.emotionalJourney} />
            </Section>
          )}

          {/* 8. Session Time Strategy */}
          {fc.sessionTimeStrategy && (
            <Section title="Session Time Strategy" number={8} infoKey="sessionTimeStrategy">
              <SessionTimeStrategy data={fc.sessionTimeStrategy} />
            </Section>
          )}

          {/* 9. CTA Patterns */}
          {fc.ctaPatterns && fc.ctaPatterns.length > 0 && (
            <Section title="CTA Patterns" number={9} infoKey="ctaPatterns">
              <CTAPatterns data={fc.ctaPatterns} />
            </Section>
          )}

          {/* 10. Cross-Niche Transferables */}
          {fc.crossNicheTransferables && fc.crossNicheTransferables.length > 0 && (
            <Section title="Cross-Niche Transferables" number={10} infoKey="crossNicheTransferables">
              <CrossNicheTransferables data={fc.crossNicheTransferables} />
            </Section>
          )}

          {/* 11. Script Opening */}
          {fc.readyToUseScriptOpening && (
            <Section title="Ready-to-Use Script Opening" number={11}>
              <ScriptOpening data={fc.readyToUseScriptOpening} />
            </Section>
          )}

          {/* 12. Top Insight */}
          {fc.topInsight && (
            <TopInsight data={fc.topInsight} />
          )}

          {/* 13. Deployment Playbook */}
          {fc.deploymentPlaybook && (
            <Section title="Deployment Playbook" number={13} infoKey="deploymentPlaybook">
              <DeploymentPlaybook data={fc.deploymentPlaybook} />
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800/80 px-6 py-4 sm:px-8">
          <p className="text-[10px] text-zinc-600 text-center tracking-wider">
            Generated by ReelsIQ &middot; Theory-enhanced analysis powered by Instagram Growth Framework
          </p>
        </div>
      </div>
    </div>
  );
}
