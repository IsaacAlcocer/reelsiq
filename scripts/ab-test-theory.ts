/**
 * A/B test: Compare old vs new theory prompt on the same reels.
 *
 * Scrapes + transcribes + analyzes reels once, then runs synthesis
 * twice (old theory vs new theory) and saves both Formula Cards
 * for side-by-side comparison.
 *
 * Usage:
 *   npx tsx scripts/ab-test-theory.ts [url1] [url2] ...
 *
 * Outputs:
 *   docs/ab-test/old-theory.json
 *   docs/ab-test/new-theory.json
 *   docs/ab-test/comparison.md
 */

import "dotenv/config";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { scrapeReels } from "../src/lib/scraper";
import { ensureTranscripts } from "../src/lib/transcribe";
import { analyzeReel, type ReelAnalysis } from "../src/lib/analyze";
import { tryParseJson } from "../src/lib/parse-json";

// Import the current (new) theory prompt
import { THEORY_SYSTEM_PROMPT as NEW_THEORY } from "../src/lib/theory-prompt";

// ---------------------------------------------------------------------------
// Old theory prompt (from before the upgrade)
// ---------------------------------------------------------------------------

const OLD_THEORY = `You are a content strategist with deep expertise in Instagram's 2026 algorithm mechanics and growth principles. You help creators find and refine their own formula — not copy someone else's.

═══════════════════════════════════════════════════════════════
SECTION 1: UNIVERSAL PRINCIPLES
These are evidence-based mechanics. They apply regardless of niche, style, or personality.
═══════════════════════════════════════════════════════════════

ALGORITHM MECHANICS:
- Instagram optimizes for VIEWING SESSIONS (total time on profile + platform), not individual watch time
- Core ranking signals in order of weight: session time, viewer satisfaction (what users do AFTER viewing), comment rate, share rate, skip rate, saves
- Content that kills sessions (external link CTAs) is penalized, especially for smaller accounts
- The algorithm tests content in multiple waves over weeks — a reel can stay dead for 2-3 weeks then explode
- Optimal length sweet spots: 11-30s (quick attention) and 60-120s (deep engagement)
- Hashtags have zero correlation with reach; Instagram SEO keywords in captions matter

HOOK SCIENCE — THE TWO-STEP TEST:
Every hook must pass both gates to work on cold audiences:
1. INSTANT CLARITY — the viewer immediately recognizes "this is for me"
2. CURIOSITY GAP — after clarity, they must wonder "but how?" creating a question only the full video answers
Hooks that rely on relatability alone fail on cold audiences. Insider jargon in the first frame kills clarity.

THE BRAIN TRIGGER TRIFECTA:
The highest-performing hooks layer three simultaneous triggers:
1. Visual trigger — a familiar, recognizable setting
2. Text hook — clear on-screen text reinforcing the topic
3. Spoken line — direct verbal hook matching text + visual

RETENTION ARCHITECTURE:
- The Payoff Delay Technique: deliberately hold back the final answer until the last sentence. If viewers get the answer early, they swipe and retention dies.
- Secondary hooks / pattern interrupts every 1-3 seconds maintain attention (zooms, text overlays, scene cuts, rhetorical pivots). A successful 40-second video can have 30+ secondary hooks.
- Reel structure: Primary Hook (0-3s) → Setup / Open Curiosity Loop (3-10s) → Secondary Hooks throughout → Payoff at final second

SESSION TIME STRATEGY:
- Signature Series (numbered parts) force binge sessions across the profile
- Linking reels feature connects related videos
- CTAs should drive to profile, series, or engagement — NOT external links for smaller/growing accounts
- The "Netflix mental model": your profile is a library, the goal is to make people binge

THE TRUST RECESSION (2026):
- Audiences repel anything that feels robotic, AI-generated, or performative
- Authenticity and genuine value are the only durable advantages
- Silent consumption is the norm — likes are at all-time low, saves/shares/comments matter more
- Creators who feel "real" dominate the trust economy

═══════════════════════════════════════════════════════════════
SECTION 2: CONTENT STRUCTURE
How creators organize information. These are tools, not rules.
═══════════════════════════════════════════════════════════════

Structure = how a creator organizes their content to serve curiosity and delayed payoff. There are many ways to do this well:

EXAMPLES OF EFFECTIVE STRUCTURES (not an exhaustive list):
- Comparison (A vs B): creates natural tension and curiosity
- Contrarian opening: challenges a common belief to build authority + engagement
- Curated list: organizes expertise for a specific audience
- Layered reveal: builds context progressively before the payoff
- Story arc: personal narrative with a turning point
- Tutorial progression: step-by-step with escalating complexity

What matters is NOT which structure a creator uses, but whether their chosen approach:
1. Creates a question the viewer needs answered (curiosity)
2. Holds back the answer until late in the content (payoff delay)
3. Maintains momentum through the middle (retention)
4. Feels natural to the creator's voice and topic

A creator with no named framework but strong curiosity + delayed payoff is doing it right. A creator following a named framework mechanically but revealing the answer early is doing it wrong.

═══════════════════════════════════════════════════════════════
SECTION 3: EVALUATION STANCE
How to assess content without imposing a single style.
═══════════════════════════════════════════════════════════════

EVALUATE AGAINST PRINCIPLES, NOT CHECKLISTS:
- Ask "does this work?" before "does this match a framework?"
- Explain WHY something works or fails (the principle), not WHICH framework it should match
- Style is personal. Vocabulary, tone, energy level, humor — these belong to the creator
- A script that breaks conventions but retains attention is succeeding
- Two creators in the same niche can have completely different approaches and both be effective

WHEN SUGGESTING IMPROVEMENTS:
- Ground suggestions in principles (payoff delay, curiosity gap, session time)
- Offer structural alternatives, not framework prescriptions
- Preserve the creator's voice, vocabulary, and tone
- Explain the principle so the creator can apply it their own way next time

═══════════════════════════════════════════════════════════════
SECTION 4: COMMON MISTAKES
Principle-based issues that hurt performance regardless of style.
═══════════════════════════════════════════════════════════════

- Revealing the payoff early (kills retention — this is the #1 structural mistake)
- No clear curiosity gap in the hook (viewer has no reason to keep watching)
- Generic AI-sounding scripts (audiences repel them in the Trust Recession)
- "Me-focused" content to cold audiences (lead with their transformation, not your story)
- Session-killing CTAs (external links) on growing accounts
- Judging content performance before 3-4 weeks (algorithm tests in multiple waves)
- Copying another creator's style instead of developing your own (their face/personality IS their hook — different rules apply)

Use these principles to evaluate patterns found in the analyzed content. When recommending strategies, ground them in these mechanics. When identifying what's working, explain WHY it works. When spotting weaknesses, explain the principle being violated so the creator learns to self-correct.`;

// ---------------------------------------------------------------------------
// Read the synthesis prompt builder from synthesize.ts
// ---------------------------------------------------------------------------

import { readFileSync } from "fs";

// We need the buildSynthesisPrompt function — extract it by reading synthesize.ts
// Instead of importing (which would use the new theory), we'll call Sonnet directly

function buildSynthesisPrompt(
  analyses: ReelAnalysis[],
  niche: string,
  goal: string
): string {
  // Read the actual function from synthesize.ts to stay in sync
  const synthesizeSource = readFileSync(
    join(__dirname, "..", "src", "lib", "synthesize.ts"),
    "utf-8"
  );

  // Extract the prompt template — it's between the function and the return
  // For simplicity, just build it the same way synthesize.ts does
  const analysesJson = JSON.stringify(analyses, null, 2);

  return `You are analyzing ${analyses.length} Instagram Reels in the "${niche}" niche.
The creator's goal is: ${goal}

Below are the per-reel analyses. Each contains 23 structured fields extracted from the reel's transcript and metadata.

Synthesize these into a single Formula Card JSON object. Find cross-reel patterns. Evaluate against the growth theory framework in your system prompt. Be specific and actionable.

PER-REEL ANALYSES:
${analysesJson}

Return a single JSON object matching the FormulaCard schema. Include all 13 sections. Be specific — use actual examples from the reels, not generic advice.`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const DEFAULT_URLS = [
  "https://www.instagram.com/p/DVeKbecDr2P/",
  "https://www.instagram.com/p/DVRQ5KljgZf/",
  "https://www.instagram.com/p/DVQyV56DR0e/",
  "https://www.instagram.com/p/DVbmNxqjtEA/",
  "https://www.instagram.com/p/DVTW-3AEZNs/",
];

const NICHE = "personal branding & content creation";
const GOAL = "Grow following";

async function main() {
  const urls = process.argv.length > 2 ? process.argv.slice(2) : DEFAULT_URLS;

  console.log("=== ReelsIQ — A/B Theory Prompt Test ===\n");
  console.log(`Niche: ${NICHE}`);
  console.log(`Goal:  ${GOAL}`);
  console.log(`Reels: ${urls.length}\n`);

  // Step 1: Scrape
  console.log("--- Step 1: Scraping ---");
  const reels = await scrapeReels(urls);
  console.log(`Scraped ${reels.length} reel(s)\n`);

  if (reels.length === 0) {
    console.error("No reels found.");
    process.exit(1);
  }

  // Step 2: Transcribe
  console.log("--- Step 2: Transcribing ---");
  const transcripts = await ensureTranscripts(reels);

  // Step 3: Analyze (shared between both tests)
  console.log("\n--- Step 3: Analyzing (shared) ---");
  const analyses: ReelAnalysis[] = [];

  for (let i = 0; i < reels.length; i++) {
    const t = transcripts[i];
    if (t.visualOnly || !t.transcript) {
      console.log(`  SKIP: ${reels[i].url} — visual-only`);
      continue;
    }
    console.log(`  [${i + 1}/${reels.length}] Analyzing ${reels[i].url}`);
    const result = await analyzeReel(reels[i], t);
    if (result.analysis) {
      analyses.push(result.analysis);
      console.log(`    OK — [${result.analysis.hookCategory}]`);
    } else {
      console.log(`    FAILED — ${result.error}`);
    }
  }

  console.log(`\n${analyses.length} reels analyzed successfully.\n`);

  if (analyses.length === 0) {
    console.error("No analyses — cannot compare.");
    process.exit(1);
  }

  // Step 4: Synthesize with BOTH prompts
  const client = new Anthropic();
  const userPrompt = buildSynthesisPrompt(analyses, NICHE, GOAL);

  console.log("--- Step 4A: Synthesizing with OLD theory prompt ---");
  const startOld = Date.now();
  const oldResponse = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    temperature: 0,
    system: OLD_THEORY,
    messages: [{ role: "user", content: userPrompt }],
  });
  const oldRaw =
    oldResponse.content[0].type === "text" ? oldResponse.content[0].text : "";
  const oldCard = tryParseJson(oldRaw);
  console.log(
    `  Done in ${((Date.now() - startOld) / 1000).toFixed(1)}s — ${oldCard ? "parsed OK" : "PARSE FAILED"}\n`
  );

  console.log("--- Step 4B: Synthesizing with NEW theory prompt ---");
  const startNew = Date.now();
  const newResponse = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    temperature: 0,
    system: NEW_THEORY,
    messages: [{ role: "user", content: userPrompt }],
  });
  const newRaw =
    newResponse.content[0].type === "text" ? newResponse.content[0].text : "";
  const newCard = tryParseJson(newRaw);
  console.log(
    `  Done in ${((Date.now() - startNew) / 1000).toFixed(1)}s — ${newCard ? "parsed OK" : "PARSE FAILED"}\n`
  );

  // Step 5: Save results
  const outputDir = join(__dirname, "..", "docs", "ab-test");
  await mkdir(outputDir, { recursive: true });

  await writeFile(
    join(outputDir, "old-theory.json"),
    JSON.stringify(oldCard, null, 2),
    "utf-8"
  );
  await writeFile(
    join(outputDir, "new-theory.json"),
    JSON.stringify(newCard, null, 2),
    "utf-8"
  );

  // Step 6: Generate comparison
  console.log("--- Step 5: Generating comparison ---");
  const comparisonPrompt = `Compare these two Formula Card outputs generated from the same reels but with different theory prompts.

OLD THEORY OUTPUT:
${JSON.stringify(oldCard, null, 2).slice(0, 6000)}

NEW THEORY OUTPUT:
${JSON.stringify(newCard, null, 2).slice(0, 6000)}

Write a concise markdown comparison covering:
1. **Hook Analysis Quality** — Which gives more specific, actionable hook recommendations?
2. **Retention Insights** — Which better identifies retention mechanics and gaps?
3. **Packaging Depth** — Which provides richer packaging framework analysis?
4. **New Concepts** — What does the new theory catch that the old one misses? (e.g., face rule, visual hooks, camera psychology, value density, format stacking, content funnel)
5. **Script Opening Quality** — Compare the generated script openings
6. **Overall Verdict** — Which produces a more useful Formula Card and why?

Be specific — quote actual differences from the outputs.`;

  const comparisonResponse = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    temperature: 0,
    messages: [{ role: "user", content: comparisonPrompt }],
  });

  const comparison =
    comparisonResponse.content[0].type === "text"
      ? comparisonResponse.content[0].text
      : "Comparison failed";

  await writeFile(join(outputDir, "comparison.md"), comparison, "utf-8");

  console.log("\n" + "=".repeat(60));
  console.log(comparison);
  console.log("=".repeat(60));

  console.log("\nFiles saved:");
  console.log(`  ${join(outputDir, "old-theory.json")}`);
  console.log(`  ${join(outputDir, "new-theory.json")}`);
  console.log(`  ${join(outputDir, "comparison.md")}`);
}

main().catch((err) => {
  console.error("\nA/B test failed:", err);
  process.exit(1);
});
