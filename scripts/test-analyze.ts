/**
 * Test script for the per-reel Claude analysis pipeline.
 *
 * Scrapes 5 reels, ensures transcripts, then analyzes each with Claude Haiku 4.5.
 *
 * Usage:
 *   npx tsx scripts/test-analyze.ts
 *   npx tsx scripts/test-analyze.ts url1 url2 url3 url4 url5
 *
 * Requires GROQ_API_KEY and ANTHROPIC_API_KEY in .env, yt-dlp installed
 */

import "dotenv/config";
import { scrapeReels } from "../src/lib/scraper";
import { ensureTranscripts } from "../src/lib/transcribe";
import { analyzeReel } from "../src/lib/analyze";

const DEFAULT_URLS = [
  "https://www.instagram.com/p/DUWFvpHDFP4/",
  "https://www.instagram.com/p/DTtqi4Sj_Jc/",
  "https://www.instagram.com/p/DSdAxQfia6c/",
  "https://www.instagram.com/p/DUEJj2xKsS-/",
  "https://www.instagram.com/p/DT1JZvGqVhk/",
];

async function main() {
  const urls = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_URLS;

  console.log("=== ReelsIQ — Analysis Pipeline Test ===\n");
  console.log(`Testing ${urls.length} reel(s)\n`);

  // Step 1: Scrape
  console.log("--- Step 1: Scraping ---");
  const startScrape = Date.now();
  const reels = await scrapeReels(urls);
  console.log(
    `Scraped ${reels.length} reel(s) in ${((Date.now() - startScrape) / 1000).toFixed(1)}s\n`
  );

  if (reels.length === 0) {
    console.error("No results from scraper.");
    process.exit(1);
  }

  // Step 2: Transcripts
  console.log("--- Step 2: Transcript Quality Gate ---");
  const startTranscribe = Date.now();
  const transcripts = await ensureTranscripts(reels);
  console.log(
    `Transcripts ready in ${((Date.now() - startTranscribe) / 1000).toFixed(1)}s\n`
  );

  // Step 3: Analyze each reel
  console.log("--- Step 3: Claude Analysis (Haiku 4.5) ---\n");

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i];
    const transcript = transcripts[i];

    console.log(
      `[${i + 1}/${reels.length}] Analyzing: ${reel.url}`
    );
    console.log(
      `  Owner: @${reel.ownerUsername ?? "unknown"} | Views: ${reel.viewCount?.toLocaleString() ?? "N/A"} | Transcript: ${transcript.wordCount} words (${transcript.source})`
    );

    if (transcript.visualOnly || !transcript.transcript) {
      console.log("  SKIPPED — visual-only / no transcript\n");
      failCount++;
      continue;
    }

    const startAnalyze = Date.now();
    const result = await analyzeReel(reel, transcript);
    const analyzeTime = ((Date.now() - startAnalyze) / 1000).toFixed(1);

    if (result.analysis) {
      successCount++;
      const a = result.analysis;
      console.log(`  Analyzed in ${analyzeTime}s${result.retried ? " (retried)" : ""}`);
      console.log(`  Hook:        [${a.hookCategory}] "${a.hookText}"`);
      console.log(`  Clarity:     ${a.hookClarity} | Curiosity: ${a.hookCuriosityGap}`);
      console.log(
        `  Trifecta:    text=${a.brainTriggerTrifecta.textHookPresent} spoken=${a.brainTriggerTrifecta.spokenHookPresent} visual=${a.brainTriggerTrifecta.visualContextClue ?? "null"}`
      );
      console.log(`  Narrative:   ${a.narrativeType} | Packaging: ${a.packagingFramework}`);
      console.log(`  Tension:     ${a.tensionMechanism}`);
      console.log(`  Open loop:   ${a.openLoop ? a.openLoopText : "none"}`);
      console.log(`  Payoff:      ${a.payoffPosition} — ${a.payoffNote}`);
      console.log(`  Interrupts:  ${a.rhetoricalInterrupts} (${a.rhetoricalInterruptExamples.join("; ")})`);
      console.log(`  Voice:       ${a.vocabularyLevel} / ${a.sentenceRhythm}`);
      console.log(`  Emotion:     ${a.emotionalCore}`);
      console.log(`  CTA:         [${a.ctaStyle}] ${a.ctaText ?? "none"}`);
      console.log(`  Session:     ${a.sessionBehavior} — ${a.sessionNote}`);
      console.log(`  Length:      ${a.scriptLength} (~${a.estimatedWordCount} words, ${a.durationBucket})`);
      console.log(`  Key phrases: ${a.keyPhrases.join(", ")}`);
      console.log(`  Insight:     ${a.transferableInsight}`);
    } else {
      failCount++;
      console.log(`  FAILED: ${result.error}`);
    }
    console.log();
  }

  // Summary
  console.log("--- Summary ---");
  console.log(`  Successful: ${successCount}/${reels.length}`);
  console.log(`  Failed:     ${failCount}/${reels.length}`);
}

main().catch((err) => {
  console.error("\nTest failed:", err);
  process.exit(1);
});
