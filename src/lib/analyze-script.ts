// ---------------------------------------------------------------------------
// Per-Script Analysis — adapted from analyze.ts for user-provided scripts
// No video metadata (views, likes, etc.) — pure transcript analysis.
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { ReelAnalysis } from "./analyze";
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
// Prompt builder — no video metadata, pure script analysis
// ---------------------------------------------------------------------------

function buildScriptPrompt(script: string, title: string): string {
  return `You are an expert viral content analyst specializing in short-form video scripts for Instagram Reels.

Analyze this user-written script and extract a structured breakdown. This is a script the creator plans to use — there is no video metadata available.
Return ONLY valid JSON. No markdown fences, no preamble, no explanation.

SCRIPT TITLE: ${title}

SCRIPT:
${script}

Return this exact JSON structure:
{
  "hookCategory": one of: "question" | "contradiction" | "bold_claim" | "curiosity_gap" | "personal_story" | "controversial" | "direct_address" | "visual_implied",
  "hookText": "the exact first sentence or phrase used as the hook",
  "hookWordCount": number,
  "hookDurationEstimate": "0-2s" | "0-3s" | "0-4s",

  "hookClarity": "strong" | "weak" | "absent",
  "hookClarityNote": "one sentence explaining whether a cold viewer would instantly understand 'this is for me'",
  "hookCuriosityGap": "strong" | "weak" | "absent",
  "hookCuriosityGapNote": "one sentence explaining whether the hook creates a 'but how?' question that demands watching",
  "brainTriggerTrifecta": {
    "textHookPresent": true | false,
    "spokenHookPresent": true | false,
    "visualContextClue": "description of the implied visual setting/context if detectable from script, or null"
  },

  "narrativeType": one of: "problem_solution" | "before_after" | "numbered_list" | "story_arc" | "how_to" | "rant" | "case_study" | "myth_bust",
  "packagingFramework": one of: "comparison_ab" | "contrarian_gap" | "tastemaker_curation" | "recipe_steps" | "payoff_delay" | "trial_reel_ad" | "raw_unpackaged" | "other",
  "packagingNote": "one sentence describing the unique lens or framework used to deliver the information, or 'no distinct packaging' if raw",

  "tensionMechanism": "one sentence describing what keeps the viewer watching",
  "openLoop": true | false,
  "openLoopText": "the open loop phrase if present, or null",

  "payoffPosition": "early_third" | "middle_third" | "final_third" | "no_clear_payoff",
  "payoffNote": "one sentence on where the main answer/reveal lands in the script and whether information is withheld to build anticipation",

  "rhetoricalInterrupts": number,
  "rhetoricalInterruptExamples": ["example pivot phrase 1", "example pivot phrase 2"],

  "vocabularyLevel": "simple_punchy" | "conversational" | "technical_authoritative",
  "sentenceRhythm": "rapid_fire" | "measured_deliberate" | "building_momentum",
  "emotionalCore": one of: "inspiration" | "curiosity" | "fear_of_missing_out" | "relatability" | "aspiration" | "frustration_relief" | "shock" | "validation",

  "ctaStyle": "soft" | "direct" | "embedded" | "none",
  "ctaText": "the exact CTA phrase or null",
  "sessionBehavior": "profile_driver" | "external_link" | "engagement_prompt" | "series_reference" | "no_cta",
  "sessionNote": "one sentence on whether the CTA extends the viewing session (profile/series) or kills it (external link)",

  "scriptLength": "short" | "medium" | "long",
  "estimatedWordCount": number,
  "durationBucket": "under_15s" | "15_30s" | "30_60s" | "60_90s" | "90_120s" | "over_120s",

  "keyPhrases": ["phrase1", "phrase2", "phrase3"],
  "transferableInsight": "one sentence — the single most replicable thing about this script"
}`;
}

// ---------------------------------------------------------------------------
// Main: analyze a single user script
// ---------------------------------------------------------------------------

export interface ScriptAnalyzeResult {
  analysis: ReelAnalysis | null;
  error: string | null;
  retried: boolean;
}

export async function analyzeScript(
  script: string,
  title: string
): Promise<ScriptAnalyzeResult> {
  if (!script || script.trim().length === 0) {
    return {
      analysis: null,
      error: "Empty script",
      retried: false,
    };
  }

  const client = getClient();
  const prompt = buildScriptPrompt(script, title);

  // First attempt
  let raw = await callClaude(client, prompt);
  let parsed = tryParseJson<ReelAnalysis>(raw);

  if (parsed) {
    return { analysis: parsed, error: null, retried: false };
  }

  // Retry with stricter instruction
  console.log(
    `[analyze-script] JSON parse failed for "${title}", retrying with stricter prompt...`
  );

  const retryPrompt =
    prompt +
    "\n\nYou previously returned invalid JSON. Return ONLY the JSON object, nothing else.";

  raw = await callClaude(client, retryPrompt);
  parsed = tryParseJson<ReelAnalysis>(raw);

  if (parsed) {
    return { analysis: parsed, error: null, retried: true };
  }

  return {
    analysis: null,
    error: `Failed to parse JSON after retry. Raw response: ${raw.slice(0, 200)}`,
    retried: true,
  };
}

// ---------------------------------------------------------------------------
// Claude API call
// ---------------------------------------------------------------------------

async function callClaude(client: Anthropic, prompt: string): Promise<string> {
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
