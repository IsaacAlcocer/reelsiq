/**
 * Test script for the Instagram Reel Scraper integration.
 *
 * Usage:
 *   npx tsx scripts/test-scraper.ts
 *   npx tsx scripts/test-scraper.ts url1 url2 url3
 *
 * Default backend: yt-dlp (free). Set SCRAPER_BACKEND=apify for Apify.
 * Requires yt-dlp installed and Instagram cookies in Firefox.
 */

import "dotenv/config";
import { scrapeReels } from "../src/lib/scraper";

const DEFAULT_URLS = [
  "https://www.instagram.com/p/DUWFvpHDFP4/",
  "https://www.instagram.com/p/DTtqi4Sj_Jc/",
  "https://www.instagram.com/p/DSdAxQfia6c/",
];

async function main() {
  const urls = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_URLS;
  const backend = process.env.SCRAPER_BACKEND || "ytdlp";

  console.log(`=== ReelsIQ — Scraper Integration Test (${backend}) ===\n`);
  console.log(`Testing with ${urls.length} Reel URL(s):\n`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
  console.log();

  const startTime = Date.now();
  const results = await scrapeReels(urls);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n=== Results (${results.length} reels, ${elapsed}s) ===\n`);

  for (const reel of results) {
    console.log("─".repeat(60));
    console.log(`URL:          ${reel.url}`);
    console.log(`Owner:        @${reel.ownerUsername ?? "unknown"}`);
    console.log(`Views:        ${reel.viewCount?.toLocaleString() ?? "N/A"}`);
    console.log(`Likes:        ${reel.likeCount?.toLocaleString() ?? "N/A"}`);
    console.log(`Shares:       ${reel.shareCount?.toLocaleString() ?? "N/A"}`);
    console.log(`Comments:     ${reel.commentCount?.toLocaleString() ?? "N/A"}`);
    console.log(`Followers:    ${reel.followerCount?.toLocaleString() ?? "N/A"}`);
    console.log(`Duration:     ${reel.durationSeconds ?? "N/A"}s`);
    console.log(`Post date:    ${reel.postDate ?? "N/A"}`);
    console.log(`Video URL:    ${reel.videoUrl ? reel.videoUrl.slice(0, 80) + "..." : "N/A"}`);
    console.log(`Caption:      ${reel.caption ? reel.caption.slice(0, 100) + (reel.caption.length > 100 ? "..." : "") : "N/A"}`);
    console.log(`Transcript:   ${reel.hasUsableTranscript ? "YES" : "NO"} (${reel.transcriptWordCount} words)`);
    if (reel.transcript) {
      const preview = reel.transcript.slice(0, 200);
      console.log(`  Preview:    "${preview}${reel.transcript.length > 200 ? "..." : ""}"`);
    }
    console.log();
  }

  // Summary
  const withTranscript = results.filter((r) => r.hasUsableTranscript).length;
  const needsWhisper = results.filter((r) => !r.hasUsableTranscript).length;

  console.log("=== Summary ===");
  console.log(`Backend:                   ${backend}`);
  console.log(`Total reels scraped:       ${results.length}`);
  console.log(`With usable transcript:    ${withTranscript}`);
  console.log(`Needs Whisper fallback:    ${needsWhisper}`);
  console.log(`Elapsed time:              ${elapsed}s`);
}

main().catch((err) => {
  console.error("\nTest failed:", err);
  process.exit(1);
});
