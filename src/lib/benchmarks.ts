// ---------------------------------------------------------------------------
// Benchmarks — extract aggregate stats from saved FormulaCard results
// Provides optional context for audit prompts (observations, not rules)
// ---------------------------------------------------------------------------

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const RESULTS_DIR = join(process.cwd(), "data", "results");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BenchmarkStats {
  totalReels: number;
  totalCreators: number;
  niches: string[];
  twoStepPassRate: number; // 0-1
  payoffDelayRate: number; // % in final_third
  avgRhetoricalInterrupts: number;
  structureDistribution: Array<{ framework: string; count: number }>;
  sessionBehavior: {
    profileDrivers: number;
    externalLinks: number;
    engagementPrompts: number;
    seriesReferences: number;
  };
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let _cachedStats: BenchmarkStats | null = null;
let _cachedAt = 0;

// ---------------------------------------------------------------------------
// Extract benchmarks from all saved results
// ---------------------------------------------------------------------------

export async function extractBenchmarks(): Promise<BenchmarkStats | null> {
  // Return cached if fresh
  if (_cachedStats && Date.now() - _cachedAt < CACHE_TTL_MS) {
    return _cachedStats;
  }

  let files: string[];
  try {
    files = await readdir(RESULTS_DIR);
  } catch {
    return null; // directory doesn't exist
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  if (jsonFiles.length === 0) return null;

  let totalReels = 0;
  const creatorSet = new Set<string>();
  const nicheSet = new Set<string>();
  let twoStepPassed = 0;
  let twoStepTotal = 0;
  let delayedPayoffs = 0;
  let totalPayoffs = 0;
  let interruptSum = 0;
  let interruptCount = 0;
  const frameworkCounts = new Map<string, number>();
  const session = { profileDrivers: 0, externalLinks: 0, engagementPrompts: 0, seriesReferences: 0 };

  for (const file of jsonFiles) {
    try {
      const raw = await readFile(join(RESULTS_DIR, file), "utf-8");
      const data = JSON.parse(raw);

      // Only process reels results (not script audits)
      if (data._meta?.jobType !== "reels") continue;

      const fc = data.job?.result?.formulaCard?.formulaCard ?? data.job?.result?.formulaCard;
      if (!fc) continue;

      // Meta
      totalReels += data._meta?.scriptCount || data.job?.result?.formulaCard?.reelsAnalyzed || 0;
      if (data._meta?.handles) {
        for (const h of data._meta.handles) creatorSet.add(h);
      }
      if (data._meta?.niche) nicheSet.add(data._meta.niche);

      // Two-Step Test
      const tst = fc.hookDiagnostic?.twoStepTestResults;
      if (tst) {
        twoStepPassed += tst.passedBothGates || 0;
        twoStepTotal +=
          (tst.passedBothGates || 0) +
          (tst.clarityOnlyNoGap || 0) +
          (tst.gapOnlyNoClarity || 0) +
          (tst.failedBoth || 0);
      }

      // Payoff delay
      const pd = fc.retentionArchitecture?.payoffDelayAnalysis;
      if (pd) {
        delayedPayoffs += pd.delayedPayoff || 0;
        totalPayoffs +=
          (pd.earlyPayoff || 0) +
          (pd.middlePayoff || 0) +
          (pd.delayedPayoff || 0) +
          (pd.noClearPayoff || 0);
      }

      // Interrupts
      const avgInt = fc.retentionArchitecture?.avgRhetoricalInterrupts;
      if (typeof avgInt === "number") {
        interruptSum += avgInt;
        interruptCount++;
      }

      // Structure distribution
      const breakdown = fc.packagingStrategy?.packagingBreakdown;
      if (Array.isArray(breakdown)) {
        for (const item of breakdown) {
          if (item.framework && typeof item.count === "number") {
            frameworkCounts.set(
              item.framework,
              (frameworkCounts.get(item.framework) || 0) + item.count
            );
          }
        }
      }

      // Session behavior
      const sb = fc.sessionTimeStrategy?.sessionBehaviorBreakdown;
      if (sb) {
        session.profileDrivers += sb.profileDrivers || 0;
        session.externalLinks += sb.externalLinks || 0;
        session.engagementPrompts += sb.engagementPrompts || 0;
        session.seriesReferences += sb.seriesReferences || 0;
      }
    } catch {
      // Skip malformed files
    }
  }

  if (totalReels === 0 && twoStepTotal === 0) return null;

  const stats: BenchmarkStats = {
    totalReels,
    totalCreators: creatorSet.size,
    niches: Array.from(nicheSet),
    twoStepPassRate: twoStepTotal > 0 ? twoStepPassed / twoStepTotal : 0,
    payoffDelayRate: totalPayoffs > 0 ? delayedPayoffs / totalPayoffs : 0,
    avgRhetoricalInterrupts: interruptCount > 0 ? interruptSum / interruptCount : 0,
    structureDistribution: Array.from(frameworkCounts.entries())
      .map(([framework, count]) => ({ framework, count }))
      .sort((a, b) => b.count - a.count),
    sessionBehavior: session,
  };

  _cachedStats = stats;
  _cachedAt = Date.now();
  return stats;
}

// ---------------------------------------------------------------------------
// Format benchmarks as prompt context
// ---------------------------------------------------------------------------

export function formatBenchmarksForPrompt(stats: BenchmarkStats): string {
  const lines = [
    "BENCHMARK DATA (observations from analyzed creators — use as data points, not rules):",
    `- ${stats.totalReels} reels from ${stats.totalCreators} creator(s) analyzed across: ${stats.niches.join(", ")}`,
    `- Two-Step Test pass rate: ${Math.round(stats.twoStepPassRate * 100)}%`,
    `- Payoff delayed to final third: ${Math.round(stats.payoffDelayRate * 100)}%`,
    `- Avg rhetorical interrupts per reel: ${stats.avgRhetoricalInterrupts.toFixed(1)}`,
  ];

  if (stats.structureDistribution.length > 0) {
    const top = stats.structureDistribution.slice(0, 5);
    lines.push(
      `- Most common structures: ${top.map((s) => `${s.framework.replace(/_/g, " ")} (${s.count})`).join(", ")}`
    );
  }

  const sb = stats.sessionBehavior;
  const totalCtas =
    sb.profileDrivers + sb.externalLinks + sb.engagementPrompts + sb.seriesReferences;
  if (totalCtas > 0) {
    lines.push(
      `- CTA distribution: ${sb.profileDrivers} profile-drivers, ${sb.engagementPrompts} engagement, ${sb.seriesReferences} series refs, ${sb.externalLinks} external links`
    );
  }

  return lines.join("\n");
}
