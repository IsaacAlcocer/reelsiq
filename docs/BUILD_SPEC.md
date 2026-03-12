# ReelsIQ — Build Spec v3 (Theory-Enhanced)
**Model:** claude-haiku-4-5 (per-reel) · claude-sonnet-4-5 (synthesis)  
**Type:** Full-stack web application  
**Stack:** Next.js (App Router) · Node.js API routes · Apify (scrape + transcript) · Groq Whisper (fallback transcription) · Anthropic Claude API

---

## 1. What This Is

A bulk Reels transcript analysis tool powered by a proven Instagram growth theory engine. The user inputs one or more Instagram Reel URLs (or a competitor's handle), the system scrapes the video metadata and transcript, and sends all transcripts to Claude for structured pattern extraction — evaluated against a comprehensive framework of algorithm mechanics, hook psychology, retention science, and content architecture.

The final output is a **Formula Card** — a distilled, cross-reel playbook that tells the user exactly what hooks, narrative structures, tension mechanisms, and CTAs are working in any niche, **why they work according to platform mechanics**, and how to deploy them in a way that aligns with the 2026 algorithm.

This is NOT a metrics dashboard. The core value is **why** content works at the script and structure level, validated against proven growth principles.

---

## 2. The Problem Being Solved

Creators and marketers waste hours manually watching competitor content trying to figure out what patterns make Reels go viral. Current tools (HypeAuditor, Metricool, etc.) show performance data but don't explain the structural mechanics behind it. Even tools that analyze transcripts just report patterns without explaining *why* they work or whether they align with how the algorithm actually distributes content.

ReelsIQ inverts that — it works at the transcript level to extract transferable principles, then evaluates them against a battle-tested theory of Instagram growth mechanics (algorithm signals, hook psychology, retention architecture, session time optimization, and the trust economy).

---

## 3. Core User Flow

```
[Input] → [Scrape + Transcript] → [Quality Gate] → [Analyze] → [Theory-Enhanced Synthesis] → [Formula Card]
```

### Step-by-step:

1. **User inputs** one of the following:
   - Up to 30 individual Reel URLs (paste list)
   - Up to 3 Instagram handles (the tool pulls their recent Reels)

2. **User selects:**
   - Their niche (free text, e.g. "video editing education")
   - Their goal (dropdown): Grow following / Generate leads / Build brand awareness
   - Analysis depth: Quick (top 10 reels) / Deep (top 25 reels)

3. **System scrapes** each Reel using Apify's official Instagram Reel Scraper actor (`apify/instagram-reel-scraper`), retrieving in a single call:
   - Video URL (direct MP4 link)
   - **Transcript** (Instagram's auto-generated captions — built into the scraper)
   - View count
   - Like count
   - Share count
   - Caption
   - Follower count of the account
   - Post date
   - Duration

4. **Transcript quality gate** checks each reel:
   - If Apify returned a transcript with ≥30 words → use it directly (skip transcription)
   - If Apify returned no transcript or <30 words → download video, extract audio with ffmpeg, send to Groq Whisper for transcription
   - If transcript is still <20 words after Whisper → flag as "visual-only / no spoken content" and skip analysis

5. **System sends transcripts to Claude Haiku 4.5** individually — extracting structural data from each one using the Enhanced Extraction Schema (see Section 6)

6. **System sends all individual analyses to Claude Sonnet 4.5** with the Instagram Growth Theory System Prompt — synthesizing patterns and evaluating them against proven growth mechanics (see Section 7)

7. **Formula Card is rendered** — the theory-enhanced deliverable (see Section 12)

---

## 4. Tech Stack

| Layer | Choice | Why | Cost |
|---|---|---|---|
| Framework | Next.js 14 (App Router) | API routes + frontend in one project | Free |
| Scraping + Transcript | Apify — `apify/instagram-reel-scraper` | Handles anti-bot, returns transcript + metadata in one call, $0.0026/result | ~$0.08 for 30 reels |
| Fallback Transcription | Groq Whisper Large V3 Turbo | 216x real-time speed, $0.04/hour — 9x cheaper than OpenAI Whisper ($0.36/hr). OpenAI-compatible API | ~$0.02 for 30 min of audio |
| Audio Extraction | ffmpeg (server-side) | Extract audio from MP4 before sending to Whisper. Must be available in deployment environment | Free |
| Per-Reel Analysis | Anthropic Claude Haiku 4.5 | Structured JSON extraction is a straightforward task. $1/$5 per MTok | ~$0.03 for 30 reels |
| Theory-Enhanced Synthesis | Anthropic Claude Sonnet 4.5 | Cross-reel synthesis + theory evaluation needs stronger reasoning. $3/$15 per MTok. ~2K token theory system prompt adds ~$0.006 per job | ~$0.06 per synthesis |
| Styling | Tailwind CSS | Utility-first, fast | Free |
| State / Polling | SWR (stale-while-revalidate) | Polling job status, automatic revalidation, built for Next.js | Free |
| Temp Storage | In-memory store (Map) with 30-min TTL | Survives page refresh, no DB needed for v1 | Free |

### Estimated cost per run

| Depth | Reels | Apify | Groq (fallback) | Haiku | Sonnet | **Total** |
|---|---|---|---|---|---|---|
| Quick | 10 | $0.03 | $0.01 | $0.01 | $0.06 | **~$0.11** |
| Deep | 25 | $0.07 | $0.02 | $0.03 | $0.06 | **~$0.18** |
| Max (30 URLs) | 30 | $0.08 | $0.02 | $0.03 | $0.06 | **~$0.19** |

> The theory system prompt adds ~$0.006 per job (one-time cost in the Sonnet synthesis call). Negligible.

---

## 5. Environment Variables Needed

```env
APIFY_API_TOKEN=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 6. Enhanced Per-Reel Extraction Schema

This is the upgraded extraction schema. Compared to v2, it adds 6 new fields drawn from the Dominik growth theory: Brain Trigger Trifecta detection, Two-Step Hook Test scoring, Payoff Delay position, rhetorical interrupt density, packaging framework detection, and session architecture signals.

These new fields are extracted by Haiku at the per-reel level so the Sonnet synthesis has the raw data to evaluate against the theory.

### Per-Reel Extraction Prompt (sent to Haiku 4.5)

```
You are an expert viral content analyst specializing in short-form video.

Analyze this Instagram Reel transcript and extract a structured breakdown.
Return ONLY valid JSON. No markdown fences, no preamble, no explanation.

TRANSCRIPT:
[transcript text here]

VIDEO METADATA:
- Views: [view_count]
- Likes: [like_count]
- Shares: [share_count]
- Account followers: [follower_count]
- Caption: [caption]
- Duration: [duration_seconds]s

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
    "visualContextClue": "description of the implied visual setting/context if detectable from transcript, or null"
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
}
```

### Field Definitions for New Fields

| Field | Source Theory | What It Captures |
|---|---|---|
| `hookClarity` | Two-Step Hook Test | Does a cold viewer instantly know "this is for me"? |
| `hookCuriosityGap` | Two-Step Hook Test | Does the hook create a "but how?" question? |
| `brainTriggerTrifecta` | Brain Trigger Trifecta | Are text + spoken + visual triggers layered simultaneously? |
| `packagingFramework` | Packaging > Hooks | What structural lens is the content delivered through? |
| `payoffPosition` | Payoff Delay Technique | Where in the script does the core answer/reveal land? |
| `rhetoricalInterrupts` | Secondary Hooks / Pattern Interrupts | How many mid-script pivots, questions, or topic shifts maintain attention? |
| `sessionBehavior` | Session Time vs Watch Time | Does the CTA extend or kill the viewing session? |
| `durationBucket` | Optimal Reel Length Sweet Spots | Which length bracket does this fall into? |

### Known Limitation: Visual-Only Signals

ReelsIQ works at the transcript level. This means it can reliably detect:
- ✅ Spoken hooks, text hooks (from transcript)
- ✅ Rhetorical pattern interrupts (topic shifts, questions, pivots in speech)
- ✅ Payoff positioning (where the reveal lands in the script)
- ✅ CTA language and session behavior
- ✅ Packaging framework (detectable from script structure)

It **cannot** reliably detect:
- ❌ Visual triggers in Brain Trigger Trifecta (camera setting, scene composition)
- ❌ Visual pattern interrupts (zooms, scene cuts, camera angle changes)
- ❌ On-screen text overlays (unless read aloud or reflected in transcript)
- ❌ B-roll quality, lighting, color grading

The `brainTriggerTrifecta.visualContextClue` field is a best-effort inference from transcript context (e.g., if someone says "here in the gym" we can infer a gym visual). Claude should mark this as `null` when it cannot be inferred rather than hallucinating visual details.

The extraction prompt instructs Haiku to only report what it can detect from the transcript. The synthesis prompt should acknowledge this limitation when making visual-dependent recommendations (e.g., "Based on transcript analysis alone — visual elements like scene cuts and zooms should also be optimized but fall outside transcript-level detection").

---

## 7. Theory-Enhanced Synthesis

This is where the Dominik growth theory transforms ReelsIQ from a pattern reporter into a strategic advisor. The synthesis call to Sonnet 4.5 includes two parts:

1. **A system prompt** containing the condensed Instagram Growth Theory (~1,800 tokens)
2. **The synthesis prompt** with all per-reel analyses and instructions for the Formula Card

### API Call Configuration

The Formula Card schema with 14 sections produces a large JSON response (~3,000-5,000 tokens). The Sonnet synthesis call MUST be configured with sufficient output capacity:

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 8192, // Must be high enough for full Formula Card JSON — 4096 will truncate
  system: THEORY_SYSTEM_PROMPT, // Section 7A below
  messages: [{ role: "user", content: synthesisPrompt }] // Section 7B below
});
```

For the per-reel Haiku extraction calls, `max_tokens: 2048` is sufficient since the per-reel JSON is smaller.

### 7A. Instagram Growth Theory System Prompt

This is prepended to every synthesis call. It gives Claude the analytical lens to evaluate patterns against proven mechanics.

```
SYSTEM PROMPT:

You are a viral content strategist with deep expertise in Instagram's 2026 algorithm mechanics and content growth theory. You evaluate content patterns against the following proven framework:

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

PACKAGING > HOOKS:
Packaging = the unique lens or framework used to deliver information (Comparison A vs B, Contrarian Gap, Tastemaker Curation, Recipe Steps). Strong packaging makes the idea itself inherently interesting — you don't need to stress over exact hook wording. Videos fail more often because of weak packaging than weak hooks.

SCRIPT FRAMEWORKS THAT WORK:
- Comparison Framework (A vs B): "Millionaire Morning Routine vs. Broke Morning Routine"
- Contrarian Gap: Publicly disagree with common knowledge to build authority + curiosity
- Tastemaker Framework: Curate expertise for a specific fan base ("5 books every founder should read")
- Payoff Delay Script: Hook → Tease → Build context → Add complexity → Almost reveal → One more layer → PAYOFF

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

COMMON MISTAKES:
- Copying big creators (their face IS their hook — different rules apply)
- Revealing the payoff early (kills retention)
- Generic AI-sounding scripts (audiences repel them instantly)
- "Me-focused" content to cold audiences (they don't care about you yet — lead with their transformation)
- Session-killing CTAs (external links) on growing accounts
- Judging content performance before 3-4 weeks (algorithm tests in multiple waves)

Use this framework to evaluate patterns found in the analyzed reels. When recommending strategies, ground them in these mechanics. When identifying what's working, explain WHY it works according to this theory. When spotting weaknesses, flag them against these principles.
```

### 7B. Cross-Reel Synthesis Prompt (sent to Sonnet 4.5)

```
You are a viral content strategist analyzing patterns across multiple high-performing Instagram Reels using your Instagram Growth Theory framework.

Below are structured analyses of [N] Reels from the [NICHE] niche.
The creator's goal is: [GOAL]

INDIVIDUAL ANALYSES:
[paste all JSON analyses]

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
}
```

---

## 8. API Architecture — Job-Based

> Same architecture as v2. No changes needed — the theory enhancement lives entirely in the prompts and schema.

### `POST /api/jobs`
- Input: `{ urls?: string[], handles?: string[], niche: string, goal: string, depth: "quick" | "deep" }`
- Creates a job ID, stores in in-memory Map, returns `{ jobId: string }`
- Kicks off the entire pipeline server-side (see Section 11)
- Validates input before starting:
  - Deduplicates URLs
  - Validates URL format (must match `instagram.com/reel/` or `instagram.com/p/` pattern)
  - Rejects non-Instagram URLs with specific feedback
  - Enforces max 30 URLs or max 3 handles

### `GET /api/jobs/[jobId]/status`
- Returns current job state:
```json
{
  "status": "scraping" | "transcribing" | "analyzing" | "synthesizing" | "complete" | "error",
  "progress": {
    "stage": "scraping",
    "completed": 7,
    "total": 10,
    "skipped": 1,
    "skipReasons": [{ "url": "...", "reason": "Private account" }]
  },
  "result": null | { formulaCard: {...}, individualAnalyses: [...] }
}
```
- Frontend polls every 2 seconds using SWR
- Job data expires after 30 minutes (TTL)

### `POST /api/jobs/[jobId]/export`
- Returns Formula Card as markdown or JSON
- Format specified via query param: `?format=markdown` or `?format=json`

### Handle Resolution (internal, not a separate endpoint)
- When handles are provided, the job pipeline calls Apify with usernames
- Apify's Reel Scraper natively accepts usernames and returns recent reels
- Sort returned reels by `videoPlayCount` descending, take top N based on depth setting

---

## 9. Frontend Pages

### `/` — Home / Input Page
- Clean input form
- URL paste area (textarea, one URL per line)
- OR handle input (up to 3 handles)
- Niche text input
- Goal dropdown
- Depth toggle (Quick / Deep)
- "Analyze Reels" button
- Client-side validation: URL format check, dedup warning, handle format check

### `/analysis/[jobId]` — Results Page
- Real-time progress indicator showing:
  - Current stage name (Scraping → Transcribing → Analyzing → Synthesizing)
  - X of Y completed within current stage
  - Skipped items with reasons (collapsed by default)
  - Estimated time remaining (based on average per-item time)
- **Formula Card** prominently displayed at the top once synthesis is complete (see Section 12)
- Individual reel cards (collapsed by default) showing per-reel data
- Confidence badges on Formula Card patterns (high/medium/low based on frequency)
- Export buttons: Copy as Markdown, Download JSON
- Warning banner if fewer than 5 successful transcriptions: "Analysis based on limited data — patterns may be less reliable"

---

## 10. UI/UX Requirements

- Dark theme, minimal, information-dense
- Progress must be shown in real-time — user should know exact stage and count, not just a spinner
- Individual reel analyses should be accessible but not overwhelming — the Formula Card is the hero
- Formula Card should feel like a deliverable — something you'd screenshot or export
- High-confidence patterns (>60% frequency) get visual emphasis; low-confidence (<20%) get muted styling
- Algorithm Alignment Score should be visually prominent — it's a unique differentiator
- Mobile-responsive but optimized for desktop (this is a power-user tool)

---

## 11. Error Handling Requirements

Every failure mode must be handled gracefully:

| Failure | Action |
|---|---|
| Private Instagram account | Skip with notice, continue with remaining reels |
| Deleted or unavailable reel | Skip with notice |
| Apify rate limit | Queue and retry with exponential backoff (max 3 retries) |
| Apify returns no transcript & <30 words | Fall back to Groq Whisper transcription |
| Groq Whisper failure | Retry once, then skip reel with notice |
| Groq Whisper returns <20 words | Flag as "visual-only / no spoken content", skip analysis |
| Claude JSON parse failure | Strip markdown fences, attempt regex JSON extraction, retry once with stricter prompt if still fails |
| Claude API failure | Retry once with exponential backoff |
| Fewer than 5 successful transcriptions | Warn user in UI, proceed with synthesis but add reliability caveat |
| 0 successful transcriptions | Clear error state: "No analyzable content found. This may be because the reels have no spoken audio or the accounts are private." |
| Duplicate URLs in input | Deduplicate silently, show count of unique reels being processed |
| Non-Instagram URL | Reject at validation with specific error message |
| CDN link expired before download | Re-scrape the specific reel (Apify returns fresh CDN links each call) |
| Job not found (expired TTL) | "This analysis has expired. Please run a new analysis." |

### JSON Parse Robustness

```
1. Try JSON.parse(raw) directly
2. If fails: strip ```json and ``` fences, try again
3. If fails: regex extract first { ... } block, try again
4. If fails: retry Claude call with appended instruction "You previously returned invalid JSON. Return ONLY the JSON object, nothing else."
5. If still fails: skip this reel, log error
```

---

## 12. Processing Architecture

### Job Processor Pipeline

```
1. SCRAPE PHASE
   └── Call Apify with all URLs/handles in a single actor run
   └── Apify returns all results including transcripts
   └── Sort by views if from handles, take top N

2. TRANSCRIPT QUALITY GATE (parallel, max 5 concurrent)
   └── For each reel:
       ├── If Apify transcript ≥ 30 words → pass through
       └── If missing/short → download video → ffmpeg extract audio → Groq Whisper
   └── Filter out reels with <20 words after all attempts

3. ANALYZE PHASE (parallel, max 10 concurrent)
   └── Send each transcript to Claude Haiku 4.5 with Enhanced Extraction Prompt
   └── Parse and validate JSON response (including new fields)
   └── Retry on parse failure (see Section 11)

4. THEORY-ENHANCED SYNTHESIS PHASE (single call)
   └── Wait for all analyses to complete
   └── Prepend Instagram Growth Theory System Prompt (Section 7A)
   └── Send all analyses + user niche/goal to Claude Sonnet 4.5 (Section 7B)
   └── Parse Formula Card JSON
```

### Concurrency Limits

| Service | Max Concurrent | Why |
|---|---|---|
| Apify | 1 (single batch call) | Actor handles parallelism internally |
| Groq Whisper | 5 | Avoid rate limits; Groq allows 15 concurrent but leave headroom |
| Claude Haiku | 10 | Haiku has high rate limits; per-reel calls are small |
| Claude Sonnet | 1 | Single synthesis call |

### ffmpeg Audio Extraction

When Groq Whisper fallback is needed:

```bash
# Extract audio, compress to mono 16kHz (optimal for Whisper), enforce 25MB limit
ffmpeg -i input.mp4 -vn -acodec libmp3lame -ar 16000 -ac 1 -b:a 64k output.mp3
```

- Groq accepts up to 100MB on dev tier, 25MB on free tier
- 64kbps mono at 16kHz ≈ 0.5MB per minute → a 3-minute reel = ~1.5MB (well within limits)

### Important: Deployment Environment

**Do NOT deploy on Vercel.** Requires ffmpeg, long-running processes, and in-memory storage.

Use one of:
- **Railway** — Docker support, persistent processes, easy env vars
- **Render** — Background workers + web service, Docker support
- **Fly.io** — Docker, persistent volumes, global edge

---

## 13. Output Format — Formula Card

The Formula Card is the hero deliverable. With v3's theory integration, it goes from "pattern report" to "strategic playbook grounded in proven growth mechanics."

### Section Order

1. **Header** — Niche, reels analyzed, goal, analysis date

2. **Algorithm Alignment Score** *(NEW — v3)* — The headline differentiator. A visual scorecard showing how well the analyzed content aligns with 2026 algorithm signals. Each signal (session time, payoff delay, hook clarity, etc.) gets a status indicator (aligned / partially / misaligned). The `biggestGap` is called out prominently as the #1 opportunity. The `biggestStrength` is highlighted as what's already working.

3. **Hook Diagnostic** *(NEW — v3)* — Not just a list of hooks, but a diagnostic. Shows how many passed both gates of the Two-Step Test. Shows Brain Trigger Trifecta adoption rate. Surfaces whether hooks in this niche succeed through clarity, curiosity, or both.

4. **Winning Hook Formulas** — Templates with fill-in-the-blank format. Each now includes a `twoStepVerdict` showing which gates it passes. Confidence badges (high/medium/low). Psychology notes grounded in theory.

5. **Packaging Strategy** *(NEW — v3)* — What packaging frameworks top performers use, plus 2-3 recommended packaging frameworks for the user's niche with fill-in-the-blank templates. Grounded in the principle that packaging > hooks.

6. **Retention Architecture** *(UPGRADED — v3)* — Combines the old "Dominant Narrative Structure" with new payoff delay analysis, rhetorical interrupt density, and specific retention advice. Shows whether top performers in this niche use the Payoff Delay technique and how aggressively.

7. **Vocabulary & Rhythm Profile** — Words to use, words to avoid, pacing advice. Now includes an `authenticityNote` flagging if the vocabulary sounds AI-generated (trust recession signal).

8. **Emotional Journey** — The arc from hook to CTA.

9. **Session Time Strategy** *(NEW — v3)* — Breaks down CTA behaviors across analyzed reels. Flags session-killing patterns. Recommends a specific signature series concept for the niche. Gives a bingeability score.

10. **CTA Patterns** — Templates ready to use. Now tagged with `sessionImpact` showing whether each CTA extends or kills viewing sessions.

11. **Cross-Niche Transferables** — Universal principles.

12. **Ready-to-Use Script Opening** — 30-50 words using the dominant hook + winning packaging + proper payoff delay setup. More strategically constructed than v2 because the synthesis has theory context.

13. **Top Insight** — The most important finding, now grounded in the growth theory framework. Not just "what you're not doing" but "what you're not doing and why it matters according to how the algorithm works."

14. **Deployment Playbook** *(NEW — v3)* — Closes the loop from analysis → action. Gives the user 5-6 tactical next steps drawn from proven distribution mechanics:
    - **Trial Reel Strategy**: How to test the winning hook + packaging combinations (max 5/day, 3 completely different angles)
    - **Story Sequence**: A ready-to-use 3-story trailer sequence to distribute their Reel
    - **Optimization Loop**: How to read retention graphs after posting and when to cut-and-repost
    - **Series Launch Plan**: A concrete 3-5 part series outline based on the analysis, designed to force binge sessions
    - **PCR Tracking**: Weekly Profile Conversion Rate tracking guidance with target benchmarks
    - **Posting Cadence**: Frequency recommendation with Algorithm Alzheimer's warning

### Confidence Visualization

| Frequency | Badge | Styling |
|---|---|---|
| ≥60% of reels | HIGH | Green accent, full opacity, prominent |
| 30-59% of reels | MEDIUM | Yellow accent, standard |
| <30% of reels | LOW | Gray accent, muted, smaller |

### Algorithm Alignment Score Visualization

| Status | Styling |
|---|---|
| Aligned | Green check, solid |
| Partially Aligned | Yellow dash, standard |
| Misaligned | Red X, prominent callout |

The `biggestGap` gets a special callout box — styled as an opportunity, not a failure. The `biggestStrength` gets a subtle green highlight.

---

## 14. Cost Controls & Rate Limiting

### Per-Request Budget

- **IP-based rate limiting**: Max 5 jobs per IP per hour
- **Global concurrent job limit**: Max 10 active jobs at any time
- **Hard cap per job**: 30 reels maximum
- **Timeout**: Kill any job that hasn't completed within 10 minutes

### Cost Monitoring

Log per-job costs to console in development:
```
[JOB abc123] Apify: 10 results ($0.03) | Groq: 3 fallback ($0.006) | Haiku: 10 calls ($0.01) | Sonnet: 1 call ($0.06) | TOTAL: $0.106
```

### Budget Kill Switch

`MAX_DAILY_SPEND` env var (default: $10). Track cumulative daily spend in memory. If exceeded, return 503.

---

## 15. What NOT to Build

- No user accounts or auth in v1
- No persistent storage or history in v1 (in-memory with TTL only)
- No metrics dashboard
- No AI-generated video scripts (the tool gives frameworks and theory-grounded strategy, not finished scripts)
- No social media scheduling or publishing
- No real-time scraping dashboard

---

## 16. Build Order

1. **Apify integration** — Confirm scrape + transcript retrieval. Test with 5 URLs.
2. **Groq Whisper fallback** — Test ffmpeg → Groq pipeline with a captionless reel.
3. **Per-reel Claude analysis (Enhanced Schema)** — Send 5 transcripts to Haiku 4.5 with the new extraction prompt. Confirm all new fields (hookClarity, payoffPosition, packagingFramework, etc.) are populated correctly.
4. **Theory System Prompt + Synthesis** — Send 5 analyses to Sonnet 4.5 with the growth theory system prompt. Confirm the Formula Card output includes all new sections (hookDiagnostic, packagingStrategy, retentionArchitecture, sessionTimeStrategy, algorithmAlignmentScore). Verify the theory grounding is visible in the insights — they should reference algorithm mechanics, not just report patterns.
5. **Job-based API** — Build POST /api/jobs and GET /api/jobs/[id]/status. Wire the full pipeline.
6. **Frontend input form** — Build with validation.
7. **Results page and Formula Card component** — Build all 13 sections of the Formula Card with proper hierarchy. Algorithm Alignment Score and Hook Diagnostic should be visually striking.
8. **Progress indicators and error states** — Real-time status updates.
9. **Rate limiting and cost controls** — IP limits, budget kill switch.
10. **Export** — Markdown and JSON export.
11. **Polish** — Loading states, error copy, mobile responsiveness.

---

## 17. Testing Reels to Use During Development

Use these public niches with well-known viral accounts:
- Personal finance education
- Video editing tips
- Fitness coaching
- B2B SaaS / agency content

**Critical test cases:**
- A reel with clear spoken audio (should get transcript from Apify directly)
- A reel with no spoken audio / music only (should be flagged as visual-only)
- A reel in a non-English language (test Whisper's language handling)
- A private account handle (should fail gracefully)
- A deleted reel URL (should skip with notice)
- 30 URLs at once (stress test the pipeline)
- **A reel with a strong Payoff Delay** (verify `payoffPosition` = "final_third")
- **A reel using Comparison A vs B packaging** (verify `packagingFramework` = "comparison_ab")
- **A reel with an external link CTA** (verify `sessionBehavior` = "external_link" and the session warning fires)
- **A reel with Brain Trigger Trifecta** (verify all three elements detected)

---

## 18. Definition of Done

The tool is complete when:
- [ ] A user can paste 10+ Reel URLs and get a Formula Card in under 4 minutes
- [ ] The Formula Card contains an Algorithm Alignment Score with per-signal status
- [ ] The Hook Diagnostic shows Two-Step Test results and Brain Trigger Trifecta usage
- [ ] Packaging Strategy recommends specific frameworks with templates for the niche
- [ ] Retention Architecture includes payoff delay analysis and rhetorical interrupt density
- [ ] Session Time Strategy flags session-killing CTAs and suggests a signature series concept
- [ ] All theory-grounded insights reference WHY something works, not just WHAT was found
- [ ] Fill-in-the-blank hook and packaging templates are specific to the input niche
- [ ] The ready-to-use script opening uses the dominant hook + winning packaging + proper payoff delay
- [ ] The Deployment Playbook includes a Trial Reel strategy, Story Sequence, series launch plan, and PCR tracking guidance
- [ ] The cross-niche transferables section contains principles that genuinely abstract above the niche
- [ ] All error states are handled — no unhandled crashes
- [ ] The UI clearly communicates progress with stage, count, and skip reasons
- [ ] Visual-only reels are detected and skipped without breaking the pipeline
- [ ] Export works in both Markdown and JSON formats
- [ ] Rate limiting prevents abuse (5 jobs/IP/hour, 10 concurrent global)
- [ ] Job results survive a page refresh (accessible by URL for 30 minutes)

---

## Appendix A: Key Changes from v2 → v3

| Area | v2 Spec | v3 Spec | Impact |
|---|---|---|---|
| Per-reel extraction | 17 fields | 23 fields (+6 theory-derived) | Captures hook psychology, retention architecture, packaging, and session signals at the raw data level |
| Synthesis prompt | Pattern reporting | Theory-grounded evaluation with ~1,800 token system prompt | Formula Card explains WHY patterns work, not just WHAT was found |
| Formula Card sections | 9 sections | 14 sections (+5 theory-powered) | New: Algorithm Alignment Score, Hook Diagnostic, Packaging Strategy, Session Time Strategy, Deployment Playbook |
| Hook analysis | Hook category + template | Two-Step Test diagnostic + Brain Trigger Trifecta detection + theory-grounded psychology notes | Hooks are evaluated against proven hook science, not just categorized |
| Retention analysis | Narrative structure only | Payoff Delay analysis + rhetorical interrupt density + retention architecture | Measures whether top performers use the #1 retention technique |
| CTA analysis | Style + template | Style + template + session impact classification | Flags session-killing CTAs, recommends session-extending alternatives |
| Packaging | Not captured | Full packaging framework detection + recommendations with templates | Addresses the principle that packaging > hooks — a gap in every competitor tool |
| Algorithm alignment | Not captured | Per-signal scorecard with biggest gap/strength callouts | Unique differentiator — no other tool evaluates content against algorithm mechanics |
| Deployment tactics | Not captured | Trial Reel strategy, Story Sequencing, series launch plan, PCR tracking, posting cadence | Closes the loop from analysis → action with proven distribution mechanics |
| Script opening | Generic template | Theory-informed: dominant hook + winning packaging + payoff delay setup | More strategically constructed, more immediately usable |
| Visual limitations | Not acknowledged | Explicit limitation disclosure for transcript-only analysis | Prevents hallucinated visual data, sets honest expectations |
| Sonnet max_tokens | Not specified | Explicit 8192 max_tokens for synthesis call | Prevents truncated Formula Card JSON |
| Cost impact | ~$0.10-0.18/run | ~$0.11-0.19/run (+$0.006 for theory system prompt) | Negligible — theory is practically free |

## Appendix B: Estimated Pipeline Timing (10 Reels, Quick Depth)

| Stage | Per-item | Parallelism | Wall time |
|---|---|---|---|
| Apify scrape (batch) | — | Single call | 15-30s |
| Transcript quality gate | 3-8s (Groq fallback only) | 5 concurrent | 0-16s (most skip this) |
| Haiku analysis (enhanced) | 3-5s | 10 concurrent | 5-10s |
| Sonnet synthesis (with theory) | — | Single call | 10-20s |
| **Total** | | | **~35-75s typical** |

> Haiku extraction is ~1s slower per reel due to the larger schema. Sonnet synthesis is ~2-5s longer due to the theory system prompt and larger output schema. Total impact: negligible. The "under 4 minutes" target still has substantial headroom.

## Appendix C: Theory System Prompt Token Budget

The Instagram Growth Theory System Prompt is approximately 1,800 tokens. At Sonnet 4.5's $3/MTok input rate, this costs **$0.0054 per synthesis call** — roughly half a cent. Since it's called once per job (not per reel), the cost impact is negligible even at scale.

At 1,000 jobs/month: $5.40/month for the theory layer.
At 10,000 jobs/month: $54/month.

The theory is essentially free.

## Appendix D: File Organization

```
reelsiq/
├── docs/
│   ├── BUILD_SPEC.md          ← This file (v3)
│   └── GROWTH_THEORY.md       ← The Dominik strategy source (reference only)
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Home / Input page
│   │   ├── analysis/
│   │   │   └── [jobId]/
│   │   │       └── page.tsx   ← Results page
│   │   └── api/
│   │       └── jobs/
│   │           ├── route.ts   ← POST /api/jobs
│   │           └── [jobId]/
│   │               ├── status/
│   │               │   └── route.ts  ← GET /api/jobs/[jobId]/status
│   │               └── export/
│   │                   └── route.ts  ← POST /api/jobs/[jobId]/export
│   ├── lib/
│   │   ├── apify.ts           ← Apify scraper integration
│   │   ├── transcribe.ts      ← Groq Whisper fallback + ffmpeg
│   │   ├── analyze.ts         ← Per-reel Haiku extraction (enhanced schema)
│   │   ├── synthesize.ts      ← Theory-enhanced Sonnet synthesis
│   │   ├── theory-prompt.ts   ← Instagram Growth Theory system prompt (exported as string constant)
│   │   ├── job-store.ts       ← In-memory Map with TTL
│   │   ├── job-processor.ts   ← Pipeline orchestrator
│   │   ├── parse-json.ts      ← JSON parse robustness pipeline
│   │   ├── validators.ts      ← Input validation (URLs, handles, dedup)
│   │   └── rate-limit.ts      ← IP rate limiting + budget kill switch
│   ├── components/
│   │   ├── FormulaCard/
│   │   │   ├── FormulaCard.tsx             ← Main wrapper
│   │   │   ├── AlgorithmAlignment.tsx      ← Algorithm Alignment Score section
│   │   │   ├── HookDiagnostic.tsx          ← Hook Diagnostic section
│   │   │   ├── WinningHooks.tsx            ← Hook templates with confidence + two-step verdict
│   │   │   ├── PackagingStrategy.tsx        ← Packaging recommendations
│   │   │   ├── RetentionArchitecture.tsx   ← Payoff delay + interrupts + structure
│   │   │   ├── VocabularyProfile.tsx       ← Words + rhythm + authenticity
│   │   │   ├── EmotionalJourney.tsx        ← Emotional arc
│   │   │   ├── SessionTimeStrategy.tsx     ← Session analysis + series recommendation
│   │   │   ├── CTAPatterns.tsx             ← CTA templates with session impact
│   │   │   ├── CrossNicheTransferables.tsx ← Universal principles
│   │   │   ├── ScriptOpening.tsx           ← Ready-to-use opening
│   │   │   ├── TopInsight.tsx              ← Hero callout
│   │   │   └── DeploymentPlaybook.tsx     ← Tactical next steps (Trial Reels, Story Sequence, PCR, Series)
│   │   ├── ProgressIndicator.tsx
│   │   ├── ReelCard.tsx                    ← Individual reel analysis (collapsed)
│   │   ├── InputForm.tsx
│   │   └── ConfidenceBadge.tsx
│   └── types/
│       ├── extraction.ts      ← Per-reel JSON schema TypeScript types
│       ├── formula-card.ts    ← Formula Card JSON schema TypeScript types
│       └── job.ts             ← Job state types
├── .env.local
├── Dockerfile                 ← For Railway/Render/Fly.io deployment
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```
