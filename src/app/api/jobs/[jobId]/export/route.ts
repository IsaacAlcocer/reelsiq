import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";
import type { ReelsJobResult } from "@/lib/job-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "This analysis has expired. Please run a new analysis." },
      { status: 404 }
    );
  }

  if (job.status !== "complete" || !job.result) {
    return NextResponse.json(
      { error: "Analysis is not yet complete." },
      { status: 400 }
    );
  }

  if (job.jobType === "scripts") {
    return NextResponse.json(
      { error: "Export is not yet supported for script jobs." },
      { status: 400 }
    );
  }

  const reelsResult = job.result as ReelsJobResult;
  const format =
    req.nextUrl.searchParams.get("format") ?? "json";

  if (format === "json") {
    return NextResponse.json(reelsResult.formulaCard);
  }

  if (format === "markdown") {
    const md = formulaCardToMarkdown(reelsResult.formulaCard as unknown as Record<string, unknown>);
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="formula-card-${jobId}.md"`,
      },
    });
  }

  return NextResponse.json(
    { error: 'Invalid format. Use ?format=markdown or ?format=json.' },
    { status: 400 }
  );
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

function formulaCardToMarkdown(card: Record<string, unknown>): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = card as any;
  const c = fc.formulaCard ?? fc;

  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l, "");

  push(
    `# Formula Card — ${fc.nicheName ?? "Analysis"}`,
    `**Reels analyzed:** ${fc.reelsAnalyzed ?? "N/A"}`,
  );

  // Algorithm Alignment
  if (c.algorithmAlignmentScore) {
    const a = c.algorithmAlignmentScore;
    push("## Algorithm Alignment Score", `**Overall:** ${a.overall}`);
    if (a.signals) {
      for (const s of a.signals) {
        push(`- **${s.signal}:** ${s.status} — ${s.note}`);
      }
    }
    push(`**Biggest Gap:** ${a.biggestGap}`, `**Biggest Strength:** ${a.biggestStrength}`);
  }

  // Hook Diagnostic
  if (c.hookDiagnostic) {
    const h = c.hookDiagnostic;
    push("## Hook Diagnostic");
    if (h.twoStepTestResults) {
      const t = h.twoStepTestResults;
      push(
        `- Passed both gates: ${t.passedBothGates}`,
        `- Clarity only: ${t.clarityOnlyNoGap}`,
        `- Gap only: ${t.gapOnlyNoClarity}`,
        `- Failed both: ${t.failedBoth}`,
        `- **Insight:** ${t.insight}`,
      );
    }
    push(`**Dominant hook category:** ${h.dominantHookCategory} (${h.dominantHookCategoryFrequency})`);
  }

  // Winning Hooks
  if (c.winningHooks?.length) {
    push("## Winning Hook Formulas");
    for (const h of c.winningHooks) {
      push(
        `### ${h.category} (${h.confidenceLevel} confidence)`,
        `**Template:** ${h.template}`,
        `**Example:** ${h.example}`,
        `**Two-Step Verdict:** ${h.twoStepVerdict}`,
        `*${h.psychologyNote}*`,
      );
    }
  }

  // Packaging Strategy
  if (c.packagingStrategy) {
    const p = c.packagingStrategy;
    push("## Packaging Strategy", `**Dominant:** ${p.dominantPackaging}`, `**Insight:** ${p.insight}`);
    if (p.recommendedPackaging?.length) {
      push("### Recommended Frameworks");
      for (const r of p.recommendedPackaging) {
        push(`- **${r.framework}:** ${r.template}`, `  *${r.whyItWorks}*`);
      }
    }
  }

  // Retention Architecture
  if (c.retentionArchitecture) {
    const r = c.retentionArchitecture;
    push("## Retention Architecture");
    if (r.payoffDelayAnalysis) {
      push(
        `- Early payoff: ${r.payoffDelayAnalysis.earlyPayoff}`,
        `- Middle payoff: ${r.payoffDelayAnalysis.middlePayoff}`,
        `- Delayed payoff: ${r.payoffDelayAnalysis.delayedPayoff}`,
        `- **Insight:** ${r.payoffDelayAnalysis.insight}`,
      );
    }
    push(`**Interrupt density:** ${r.interruptDensityVerdict} (avg ${r.avgRhetoricalInterrupts})`);
    if (r.dominantStructure) {
      push(`**Dominant structure:** ${r.dominantStructure.type} — ${r.dominantStructure.note}`);
    }
  }

  // Session Time Strategy
  if (c.sessionTimeStrategy) {
    const s = c.sessionTimeStrategy;
    push("## Session Time Strategy", `**Bingeability:** ${s.bingeabilityScore} — ${s.bingeabilityNote}`);
    if (s.sessionKillerWarning) push(`**Warning:** ${s.sessionKillerWarning}`);
    push(`**Series recommendation:** ${s.seriesRecommendation}`);
  }

  // Vocabulary
  if (c.vocabularyProfile) {
    const v = c.vocabularyProfile;
    push(
      "## Vocabulary & Rhythm",
      `**Level:** ${v.level}`,
      `**Words to use:** ${v.wordsToUse?.join(", ")}`,
      `**Words to avoid:** ${v.wordsToAvoid?.join(", ")}`,
      `*${v.authenticityNote}*`,
    );
  }

  // Emotional Journey
  if (c.emotionalJourney) {
    push("## Emotional Journey", c.emotionalJourney);
  }

  // CTA Patterns
  if (c.ctaPatterns?.length) {
    push("## CTA Patterns");
    for (const cta of c.ctaPatterns) {
      push(`- **${cta.style}:** ${cta.template} (${cta.sessionImpact})`);
    }
  }

  // Cross-Niche
  if (c.crossNicheTransferables?.length) {
    push("## Cross-Niche Transferables");
    for (const t of c.crossNicheTransferables) {
      push(`- ${t}`);
    }
  }

  // Script Opening
  if (c.readyToUseScriptOpening) {
    push("## Ready-to-Use Script Opening", `> ${c.readyToUseScriptOpening}`);
  }

  // Top Insight
  if (c.topInsight) {
    push("## Top Insight", `**${c.topInsight}**`);
  }

  // Deployment Playbook
  if (c.deploymentPlaybook) {
    const d = c.deploymentPlaybook;
    push(
      "## Deployment Playbook",
      `### Trial Reel Strategy`, d.trialReelStrategy,
      `### Story Sequence`,
      `1. ${d.storySequence?.story1}`,
      `2. ${d.storySequence?.story2}`,
      `3. ${d.storySequence?.story3}`,
      `### Optimization Loop`, d.optimizationLoop,
      `### Series Launch Plan`, d.seriesLaunchPlan,
      `### PCR Tracking`, d.pcrTracking,
      `### Posting Cadence`, d.postingCadence,
    );
  }

  return lines.join("\n");
}
