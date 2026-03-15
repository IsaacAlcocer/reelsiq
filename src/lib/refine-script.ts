// ---------------------------------------------------------------------------
// Script Refiner — enhances a script based on its audit scorecard
// Adaptive: detects AI vs human input and applies the right strategy.
// Convergent: high-scoring scripts get minor tweaks, not full rewrites.
// Leans on THEORY_SYSTEM_PROMPT (system message) for all growth theory logic.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { ScriptScorecard, RefinedScript } from "@/types/script-audit";
import { THEORY_SYSTEM_PROMPT } from "./theory-prompt";
import { tryParseJson } from "./parse-json";
import { BANNED_WORDS_GUIDANCE, HUMANIZER_GUIDANCE } from "./social-lexicon";

export type HumanizeMode = "auto" | "on" | "off";

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
// Voice guidance — structure-only mode preserves creator's original words
// ---------------------------------------------------------------------------

const VOICE_PRESERVATION = `
VOICE PRESERVATION: Keep the creator's original words. You are rearranging, not rewriting.
- Keep 90%+ of the creator's exact wording — only change structure and ordering
- Preserve their vocabulary, sentence rhythm, tone, and energy level
- Use their contractions, slang, and phrasing patterns — don't "clean up" their voice
- Only add new words where absolutely needed for transitions between rearranged sections
- If it sounds natural already, keep it natural. Match what's already there.`;

// ---------------------------------------------------------------------------
// Shared JSON schema for all refinement modes
// ---------------------------------------------------------------------------

const JSON_SCHEMA = `
Return ONLY valid JSON. No markdown fences, no preamble, no explanation.

{
  "refinedContent": "the enhanced script, ready to record",
  "changes": [
    {
      "area": "hook" | "structure" | "retention" | "authenticity" | "cta" | "pacing" | "emotion",
      "what": "what changed",
      "why": "growth theory reason"
    }
  ],
  "estimatedScoreAfter": number from 0-100,
  "hookComparison": {
    "before": "the original hook text",
    "after": "the new hook text"
  },
  "summaryOfChanges": "2-3 sentences explaining what was improved and why"
}`;

// ---------------------------------------------------------------------------
// Helper: format scorecard feedback compactly
// ---------------------------------------------------------------------------

function formatScorecard(scorecard: ScriptScorecard): string {
  const lines = [
    `- Hook: ${scorecard.hookAssessment.grade} — ${scorecard.hookAssessment.feedback} (Two-Step Test: ${scorecard.hookAssessment.twoStepTestVerdict})`,
    `- Structure: ${scorecard.structureAssessment.grade} — ${scorecard.structureAssessment.feedback} (Suggestion: ${scorecard.structureAssessment.structuralSuggestion})`,
    `- Retention: ${scorecard.retentionAssessment.grade} — ${scorecard.retentionAssessment.feedback} (Payoff: ${scorecard.retentionAssessment.payoffPosition}, Interrupts: ${scorecard.retentionAssessment.interruptDensity})`,
    `- Authenticity: ${scorecard.authenticityAssessment.grade} — ${scorecard.authenticityAssessment.feedback}`,
  ];

  if (scorecard.authenticityAssessment.flaggedPhrases?.length > 0) {
    lines.push(`  Flagged phrases: ${scorecard.authenticityAssessment.flaggedPhrases.map(p => `"${p}"`).join(", ")}`);
  }

  return lines.join("\n");
}

function formatIssues(scorecard: ScriptScorecard): string {
  if (scorecard.topIssues.length === 0) return "No issues identified.";
  return scorecard.topIssues
    .map((issue, i) => `${i + 1}. [${issue.severity}] ${issue.area}: ${issue.issue} → ${issue.suggestion}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Prompt: AI-detected script — enhance and humanize
// ---------------------------------------------------------------------------

function formatContext(
  niche: string,
  goal: string,
  extra: { targetAudience?: string; tone?: string; offerDescription?: string }
): string {
  const lines = [`CONTEXT: ${niche} niche. Goal: ${goal}.`];
  if (extra.targetAudience) lines.push(`Target audience: ${extra.targetAudience}.`);
  if (extra.tone) lines.push(`Desired tone: ${extra.tone}.`);
  if (extra.offerDescription) lines.push(`Product/offer: ${extra.offerDescription}.`);
  return lines.join(" ");
}

function buildHumanizationPrompt(
  originalScript: string,
  scorecard: ScriptScorecard,
  niche: string,
  goal: string,
  extra: { targetAudience?: string; tone?: string; offerDescription?: string }
): string {
  return `Enhance this script using your growth theory framework. The audit flagged it as AI-generated, so also make it sound natural and human.

${formatContext(niche, goal, extra)} Current score: ${scorecard.overallScore}/100.

ORIGINAL SCRIPT:
${originalScript}

SCORECARD:
${formatScorecard(scorecard)}

ISSUES TO FIX:
${formatIssues(scorecard)}

YOUR TASK:
Apply your growth theory knowledge to enhance this script. Fix the issues above while keeping ALL the original ideas and information intact. The enhanced version should be the same script but better — not a different script.

Key priorities:
- Fix the hook to pass the Two-Step Test if it doesn't already
- Improve the organizational structure to better serve payoff delay and curiosity
- Ensure the payoff is in the final third
- Replace AI-sounding phrases with natural language — it should sound like someone talking, not reading
- Keep approximately the same length (±20% words)
${BANNED_WORDS_GUIDANCE}
${HUMANIZER_GUIDANCE}
${JSON_SCHEMA}`;
}

// ---------------------------------------------------------------------------
// Prompt: Human-detected script — targeted structural improvements
// ---------------------------------------------------------------------------

function buildTargetedEditPrompt(
  originalScript: string,
  scorecard: ScriptScorecard,
  niche: string,
  goal: string,
  extra: { targetAudience?: string; tone?: string; offerDescription?: string }
): string {
  return `Enhance this script using your growth theory framework. This script has authentic voice — preserve it while improving structure.

${formatContext(niche, goal, extra)} Current score: ${scorecard.overallScore}/100.

ORIGINAL SCRIPT:
${originalScript}

SCORECARD:
${formatScorecard(scorecard)}

ISSUES TO FIX:
${formatIssues(scorecard)}

YOUR TASK:
Apply your growth theory knowledge to fix the specific issues above. This script already sounds human — your job is to improve its structure and effectiveness, not rewrite it.

- Keep the creator's words, tone, and style wherever possible
- Only change what the scorecard identifies as weak
- Fix the hook if it doesn't pass the Two-Step Test
- Rearrange for better payoff positioning if needed
- Keep approximately the same length (±20% words)
${VOICE_PRESERVATION}
${BANNED_WORDS_GUIDANCE}
${JSON_SCHEMA}`;
}

// ---------------------------------------------------------------------------
// Prompt: Convergence mode — script scores 85+, minor tweaks only
// ---------------------------------------------------------------------------

function buildConvergencePrompt(
  originalScript: string,
  scorecard: ScriptScorecard,
  niche: string,
  goal: string,
  extra: { targetAudience?: string; tone?: string; offerDescription?: string }
): string {
  return `This is a strong script (${scorecard.overallScore}/100). Make only minor tweaks — do NOT rewrite or restructure it.

${formatContext(niche, goal, extra)}

ORIGINAL SCRIPT:
${originalScript}

SCORECARD:
${formatScorecard(scorecard)}

${scorecard.topIssues.length > 0 ? `MINOR ISSUES:\n${scorecard.topIssues.map((issue, i) => `${i + 1}. [${issue.severity}] ${issue.issue}`).join("\n")}` : "No significant issues found."}

YOUR TASK:
This script already works well. Make small polish-level adjustments only:
- Sharpen a word choice or tighten a sentence
- Strengthen the curiosity gap in the hook slightly if possible
- Keep 90%+ of the original text unchanged
- Do NOT restructure, change frameworks, or move the payoff
- If it's already excellent, return it nearly as-is
${VOICE_PRESERVATION}
${BANNED_WORDS_GUIDANCE}
${JSON_SCHEMA}`;
}

// ---------------------------------------------------------------------------
// Prompt selector — picks the right strategy based on score + AI detection
// ---------------------------------------------------------------------------

function selectPrompt(
  originalScript: string,
  scorecard: ScriptScorecard,
  niche: string,
  goal: string,
  extra: { targetAudience?: string; tone?: string; offerDescription?: string },
  humanize: HumanizeMode = "auto"
): string {
  // Convergence: script is already strong — minor tweaks only
  if (scorecard.overallScore >= 85) {
    console.log("[refine-script] Convergence mode — score is 85+, minor tweaks only");
    return buildConvergencePrompt(originalScript, scorecard, niche, goal, extra);
  }

  // Explicit humanize toggle overrides auto-detection
  if (humanize === "on") {
    console.log("[refine-script] Humanization mode — user toggled ON");
    return buildHumanizationPrompt(originalScript, scorecard, niche, goal, extra);
  }

  if (humanize === "off") {
    console.log("[refine-script] Targeted edit mode — user toggled OFF (keep voice)");
    return buildTargetedEditPrompt(originalScript, scorecard, niche, goal, extra);
  }

  // Auto mode: use AI detection score to decide
  const aiRisk = scorecard.authenticityAssessment.aiDetectionRisk;
  if (aiRisk === "medium" || aiRisk === "high") {
    console.log(`[refine-script] Humanization mode — AI detection risk: ${aiRisk}`);
    return buildHumanizationPrompt(originalScript, scorecard, niche, goal, extra);
  }

  // Human-detected: targeted structural improvements
  console.log("[refine-script] Targeted edit mode — script sounds human, structural fixes only");
  return buildTargetedEditPrompt(originalScript, scorecard, niche, goal, extra);
}

// ---------------------------------------------------------------------------
// Main: refine a single script
// ---------------------------------------------------------------------------

export interface RefineResult {
  refined: RefinedScript | null;
  error: string | null;
  retried: boolean;
}

export async function refineScript(
  originalScript: string,
  scorecard: ScriptScorecard,
  niche: string,
  goal: string,
  context: { targetAudience?: string; tone?: string; offerDescription?: string } = {},
  humanize: HumanizeMode = "auto",
  version: number = 0
): Promise<RefineResult> {
  const client = getClient();
  const userPrompt = selectPrompt(originalScript, scorecard, niche, goal, context, humanize);
  const temp = version > 0 ? 0.3 : 0;

  // First attempt
  let raw = await callSonnet(client, userPrompt, temp);
  let parsed = tryParseJson<RefinedScript>(raw);

  if (parsed) {
    parsed.refinedContent = await cleanupHype(parsed.refinedContent, client);
    return { refined: parsed, error: null, retried: false };
  }

  // Retry with stricter instruction
  console.log("[refine-script] JSON parse failed, retrying with stricter prompt...");

  const retryPrompt =
    userPrompt +
    "\n\nYou previously returned invalid JSON. Return ONLY the JSON object, nothing else.";

  raw = await callSonnet(client, retryPrompt, temp);
  parsed = tryParseJson<RefinedScript>(raw);

  if (parsed) {
    parsed.refinedContent = await cleanupHype(parsed.refinedContent, client);
    return { refined: parsed, error: null, retried: true };
  }

  return {
    refined: null,
    error: `Failed to parse refinement JSON after retry. Raw response: ${raw.slice(0, 300)}`,
    retried: true,
  };
}

// ---------------------------------------------------------------------------
// Post-refinement cleanup — catches hype/salesy language that slips through
// ---------------------------------------------------------------------------

async function cleanupHype(
  refinedContent: string,
  client: Anthropic
): Promise<string> {
  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20241022",
      max_tokens: 2048,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: `Review this script for hype/salesy language and fix it. Return ONLY the cleaned script text, nothing else.

RULES:
- Replace hype phrases with plain, confident language (e.g. "level up" → "get better", "LOADED" → "packed with")
- Replace ALL-CAPS emphasis words with normal casing
- Replace "about to level up" / "game changer" / "you're not ready" type phrases with straightforward statements
- Don't dump all value upfront — if the script reveals everything in the first half, restructure so details unfold progressively
- Keep the same length, structure, and meaning — only change tone where it sounds like an ad
- If the script is already clean, return it exactly as-is

SCRIPT:
${refinedContent}`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type !== "text") return refinedContent;
    const cleaned = block.text.trim();
    // Sanity check: if Haiku returned something wildly different in length, skip
    if (cleaned.length < refinedContent.length * 0.5 || cleaned.length > refinedContent.length * 2) {
      console.log("[refine-script] Cleanup pass returned unexpected length, skipping");
      return refinedContent;
    }
    return cleaned;
  } catch (err) {
    // Non-critical — if cleanup fails, return the original refinement
    console.error("[refine-script] Cleanup pass failed, skipping:", (err as Error).message);
    return refinedContent;
  }
}

// ---------------------------------------------------------------------------
// Sonnet API call
// ---------------------------------------------------------------------------

async function callSonnet(client: Anthropic, userPrompt: string, temperature = 0): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    temperature,
    system: THEORY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block.type}`);
  }
  return block.text;
}
