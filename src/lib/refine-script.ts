// ---------------------------------------------------------------------------
// Script Refiner — rewrites a script based on its audit scorecard
// Uses Sonnet + theory prompt to produce an improved version
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { ScriptScorecard, RefinedScript } from "@/types/script-audit";
import { THEORY_SYSTEM_PROMPT } from "./theory-prompt";
import { tryParseJson } from "./parse-json";

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
// Refine prompt builder
// ---------------------------------------------------------------------------

function buildRefinePrompt(
  originalScript: string,
  scorecard: ScriptScorecard,
  niche: string,
  goal: string
): string {
  return `You are a viral content strategist rewriting a script to fix the issues identified in its audit scorecard.

CONTEXT:
- Niche: ${niche}
- Creator's goal: ${goal}
- Original score: ${scorecard.overallScore}/100
- Verdict: ${scorecard.overallVerdict.replace(/_/g, " ")}

ORIGINAL SCRIPT:
${originalScript}

AUDIT SCORECARD:
- Hook: ${scorecard.hookAssessment.grade} — ${scorecard.hookAssessment.feedback}
  Two-Step Test: ${scorecard.hookAssessment.twoStepTestVerdict}
  Current hook: "${scorecard.hookAssessment.hookText}"
- Packaging: ${scorecard.packagingAssessment.grade} — ${scorecard.packagingAssessment.feedback}
  Detected: ${scorecard.packagingAssessment.detectedFramework}
  Recommended: ${scorecard.packagingAssessment.recommendedFramework}
- Retention: ${scorecard.retentionAssessment.grade} — ${scorecard.retentionAssessment.feedback}
  Payoff position: ${scorecard.retentionAssessment.payoffPosition}
  Interrupt density: ${scorecard.retentionAssessment.interruptDensity}
- Authenticity: ${scorecard.authenticityAssessment.grade} — ${scorecard.authenticityAssessment.feedback}
  AI detection risk: ${scorecard.authenticityAssessment.aiDetectionRisk}
  Flagged phrases: ${scorecard.authenticityAssessment.flaggedPhrases?.length > 0 ? scorecard.authenticityAssessment.flaggedPhrases.map(p => `"${p}"`).join(", ") : "none"}

ISSUES TO FIX:
${scorecard.topIssues.map((issue, i) => `${i + 1}. [${issue.severity}] ${issue.area}: ${issue.issue} → ${issue.suggestion}`).join("\n")}

REFINED OPENING SUGGESTION FROM AUDIT:
"${scorecard.refinedOpening}"

YOUR TASK:
Rewrite the ENTIRE script to address ALL identified issues while:
1. MAINTAINING the creator's voice and authentic tone — do NOT make it sound more polished/corporate/AI
2. APPLYING the recommended packaging framework (${scorecard.packagingAssessment.recommendedFramework})
3. FIXING the hook to pass the Two-Step Test (Instant Clarity + Curiosity Gap)
4. MOVING the payoff to the final third if it's currently too early
5. ADDING rhetorical interrupts and tension mechanisms for better retention
6. REMOVING or rephrasing any AI-sounding phrases — make it sound like a real human talking
7. KEEPING approximately the same length (±20% words)

Return ONLY valid JSON. No markdown fences, no preamble, no explanation.

{
  "refinedContent": "the full rewritten script text, ready to record",
  "changes": [
    {
      "area": "hook" | "packaging" | "retention" | "authenticity" | "cta" | "pacing" | "emotion" | "structure",
      "what": "concise description of the specific change",
      "why": "one sentence grounding this change in growth theory"
    }
  ],
  "estimatedScoreAfter": number from 0-100 (your honest estimate of the improved score),
  "hookComparison": {
    "before": "the original hook text",
    "after": "the new hook text"
  },
  "summaryOfChanges": "2-3 sentences explaining the overall refinement strategy and the most impactful changes made"
}`;
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
  goal: string
): Promise<RefineResult> {
  const client = getClient();
  const userPrompt = buildRefinePrompt(originalScript, scorecard, niche, goal);

  // First attempt
  let raw = await callSonnet(client, userPrompt);
  let parsed = tryParseJson<RefinedScript>(raw);

  if (parsed) {
    return { refined: parsed, error: null, retried: false };
  }

  // Retry with stricter instruction
  console.log("[refine-script] JSON parse failed, retrying with stricter prompt...");

  const retryPrompt =
    userPrompt +
    "\n\nYou previously returned invalid JSON. Return ONLY the JSON object, nothing else.";

  raw = await callSonnet(client, retryPrompt);
  parsed = tryParseJson<RefinedScript>(raw);

  if (parsed) {
    return { refined: parsed, error: null, retried: true };
  }

  return {
    refined: null,
    error: `Failed to parse refinement JSON after retry. Raw response: ${raw.slice(0, 300)}`,
    retried: true,
  };
}

// ---------------------------------------------------------------------------
// Sonnet API call
// ---------------------------------------------------------------------------

async function callSonnet(client: Anthropic, userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: THEORY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block.type}`);
  }
  return block.text;
}
