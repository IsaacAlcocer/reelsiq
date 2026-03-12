/**
 * Test script for the theory-enhanced synthesis pipeline.
 *
 * Scrapes 5 reels, transcribes, analyzes each with Haiku, then synthesizes
 * all analyses into a Formula Card with Sonnet 4.5.
 *
 * Usage:
 *   npx tsx scripts/test-synthesize.ts
 *   npx tsx scripts/test-synthesize.ts url1 url2 url3 url4 url5
 *
 * Requires APIFY_API_TOKEN, GROQ_API_KEY, and ANTHROPIC_API_KEY in .env
 */

import "dotenv/config";
import { scrapeReels } from "../src/lib/apify";
import { ensureTranscripts } from "../src/lib/transcribe";
import { analyzeReel, type ReelAnalysis } from "../src/lib/analyze";
import { synthesize } from "../src/lib/synthesize";

const DEFAULT_URLS = [
  "https://www.instagram.com/p/DVeGTOBkWaC/",
  "https://www.instagram.com/p/DVOh-3jlEms/",
  "https://www.instagram.com/p/DVZrETBDQSw/",
  "https://www.instagram.com/p/DVWfYYXiXxd/",
  "https://www.instagram.com/p/DVZPfRXiVcj/",
];

const NICHE = "video editing education";
const GOAL = "Grow following";

async function main() {
  const urls = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_URLS;

  console.log("=== ReelsIQ — Full Synthesis Pipeline Test ===\n");
  console.log(`Niche: ${NICHE}`);
  console.log(`Goal:  ${GOAL}`);
  console.log(`Reels: ${urls.length}\n`);

  // Step 1: Scrape
  console.log("--- Step 1: Scraping with Apify ---");
  const startScrape = Date.now();
  const reels = await scrapeReels(urls);
  console.log(
    `Scraped ${reels.length} reel(s) in ${((Date.now() - startScrape) / 1000).toFixed(1)}s\n`
  );

  if (reels.length === 0) {
    console.error("No results from Apify.");
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
  console.log("--- Step 3: Per-Reel Analysis (Haiku 4.5) ---");
  const analyses: ReelAnalysis[] = [];

  for (let i = 0; i < reels.length; i++) {
    const reel = reels[i];
    const transcript = transcripts[i];

    console.log(`  [${i + 1}/${reels.length}] ${reel.url}`);

    if (transcript.visualOnly || !transcript.transcript) {
      console.log("    SKIPPED — visual-only / no transcript");
      continue;
    }

    const result = await analyzeReel(reel, transcript);
    if (result.analysis) {
      analyses.push(result.analysis);
      console.log(
        `    OK — [${result.analysis.hookCategory}] ${result.retried ? "(retried)" : ""}`
      );
    } else {
      console.log(`    FAILED — ${result.error}`);
    }
  }

  console.log(`\n  ${analyses.length} of ${reels.length} reels analyzed successfully.\n`);

  if (analyses.length === 0) {
    console.error("No successful analyses — cannot synthesize.");
    process.exit(1);
  }

  // Step 4: Synthesize
  console.log("--- Step 4: Theory-Enhanced Synthesis (Sonnet 4.5) ---");
  const startSynth = Date.now();
  const result = await synthesize(analyses, NICHE, GOAL);
  const synthTime = ((Date.now() - startSynth) / 1000).toFixed(1);

  if (!result.formulaCard) {
    console.error(`\nSynthesis FAILED: ${result.error}`);
    process.exit(1);
  }

  console.log(
    `Synthesis complete in ${synthTime}s${result.retried ? " (retried)" : ""}\n`
  );

  // Print full Formula Card
  console.log("=== FORMULA CARD (full JSON) ===\n");
  console.log(JSON.stringify(result.formulaCard, null, 2));
}

main().catch((err) => {
  console.error("\nTest failed:", err);
  process.exit(1);
});
