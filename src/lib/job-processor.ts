// ---------------------------------------------------------------------------
// Job Processor — orchestrates the full pipeline (Section 12)
// ---------------------------------------------------------------------------

import type { Job, SkipReason } from "./job-store";
import type { ScrapedReel } from "./scraper";
import type { TranscriptResult } from "./transcribe";
import type { ReelAnalysis, AnalyzeResult } from "./analyze";
import { scrapeReels } from "./scraper";
import { ensureTranscript } from "./transcribe";
import { analyzeReel } from "./analyze";
import { synthesize } from "./synthesize";
import { saveJobResult } from "./job-persistence";

// ---------------------------------------------------------------------------
// Concurrency helper
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

export async function processJob(job: Job): Promise<void> {
  try {
    // ------------------------------------------------------------------
    // 1. SCRAPE PHASE — yt-dlp scraping (or Apify if configured)
    // ------------------------------------------------------------------
    job.status = "scraping";
    job.progress.stage = "scraping";

    const allInputs = [
      ...job.urls,
      ...job.handles.map((h) => h),
    ];
    job.progress.total = allInputs.length;

    let reels: ScrapedReel[];
    try {
      reels = await scrapeReels(allInputs);
    } catch (err) {
      job.status = "error";
      job.errorMessage = `Scraping failed: ${(err as Error).message}`;
      return;
    }

    // If handles were used, sort by views and take top N based on depth
    if (job.handles.length > 0) {
      reels.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
      const limit = job.depth === "quick" ? 10 : 25;
      reels = reels.slice(0, limit);
    }

    job.progress.completed = reels.length;
    job.progress.total = reels.length;

    if (reels.length === 0) {
      job.status = "error";
      job.errorMessage =
        "No analyzable content found. This may be because the reels have no spoken audio or the accounts are private.";
      return;
    }

    // ------------------------------------------------------------------
    // 2. TRANSCRIPT QUALITY GATE — max 5 concurrent (Groq Whisper)
    // ------------------------------------------------------------------
    job.status = "transcribing";
    job.progress.stage = "transcribing";
    job.progress.completed = 0;
    job.progress.total = reels.length;

    const transcripts: TranscriptResult[] = new Array(reels.length);
    const skipReasons: SkipReason[] = [];

    await runWithConcurrency(reels, 5, async (reel, i) => {
      try {
        transcripts[i] = await ensureTranscript(reel);
      } catch (err) {
        transcripts[i] = {
          transcript: null,
          wordCount: 0,
          source: "none",
          visualOnly: true,
        };
        skipReasons.push({
          url: reel.url,
          reason: `Transcription failed: ${(err as Error).message}`,
        });
      }
      job.progress.completed = transcripts.filter(Boolean).length;
    });

    // Filter out visual-only / failed transcriptions
    const analyzable: Array<{
      reel: ScrapedReel;
      transcript: TranscriptResult;
    }> = [];

    for (let i = 0; i < reels.length; i++) {
      if (transcripts[i].visualOnly || !transcripts[i].transcript) {
        skipReasons.push({
          url: reels[i].url,
          reason: transcripts[i].visualOnly
            ? "Visual-only / no spoken content"
            : "No transcript available",
        });
      } else {
        analyzable.push({ reel: reels[i], transcript: transcripts[i] });
      }
    }

    job.progress.skipped = skipReasons.length;
    job.progress.skipReasons = skipReasons;

    if (analyzable.length === 0) {
      job.status = "error";
      job.errorMessage =
        "No analyzable content found. This may be because the reels have no spoken audio or the accounts are private.";
      return;
    }

    // ------------------------------------------------------------------
    // 3. ANALYZE PHASE — max 10 concurrent (Claude Haiku)
    // ------------------------------------------------------------------
    job.status = "analyzing";
    job.progress.stage = "analyzing";
    job.progress.completed = 0;
    job.progress.total = analyzable.length;

    const analyzeResults: AnalyzeResult[] = new Array(analyzable.length);

    await runWithConcurrency(analyzable, 10, async (item, i) => {
      try {
        analyzeResults[i] = await analyzeReel(item.reel, item.transcript);
      } catch (err) {
        analyzeResults[i] = {
          analysis: null,
          error: `Analysis failed: ${(err as Error).message}`,
          retried: false,
        };
      }
      job.progress.completed++;
    });

    const successfulAnalyses: ReelAnalysis[] = [];
    const individualAnalyses: Array<{
      url: string;
      analysis: ReelAnalysis | null;
      error: string | null;
    }> = [];

    for (let i = 0; i < analyzable.length; i++) {
      const { analysis, error } = analyzeResults[i];
      individualAnalyses.push({
        url: analyzable[i].reel.url,
        analysis,
        error,
      });
      if (analysis) {
        successfulAnalyses.push(analysis);
      } else if (error) {
        job.progress.skipped++;
        job.progress.skipReasons.push({
          url: analyzable[i].reel.url,
          reason: error,
        });
      }
    }

    if (successfulAnalyses.length === 0) {
      job.status = "error";
      job.errorMessage =
        "No analyzable content found. This may be because the reels have no spoken audio or the accounts are private.";
      return;
    }

    // ------------------------------------------------------------------
    // 4. SYNTHESIS PHASE — single Sonnet call
    // ------------------------------------------------------------------
    job.status = "synthesizing";
    job.progress.stage = "synthesizing";
    job.progress.completed = 0;
    job.progress.total = 1;

    const synthesisResult = await synthesize(
      successfulAnalyses,
      job.niche,
      job.goal
    );

    if (!synthesisResult.formulaCard) {
      job.status = "error";
      job.errorMessage = `Synthesis failed: ${synthesisResult.error}`;
      return;
    }

    job.progress.completed = 1;

    // ------------------------------------------------------------------
    // Done
    // ------------------------------------------------------------------
    job.status = "complete";
    job.progress.stage = "complete";
    job.result = {
      formulaCard: synthesisResult.formulaCard,
      individualAnalyses,
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
