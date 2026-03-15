/**
 * Extract Instagram growth theory knowledge from a creator's reels.
 *
 * Scrapes a creator's reels by handle, transcribes them, extracts growth
 * principles with Claude Haiku, then synthesizes all principles into a
 * structured markdown document with Claude Sonnet.
 *
 * Usage:
 *   npx tsx scripts/extract-theory.ts @personalbrandlaunch
 *   npx tsx scripts/extract-theory.ts @creatorhandle
 *
 * Output:
 *   - Prints the structured document to console
 *   - Saves to docs/extracted/[handle].md
 *
 * Requires ANTHROPIC_API_KEY (and GROQ_API_KEY if Whisper fallback needed) in .env.
 * Requires yt-dlp installed (or SCRAPER_BACKEND=apify with APIFY_API_TOKEN).
 */

import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { scrapeReels } from "../src/lib/scraper";
import { ensureTranscript, ensureTranscripts } from "../src/lib/transcribe";
import { tryParseJson } from "../src/lib/parse-json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExtractedPrinciple {
  category:
    | "hooks"
    | "retention"
    | "packaging"
    | "algorithm"
    | "scripting"
    | "storytelling"
    | "engagement"
    | "psychology"
    | "audio_visual"
    | "cta"
    | "other";
  principle: string;
  evidence: string;
  confidence: "high" | "medium";
}

// ---------------------------------------------------------------------------
// Anthropic client (lazy singleton)
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to your .env file."
      );
    }
    _client = new Anthropic();
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Haiku extraction prompt
// ---------------------------------------------------------------------------

function buildExtractionPrompt(transcript: string): string {
  return `You are an Instagram growth theory analyst. Extract ONLY actionable, specific Instagram growth principles from this reel transcript.

Ignore: self-promotion, filler, generic motivation, off-topic tangents.
Keep: hook techniques, script structures, retention strategies, algorithm insights, packaging frameworks, engagement tactics, content psychology, emotional arc techniques, storytelling mechanics, pacing advice.

Return a JSON array of objects with:
- "category": one of ["hooks", "retention", "packaging", "algorithm", "scripting", "storytelling", "engagement", "psychology", "audio_visual", "cta", "other"]
- "principle": the specific actionable insight (1-2 sentences)
- "evidence": a direct quote or paraphrase from the transcript that supports this
- "confidence": "high" (explicitly taught) or "medium" (implied/demonstrated)

If the transcript contains no growth-relevant principles (e.g., it's purely entertainment with no teaching), return an empty array [].

Transcript:
"""
${transcript}
"""`;
}

// ---------------------------------------------------------------------------
// Haiku call — extract principles from a single transcript
// ---------------------------------------------------------------------------

async function extractPrinciples(
  transcript: string,
  reelUrl: string
): Promise<ExtractedPrinciple[]> {
  const client = getClient();
  const prompt = buildExtractionPrompt(transcript);

  // First attempt
  let raw = await callHaiku(client, prompt);
  let parsed = tryParseJson<ExtractedPrinciple[]>(raw);

  if (parsed && Array.isArray(parsed)) {
    return parsed;
  }

  // Retry with stricter instruction
  console.log(
    `  [extract] JSON parse failed for ${reelUrl}, retrying with stricter prompt...`
  );

  const retryPrompt =
    prompt +
    "\n\nYou previously returned invalid JSON. Return ONLY the JSON array, nothing else.";

  raw = await callHaiku(client, retryPrompt);
  parsed = tryParseJson<ExtractedPrinciple[]>(raw);

  if (parsed && Array.isArray(parsed)) {
    return parsed;
  }

  console.log(
    `  [extract] Failed to parse JSON after retry for ${reelUrl}. Skipping.`
  );
  return [];
}

async function callHaiku(client: Anthropic, prompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block.type}`);
  }
  return block.text;
}

// ---------------------------------------------------------------------------
// Sonnet synthesis — merge all principles into structured document
// ---------------------------------------------------------------------------

async function synthesizePrinciples(
  allPrinciples: ExtractedPrinciple[],
  handle: string,
  reelCount: number
): Promise<string> {
  const client = getClient();

  const prompt = `You are an Instagram growth theory synthesizer. You have been given ${allPrinciples.length} extracted growth principles from ${reelCount} reels by @${handle}.

Your job is to produce a structured markdown document that organizes these principles into a comprehensive growth theory reference.

Rules:
1. Group principles by category (hooks, retention, packaging, algorithm, scripting, storytelling, engagement, psychology, audio_visual, cta, other)
2. Within each category, MERGE duplicate or near-duplicate principles into a single entry. Note how many times each principle appeared (frequency count).
3. FLAG any contradictions between principles — list both sides and note which has more evidence.
4. RANK principles within each category by frequency (most repeated first).
5. Only include categories that have at least one principle.
6. For each principle, include the supporting evidence quotes.
7. Mark confidence level: "high" if explicitly taught, "medium" if implied/demonstrated.

Output format (markdown):

# Instagram Growth Theory — Extracted from @${handle}

> Auto-extracted from ${reelCount} reels. Principles ranked by frequency.

## [Category Name]

### 1. [Principle title] (appeared N times) [HIGH/MEDIUM confidence]
**Insight:** [The merged, refined principle statement]
**Evidence:**
- "[quote 1]"
- "[quote 2]"

### 2. [Next principle] ...

---

## Contradictions Found
- **[Topic]:** [Principle A] vs [Principle B] — [which has more evidence]

(If no contradictions, write "No contradictions detected.")

---

## Key Takeaways
[3-5 bullet points summarizing the most important and frequently repeated principles across all categories]

Here are all the extracted principles as JSON:

${JSON.stringify(allPrinciples, null, 2)}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block.type}`);
  }
  return block.text;
}

// ---------------------------------------------------------------------------
// Concurrency helper (worker pool pattern)
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
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Parse CLI argument
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "Usage: npx tsx scripts/extract-theory.ts @handle\n" +
        "Example: npx tsx scripts/extract-theory.ts @personalbrandlaunch"
    );
    process.exit(1);
  }

  // Normalize handle — strip leading @ if present for display, keep for scraper
  const handle = arg.startsWith("@") ? arg.slice(1) : arg;
  const scraperInput = arg.startsWith("@") ? arg : `@${arg}`;

  console.log("=== ReelsIQ — Theory Extraction ===\n");
  console.log(`Creator: @${handle}\n`);

  // Step 1: Scrape
  console.log("--- Step 1: Scraping reels ---");
  const startScrape = Date.now();
  const reels = await scrapeReels([scraperInput]);
  console.log(
    `Scraped ${reels.length} reel(s) in ${((Date.now() - startScrape) / 1000).toFixed(1)}s\n`
  );

  if (reels.length === 0) {
    console.error("No reels found for this creator.");
    process.exit(1);
  }

  // Step 2: Transcribe
  console.log("--- Step 2: Transcription quality gate ---");
  const startTranscribe = Date.now();
  const transcripts = await ensureTranscripts(reels);
  console.log(
    `Transcripts ready in ${((Date.now() - startTranscribe) / 1000).toFixed(1)}s\n`
  );

  // Filter to reels with usable transcripts
  const usable: { url: string; transcript: string }[] = [];
  for (let i = 0; i < reels.length; i++) {
    const t = transcripts[i];
    if (!t.visualOnly && t.transcript) {
      usable.push({ url: reels[i].url, transcript: t.transcript });
    } else {
      console.log(`  Skipping ${reels[i].url} — visual-only / no transcript`);
    }
  }

  console.log(
    `\n  ${usable.length} of ${reels.length} reels have usable transcripts.\n`
  );

  if (usable.length === 0) {
    console.error("No usable transcripts — cannot extract theory.");
    process.exit(1);
  }

  // Step 3: Extract principles (Haiku, max 5 concurrent)
  console.log("--- Step 3: Extracting growth principles (Haiku) ---");
  const startExtract = Date.now();
  const allPrinciples: ExtractedPrinciple[] = [];

  await runWithConcurrency(usable, 5, async (reel, i) => {
    console.log(`  [${i + 1}/${usable.length}] Extracting from ${reel.url}`);
    const principles = await extractPrinciples(reel.transcript, reel.url);
    console.log(
      `    -> ${principles.length} principle(s) extracted`
    );
    allPrinciples.push(...principles);
  });

  console.log(
    `\nExtracted ${allPrinciples.length} total principles in ${((Date.now() - startExtract) / 1000).toFixed(1)}s\n`
  );

  if (allPrinciples.length === 0) {
    console.error(
      "No growth principles found in any reel. This creator may not teach growth tactics."
    );
    process.exit(1);
  }

  // Step 4: Synthesize (Sonnet)
  console.log("--- Step 4: Synthesizing into structured document (Sonnet) ---");
  const startSynth = Date.now();
  const document = await synthesizePrinciples(
    allPrinciples,
    handle,
    usable.length
  );
  console.log(
    `Synthesis complete in ${((Date.now() - startSynth) / 1000).toFixed(1)}s\n`
  );

  // Output to console
  console.log("=".repeat(60));
  console.log(document);
  console.log("=".repeat(60));

  // Save to file
  const outputDir = join(__dirname, "..", "docs", "extracted");
  await mkdir(outputDir, { recursive: true });

  const outputPath = join(outputDir, `${handle}.md`);
  await writeFile(outputPath, document, "utf-8");
  console.log(`\nSaved to ${outputPath}`);
}

main().catch((err) => {
  console.error("\nExtraction failed:", err);
  process.exit(1);
});
