import Anthropic from "@anthropic-ai/sdk";
import type { ReelAnalysis } from "./analyze";
import { THEORY_SYSTEM_PROMPT } from "./theory-prompt";
import { tryParseJson } from "./parse-json";

// ---------------------------------------------------------------------------
// Types — Formula Card (Section 7B)
// ---------------------------------------------------------------------------

export interface FormulaCard {
  nicheName: string;
  reelsAnalyzed: number;
  formulaCard: {
    hookDiagnostic: {
      twoStepTestResults: {
        passedBothGates: number;
        clarityOnlyNoGap: number;
        gapOnlyNoClarity: number;
        failedBoth: number;
        insight: string;
      };
      brainTriggerTrifectaUsage: {
        fullTrifecta: number;
        partialCount: number;
        noneCount: number;
        recommendation: string;
      };
      dominantHookCategory: string;
      dominantHookCategoryFrequency: number;
    };

    winningHooks: Array<{
      category: string;
      template: string;
      example: string;
      frequency: number;
      frequencyPercent: number;
      confidenceLevel: "high" | "medium" | "low";
      twoStepVerdict: string;
      psychologyNote: string;
    }>;

    packagingStrategy: {
      dominantPackaging: string;
      dominantPackagingFrequency: number;
      packagingBreakdown: Array<{ framework: string; count: number }>;
      recommendedPackaging: Array<{
        framework: string;
        template: string;
        example: string;
        whyItWorks: string;
      }>;
      insight: string;
    };

    retentionArchitecture: {
      payoffDelayAnalysis: {
        earlyPayoff: number;
        middlePayoff: number;
        delayedPayoff: number;
        noClearPayoff: number;
        insight: string;
      };
      avgRhetoricalInterrupts: number;
      interruptDensityVerdict: "high_density" | "moderate" | "low_density";
      interruptRecommendation: string;
      dominantStructure: {
        type: string;
        frequency: number;
        breakdown: string[];
        note: string;
      };
      secondaryStructure: {
        type: string;
        frequency: number;
        breakdown: string[];
        note: string;
      };
    };

    sessionTimeStrategy: {
      sessionBehaviorBreakdown: {
        profileDrivers: number;
        externalLinks: number;
        engagementPrompts: number;
        seriesReferences: number;
        noCta: number;
      };
      sessionKillerWarning: string | null;
      bingeabilityScore: "high" | "medium" | "low";
      bingeabilityNote: string;
      seriesRecommendation: string;
    };

    vocabularyProfile: {
      level: string;
      sentenceStyle: string;
      wordsToUse: string[];
      wordsToAvoid: string[];
      authenticityNote: string;
    };

    ctaPatterns: Array<{
      style: "soft" | "direct" | "embedded";
      template: string;
      frequency: number;
      sessionImpact: "session_extending" | "session_neutral" | "session_killing";
    }>;

    emotionalJourney: string;

    paceProfile: {
      rhythm: "rapid_fire" | "measured_deliberate" | "building_momentum";
      avgEstimatedWordCount: number;
      avgDurationSeconds: number;
      dominantDurationBucket: string;
      sweetSpotAlignment: "aligned" | "misaligned";
      sweetSpotNote: string;
    };

    algorithmAlignmentScore: {
      overall: "strong" | "moderate" | "weak";
      signals: Array<{
        signal: string;
        status: "aligned" | "partially_aligned" | "misaligned";
        note: string;
      }>;
      biggestGap: string;
      biggestStrength: string;
    };

    crossNicheTransferables: string[];

    readyToUseScriptOpening: string;

    topInsight: string;

    deploymentPlaybook: {
      trialReelStrategy: string;
      storySequence: {
        story1: string;
        story2: string;
        story3: string;
      };
      optimizationLoop: string;
      seriesLaunchPlan: string;
      pcrTracking: string;
      postingCadence: string;
    };
  };
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
// Synthesis prompt builder (Section 7B)
// ---------------------------------------------------------------------------

function buildSynthesisPrompt(
  analyses: ReelAnalysis[],
  niche: string,
  goal: string
): string {
  return `You are a viral content strategist analyzing patterns across multiple high-performing Instagram Reels using your Instagram Growth Theory framework.

Below are structured analyses of ${analyses.length} Reels from the ${niche} niche.
The creator's goal is: ${goal}

INDIVIDUAL ANALYSES:
${JSON.stringify(analyses, null, 2)}

Synthesize these into a Formula Card — a theory-grounded playbook the creator can use immediately. Evaluate every pattern against your growth theory framework. Don't just report what you found — explain WHY it works and HOW to deploy it.

Return ONLY valid JSON. No markdown fences, no preamble, no explanation.

{
  "nicheName": "string",
  "reelsAnalyzed": number,
  "formulaCard": {

    "hookDiagnostic": {
      "twoStepTestResults": {
        "passedBothGates": number,
        "clarityOnlyNoGap": number,
        "gapOnlyNoClarity": number,
        "failedBoth": number,
        "insight": "one sentence summarizing what this reveals about successful hooks in this niche"
      },
      "brainTriggerTrifectaUsage": {
        "fullTrifecta": number,
        "partialCount": number,
        "noneCount": number,
        "recommendation": "specific advice on how to implement the trifecta in this niche"
      },
      "dominantHookCategory": "the most common hook category",
      "dominantHookCategoryFrequency": number
    },

    "winningHooks": [
      {
        "category": "hook category",
        "template": "fill-in-the-blank hook template e.g. 'Why [RESULT] is actually [COUNTERINTUITIVE CLAIM]'",
        "example": "a concrete example filled in for this niche",
        "frequency": number,
        "frequencyPercent": number,
        "confidenceLevel": "high" | "medium" | "low",
        "twoStepVerdict": "passes both gates" | "strong clarity, weak gap" | "strong gap, weak clarity",
        "psychologyNote": "why this works on a human level, grounded in hook science theory"
      }
    ],

    "packagingStrategy": {
      "dominantPackaging": "the most common packaging framework found",
      "dominantPackagingFrequency": number,
      "packagingBreakdown": [
        { "framework": "framework name", "count": number }
      ],
      "recommendedPackaging": [
        {
          "framework": "a packaging framework ideal for this niche",
          "template": "fill-in-the-blank packaging template",
          "example": "concrete example for this niche",
          "whyItWorks": "one sentence grounded in the Packaging > Hooks principle"
        }
      ],
      "insight": "one sentence on whether top performers succeed through strong packaging or are underusing it (a gap the creator can exploit)"
    },

    "retentionArchitecture": {
      "payoffDelayAnalysis": {
        "earlyPayoff": number,
        "middlePayoff": number,
        "delayedPayoff": number,
        "noClearPayoff": number,
        "insight": "one sentence on payoff positioning patterns and their likely impact on retention"
      },
      "avgRhetoricalInterrupts": number,
      "interruptDensityVerdict": "high_density" | "moderate" | "low_density",
      "interruptRecommendation": "specific advice on rhetorical interrupt frequency and techniques for this niche",
      "dominantStructure": {
        "type": "narrative type name",
        "frequency": number,
        "breakdown": ["step 1", "step 2", "step 3", "step 4"],
        "note": "why this structure works in this niche specifically, grounded in retention theory"
      },
      "secondaryStructure": {
        "type": "narrative type name",
        "frequency": number,
        "breakdown": ["step 1", "step 2", "step 3"],
        "note": "brief note"
      }
    },

    "sessionTimeStrategy": {
      "sessionBehaviorBreakdown": {
        "profileDrivers": number,
        "externalLinks": number,
        "engagementPrompts": number,
        "seriesReferences": number,
        "noCta": number
      },
      "sessionKillerWarning": "if external link CTAs are common, flag this with a specific warning about session time penalty — or null if not applicable",
      "bingeabilityScore": "high" | "medium" | "low",
      "bingeabilityNote": "assessment of whether the analyzed content creates binge sessions or standalone consumption",
      "seriesRecommendation": "specific suggestion for a signature series concept in this niche that would force binge sessions"
    },

    "vocabularyProfile": {
      "level": "simple_punchy | conversational | technical_authoritative",
      "sentenceStyle": "description",
      "wordsToUse": ["word1", "word2", "word3", "word4", "word5"],
      "wordsToAvoid": ["word1", "word2", "word3"],
      "authenticityNote": "assessment of whether the vocabulary feels authentic or AI-generated, with advice on maintaining trust"
    },

    "ctaPatterns": [
      {
        "style": "soft | direct | embedded",
        "template": "fill-in-the-blank CTA template",
        "frequency": number,
        "sessionImpact": "session_extending | session_neutral | session_killing"
      }
    ],

    "emotionalJourney": "describe the emotional arc the viewer goes through from hook to CTA",

    "paceProfile": {
      "rhythm": "rapid_fire | measured_deliberate | building_momentum",
      "avgEstimatedWordCount": number,
      "avgDurationSeconds": number,
      "dominantDurationBucket": "the most common duration bracket",
      "sweetSpotAlignment": "aligned" | "misaligned",
      "sweetSpotNote": "whether the dominant duration falls in a proven sweet spot (11-30s or 60-120s) and specific pacing advice"
    },

    "algorithmAlignmentScore": {
      "overall": "strong" | "moderate" | "weak",
      "signals": [
        {
          "signal": "signal name (e.g. Session Time, Payoff Delay, Hook Clarity)",
          "status": "aligned" | "partially_aligned" | "misaligned",
          "note": "one sentence explanation"
        }
      ],
      "biggestGap": "the single most impactful thing the analyzed content is NOT doing that the algorithm rewards",
      "biggestStrength": "the single strongest alignment between the analyzed content and algorithm mechanics"
    },

    "crossNicheTransferables": [
      "principle 1 that would work in any niche",
      "principle 2 that would work in any niche",
      "principle 3 that would work in any niche"
    ],

    "readyToUseScriptOpening": "a complete 30-50 word script opening using the dominant hook pattern, winning packaging framework, and proper payoff delay setup — the creator can adapt this today",

    "topInsight": "the single most important thing this analysis reveals that most creators in this niche are NOT doing, grounded in the growth theory framework",

    "deploymentPlaybook": {
      "trialReelStrategy": "specific advice on how to test the winning hook + packaging combinations using Trial Reels (max 5/day, test 3 completely different angles for the same idea, not tiny variations)",
      "storySequence": {
        "story1": "curiosity loop opener tied to the niche — tease a major result",
        "story2": "context or behind-the-scenes insight",
        "story3": "clear CTA to watch the Reel"
      },
      "optimizationLoop": "specific advice on using retention graphs after posting: where to expect drop-offs based on the patterns found, and how to cut-and-repost if retention dips",
      "seriesLaunchPlan": "a concrete 3-5 part series outline based on the dominant topics and packaging frameworks found in the analysis — designed to force binge sessions",
      "pcrTracking": "reminder to track Profile Conversion Rate (New Followers / Profile Visits) weekly after implementing these patterns. Target: 10-15%+ for strong accounts. If below 5%, the issue is profile optimization, not content.",
      "postingCadence": "recommendation on posting frequency and timing based on the analyzed content patterns, with a warning about Algorithm Alzheimer's (1-2 months of silence = algorithm deletes your data entirely)"
    }
  }
}`;
}

// ---------------------------------------------------------------------------
// Main: synthesize all per-reel analyses into a Formula Card
// ---------------------------------------------------------------------------

export interface SynthesizeResult {
  formulaCard: FormulaCard | null;
  error: string | null;
  retried: boolean;
}

export async function synthesize(
  analyses: ReelAnalysis[],
  niche: string,
  goal: string
): Promise<SynthesizeResult> {
  if (analyses.length === 0) {
    return { formulaCard: null, error: "No analyses to synthesize", retried: false };
  }

  const client = getClient();
  const userPrompt = buildSynthesisPrompt(analyses, niche, goal);

  // First attempt
  let raw = await callSonnet(client, userPrompt);
  let parsed = tryParseJson<FormulaCard>(raw);

  if (parsed) {
    return { formulaCard: parsed, error: null, retried: false };
  }

  // Retry with stricter instruction
  console.log("[synthesize] JSON parse failed, retrying with stricter prompt...");

  const retryPrompt =
    userPrompt +
    "\n\nYou previously returned invalid JSON. Return ONLY the JSON object, nothing else.";

  raw = await callSonnet(client, retryPrompt);
  parsed = tryParseJson<FormulaCard>(raw);

  if (parsed) {
    return { formulaCard: parsed, error: null, retried: true };
  }

  return {
    formulaCard: null,
    error: `Failed to parse synthesis JSON after retry. Raw response: ${raw.slice(0, 300)}`,
    retried: true,
  };
}

// ---------------------------------------------------------------------------
// Sonnet API call (Section 7 API Call Configuration)
// ---------------------------------------------------------------------------

async function callSonnet(client: Anthropic, userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: THEORY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error(`Unexpected content block type: ${block.type}`);
  }
  return block.text;
}
