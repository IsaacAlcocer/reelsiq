// ---------------------------------------------------------------------------
// Script Job Processor — orchestrates the Script Lab pipeline
// Simplified: Analyze → Audit (skips scrape + transcribe)
// ---------------------------------------------------------------------------

import type { Job } from "./job-store";
import type { ReelAnalysis } from "./analyze";
import type { ScriptAnalyzeResult } from "./analyze-script";
import { analyzeScript } from "./analyze-script";
import { auditScripts } from "./audit";
import { saveJobResult } from "./job-persistence";

// ---------------------------------------------------------------------------
// Concurrency helper (same pattern as job-processor.ts)
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// Main processor
// ---------------------------------------------------------------------------

export async function processScriptJob(job: Job): Promise<void> {
  try {
    const scripts = job.scripts;

    if (scripts.length === 0) {
      job.status = "error";
      job.errorMessage = "No scripts provided.";
      return;
    }

    // ------------------------------------------------------------------
    // 1. ANALYZE PHASE — max 10 concurrent (Claude Haiku)
    // ------------------------------------------------------------------
    job.status = "analyzing";
    job.progress.stage = "analyzing";
    job.progress.completed = 0;
    job.progress.total = scripts.length;

    const analyzeResults: ScriptAnalyzeResult[] = new Array(scripts.length);

    await runWithConcurrency(scripts, 10, async (script, i) => {
      try {
        analyzeResults[i] = await analyzeScript(script.content, script.title);
      } catch (err) {
        analyzeResults[i] = {
          analysis: null,
          error: `Analysis failed: ${(err as Error).message}`,
          retried: false,
        };
      }
      job.progress.completed++;
    });

    const successfulAnalyses: Array<{
      title: string;
      script: string;
      analysis: ReelAnalysis;
    }> = [];
    const individualAnalyses: Array<{
      title: string;
      analysis: ReelAnalysis | null;
      error: string | null;
    }> = [];

    for (let i = 0; i < scripts.length; i++) {
      const { analysis, error } = analyzeResults[i];
      individualAnalyses.push({
        title: scripts[i].title,
        analysis,
        error,
      });
      if (analysis) {
        successfulAnalyses.push({
          title: scripts[i].title,
          script: scripts[i].content,
          analysis,
        });
      } else if (error) {
        job.progress.skipped++;
        job.progress.skipReasons.push({
          url: scripts[i].title,
          reason: error,
        });
      }
    }

    if (successfulAnalyses.length === 0) {
      job.status = "error";
      job.errorMessage =
        "Could not analyze any of the provided scripts. Please try again.";
      return;
    }

    // ------------------------------------------------------------------
    // 2. AUDIT PHASE — single Sonnet call
    // ------------------------------------------------------------------
    job.status = "auditing";
    job.progress.stage = "auditing";
    job.progress.completed = 0;
    job.progress.total = 1;

    const auditResult = await auditScripts(
      successfulAnalyses,
      job.niche,
      job.goal,
      {
        targetAudience: job.targetAudience,
        tone: job.tone,
        offerDescription: job.offerDescription,
      }
    );

    if (!auditResult.auditResult) {
      job.status = "error";
      job.errorMessage = `Audit failed: ${auditResult.error}`;
      return;
    }

    job.progress.completed = 1;

    // ------------------------------------------------------------------
    // Done
    // ------------------------------------------------------------------
    job.status = "complete";
    job.progress.stage = "complete";
    job.result = {
      auditResult: auditResult.auditResult,
      individualAnalyses,
      refinedScripts: {},
    };

    // Persist to disk
    try {
      await saveJobResult(job);
    } catch (persistErr) {
      console.error("[persistence] Failed to save result:", persistErr);
    }
  } catch (err) {
    job.status = "error";
    job.errorMessage = `Unexpected error: ${(err as Error).message}`;
  }
}
