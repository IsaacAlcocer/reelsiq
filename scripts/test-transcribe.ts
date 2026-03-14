/**
 * Test script for the Groq Whisper fallback transcription pipeline.
 *
 * Tests with a reel that has no captions to exercise the full pipeline:
 *   Scrape -> transcript quality gate -> ffmpeg -> Groq Whisper
 *
 * Usage:
 *   npx tsx scripts/test-transcribe.ts
 *   npx tsx scripts/test-transcribe.ts https://www.instagram.com/reel/YOUR_URL/
 *
 * Requires GROQ_API_KEY in .env, yt-dlp + ffmpeg installed
 */

import "dotenv/config";
import { scrapeReels } from "../src/lib/scraper";
import { ensureTranscript } from "../src/lib/transcribe";

// Default test URL — a reel likely to have no/short captions.
// Override by passing a URL as a CLI argument.
const DEFAULT_URL = "https://www.instagram.com/reel/DFa3rjSpIks/";

async function main() {
  const testUrl = process.argv[2] || DEFAULT_URL;

  console.log("=== ReelsIQ — Transcription Pipeline Test ===\n");
  console.log(`Test URL: ${testUrl}\n`);

  // Step 1: Scrape the reel with Apify
  console.log("--- Step 1: Scraping ---");
  const startScrape = Date.now();
  const reels = await scrapeReels([testUrl]);
  const scrapeTime = ((Date.now() - startScrape) / 1000).toFixed(1);

  if (reels.length === 0) {
    console.error("No results from scraper. The URL may be invalid or private.");
    process.exit(1);
  }

  const reel = reels[0];
  console.log(`Scrape completed in ${scrapeTime}s`);
  console.log(`  Owner:        @${reel.ownerUsername ?? "unknown"}`);
  console.log(`  Views:        ${reel.viewCount?.toLocaleString() ?? "N/A"}`);
  console.log(`  Duration:     ${reel.durationSeconds ?? "N/A"}s`);
  console.log(`  Video URL:    ${reel.videoUrl ? "present" : "MISSING"}`);
  console.log(
    `  Scraped transcript: ${reel.transcriptWordCount} words (usable: ${reel.hasUsableTranscript})`
  );
  if (reel.transcript) {
    console.log(
      `  Preview: "${reel.transcript.slice(0, 120)}${reel.transcript.length > 120 ? "..." : ""}"`
    );
  }
  console.log();

  // Step 2: Run through transcript quality gate
  console.log("--- Step 2: Transcript Quality Gate ---");
  const startTranscribe = Date.now();
  const result = await ensureTranscript(reel);
  const transcribeTime = ((Date.now() - startTranscribe) / 1000).toFixed(1);

  console.log(`\nQuality gate completed in ${transcribeTime}s`);
  console.log();

  // Step 3: Show results
  console.log("--- Results ---");
  console.log(`  Source:       ${result.source}`);
  console.log(`  Word count:   ${result.wordCount}`);
  console.log(`  Visual-only:  ${result.visualOnly}`);

  if (result.transcript) {
    console.log(`\n  Full transcript:`);
    console.log(`  "${result.transcript}"`);
  } else {
    console.log(`\n  No transcript available.`);
  }

  console.log();

  // Interpretation
  if (result.source === "scraper") {
    console.log(
      "Result: Scraped transcript was sufficient (>= 30 words). Whisper was NOT needed."
    );
    console.log(
      "To test the Whisper fallback, try a reel with no spoken captions."
    );
  } else if (result.source === "whisper" && !result.visualOnly) {
    console.log(
      "Result: Whisper fallback succeeded! Transcript is usable (>= 20 words)."
    );
  } else if (result.source === "whisper" && result.visualOnly) {
    console.log(
      "Result: Whisper ran but returned < 20 words. Flagged as visual-only."
    );
  } else {
    console.log(
      "Result: No transcript source available (no video URL or all methods failed)."
    );
  }
}

main().catch((err) => {
  console.error("\nTest failed:", err);
  process.exit(1);
});
