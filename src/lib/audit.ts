// ---------------------------------------------------------------------------
// Script Audit Synthesis — evaluates user scripts against growth theory
// Produces per-script ScriptScorecards instead of cross-reel FormulaCard
// ---------------------------------------------------------------------------

import Anthropic from "@anthropic-ai/sdk";
import type { ReelAnalysis } from "./analyze";
import type { ScriptAuditResult } from "@/types/script-audit";
import { THEORY_SYSTEM_PROMPT } from "./theory-prompt";
import { tryParseJson } from "./parse-json";
import { computeScore, computeVerdict } from "./scoring";
import { extractBenchmarks, formatBenchmarksForPrompt } from "./benchmarks";

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
// Audit prompt builder
// ---------------------------------------------------------------------------

function buildAuditPrompt(
  analyses: Array<{ title: string; script: string; analysis: ReelAnalysis }>,
  niche: string,
  goal: string,
  context: { targetAudience?: string; tone?: string; offerDescription?: string },
  benchmarkContext: string | null
): string {
  const benchmarkBlock = benchmarkContext
    ? `\n${benchmarkContext}\n`
    : "";

  const contextLines = [`The creator writes in the ${niche} niche. Their goal is: ${goal}`];
  if (context.targetAudience) contextLines.push(`Target audience: ${context.targetAudience}`);
  if (context.tone) contextLines.push(`Desired tone: ${context.tone}`);
  if (context.offerDescription) contextLines.push(`Product/offer being promoted: ${context.offerDescription}`);

  return `You are a content strategist auditing user-written scripts against growth principles. Your job is to help this creator find their own formula — not match a checklist.

${contextLines.join("\n")}
${benchmarkBlock}
Below are ${analyses.length} script(s) the creator plans to use for Instagram Reels, along with their structural analyses.

SCRIPTS AND ANALYSES:
${analyses.map((a, i) => `
--- SCRIPT ${i + 1}: "${a.title}" ---
SCRIPT TEXT:
${a.script}

STRUCTURAL ANALYSIS:
${JSON.stringify(a.analysis, null, 2)}
`).join("\n")}

For each script, produce a detailed SCORECARD that evaluates it against growth principles. Be specific, actionable, and honest — if a script has problems, say so clearly. If it's strong, explain why.

Pay special attention to:
- AI-SOUNDING LANGUAGE: In the Trust Recession (2026), audiences repel anything that feels robotic or AI-generated. Flag specific phrases that sound generic, overly polished, or AI-written. This is CRITICAL.
- HOOK EFFECTIVENESS: Apply the Two-Step Test rigorously. Does the hook pass both Instant Clarity AND Curiosity Gap?
- PAYOFF POSITIONING: Is the answer/reveal delayed until the final third? Early payoffs kill retention.
- STRUCTURE: Is the content organized to serve delayed payoff and sustained curiosity? Does the approach feel natural to this creator?

Return ONLY valid JSON. No markdown fences, no preamble, no explanation.

{
  "scriptsAudited": number,
  "niche": "string",
  "scorecards": [
    {
      "scriptTitle": "the title of the script",

      "hookAssessment": {
        "grade": "strong" | "moderate" | "weak",
        "feedback": "2-3 sentences explaining the hook's effectiveness against the Two-Step Test and Brain Trigger Trifecta",
        "twoStepTestVerdict": "passes both gates" | "strong clarity, weak gap" | "strong gap, weak clarity" | "fails both gates",
        "hookText": "the exact hook text identified"
      },

      "structureAssessment": {
        "grade": "strong" | "moderate" | "weak",
        "feedback": "2-3 sentences on how the content is organized — does the structure serve curiosity and delayed payoff? Explain why the approach works or doesn't, grounded in principles",
        "detectedFramework": "the structural approach detected in this script (e.g. comparison, layered reveal, story arc, tutorial, etc.)",
        "structuralSuggestion": "a specific suggestion for how the script's organization could better serve payoff delay and curiosity, in terms of the content's own logic"
      },

      "retentionAssessment": {
        "grade": "strong" | "moderate" | "weak",
        "feedback": "2-3 sentences on retention architecture — payoff delay, open loops, tension mechanisms, rhetorical interrupts",
        "payoffPosition": "early_third" | "middle_third" | "final_third" | "no_clear_payoff",
        "interruptDensity": "high_density" | "moderate" | "low_density"
      },

      "authenticityAssessment": {
        "grade": "strong" | "moderate" | "weak",
        "feedback": "2-3 sentences on how authentic/human the script sounds. Flag any AI-sounding patterns, generic phrasing, or Trust Recession red flags",
        "aiDetectionRisk": "low" | "medium" | "high",
        "flaggedPhrases": ["specific phrase 1 that sounds AI-generated", "specific phrase 2"]
      },

      "algorithmAlignment": {
        "grade": "strong" | "moderate" | "weak",
        "signals": [
          {
            "signal": "signal name (e.g. Session Time, Hook Clarity, Payoff Delay)",
            "status": "aligned" | "partially_aligned" | "misaligned",
            "note": "one sentence explanation"
          }
        ]
      },

      "topIssues": [
        {
          "area": "hook" | "structure" | "retention" | "authenticity" | "cta" | "pacing" | "emotion",
          "severity": "critical" | "moderate" | "minor",
          "issue": "concise description of the problem",
          "suggestion": "specific, actionable fix — tell the creator exactly what to change"
        }
      ],

      "refinedOpening": "a rewritten version of the first 30-50 words of this script that fixes the identified hook/opening issues while maintaining the creator's voice. If the opening is already strong, improve it slightly and explain why the original works.",

      "summaryNote": "2-3 sentence overall assessment — the single most important thing the creator should know about this script"
    }
  ],
  "crossScriptPatterns": [
    "pattern 1 observed across scripts (if multiple scripts — e.g. 'All scripts reveal the payoff too early')",
    "pattern 2",
    "pattern 3"
  ],
  "topRecommendation": "the single most impactful change the creator should make across all their scripts, grounded in growth principles"
}`;
}

// ---------------------------------------------------------------------------
// Main: audit user scripts
// ---------------------------------------------------------------------------

export interface AuditSynthesisResult {
  auditResult: ScriptAuditResult | null;
  error: string | null;
  retried: boolean;
}

export async function auditScripts(
  analyses: Array<{ title: string; script: string; analysis: ReelAnalysis }>,
  niche: string,
  goal: string,
  context: { targetAudience?: string; tone?: string; offerDescription?: string } = {}
): Promise<AuditSynthesisResult> {
  if (analyses.length === 0) {
    return { auditResult: null, error: "No analyses to audit", retried: false };
  }

  const client = getClient();

  // Load benchmark context (optional — returns null if no saved results)
  let benchmarkContext: string | null = null;
  try {
    const stats = await extractBenchmarks();
    if (stats) benchmarkContext = formatBenchmarksForPrompt(stats);
  } catch {
    // Non-critical — proceed without benchmarks
  }

  const userPrompt = buildAuditPrompt(analyses, niche, goal, context, benchmarkContext);

  // First attempt
  let raw = await callSonnet(client, userPrompt);
  let parsed = tryParseJson<ScriptAuditResult>(raw);

  if (parsed) {
    injectDeterministicScores(parsed);
    return { auditResult: parsed, error: null, retried: false };
  }

  // Retry with stricter instruction
  console.log("[audit] JSON parse failed, retrying with stricter prompt...");

  const retryPrompt =
    userPrompt +
    "\n\nYou previously returned invalid JSON. Return ONLY the JSON object, nothing else.";

  raw = await callSonnet(client, retryPrompt);
  parsed = tryParseJson<ScriptAuditResult>(raw);

  if (parsed) {
    injectDeterministicScores(parsed);
    return { auditResult: parsed, error: null, retried: true };
  }

  return {
    auditResult: null,
    error: `Failed to parse audit JSON after retry. Raw response: ${raw.slice(0, 300)}`,
    retried: true,
  };
}

// ---------------------------------------------------------------------------
// Post-processing: inject deterministic scores from grades
// ---------------------------------------------------------------------------

function injectDeterministicScores(result: ScriptAuditResult): void {
  for (const card of result.scorecards) {
    const score = computeScore({
      hookGrade: card.hookAssessment.grade,
      structureGrade: card.structureAssessment.grade,
      retentionGrade: card.retentionAssessment.grade,
      authenticityGrade: card.authenticityAssessment.grade,
      algorithmGrade: card.algorithmAlignment.grade,
    });
    card.overallScore = score;
    card.overallVerdict = computeVerdict(score);
  }
}

// ---------------------------------------------------------------------------
// Sonnet API call
// ---------------------------------------------------------------------------

async function callSonnet(client: Anthropic, userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    temperature: 0,
    system: THEORY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block.type}`);
  }
  return block.text;
}
