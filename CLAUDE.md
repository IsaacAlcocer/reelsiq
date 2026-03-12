# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint (next/core-web-vitals + next/typescript)
npm run test:apify       # Test Apify scraping (3 default reels)
npm run test:transcribe  # Test transcription pipeline (5 reels)
npm run test:analyze     # Test per-reel analysis: npm run test:analyze [url1] [url2]
npm run test:synthesize  # Test full pipeline: npm run test:synthesize [url1] [url2]
```

There is no unit test suite. The `test:*` scripts are integration tests that hit live APIs (Apify, Groq, Anthropic) and require `.env` credentials.

## Architecture

ReelsIQ is a Next.js 14 App Router application with two modes:

1. **Reel Analysis** — Bulk-analyzes Instagram Reels through a four-phase AI pipeline and produces a "Formula Card" (13-section playbook grounded in Instagram growth theory).
2. **Script Lab** — Users paste their own scripts, which get audited against the growth theory framework. Produces per-script scorecards with grades, issues, and refined openings.

### Processing Pipeline (src/lib/job-processor.ts)

Jobs flow through four sequential phases, each with its own concurrency limit:

1. **Scrape** (1 batch call) — Apify fetches all reel metadata + transcripts in a single actor run. When handles are provided, reels are sorted by views and top N selected (quick=10, deep=25).

2. **Transcribe** (5 concurrent) — Quality gate: if Apify transcript ≥30 words, use it directly. Otherwise download video → ffmpeg extract audio → Groq Whisper. Reels with <20 words after all attempts are flagged "visual-only" and skipped.

3. **Analyze** (10 concurrent) — Claude Haiku extracts a 23-field structured JSON (`ReelAnalysis`) from each transcript. No theory system prompt at this stage — purely structural extraction.

4. **Synthesize** (1 call) — Claude Sonnet receives all `ReelAnalysis` objects with `THEORY_SYSTEM_PROMPT` (from `src/lib/theory-prompt.ts`) as the system message. Produces the `FormulaCard` by evaluating cross-reel patterns against the growth theory framework.

Concurrency is managed by a `runWithConcurrency` helper (worker pool pattern with shared index counter in job-processor.ts). Each phase validates it has enough data to continue — if zero usable reels survive any gate, the job errors gracefully.

### Script Lab Pipeline (src/lib/script-processor.ts)

Script jobs skip scrape and transcribe entirely — the user provides scripts as text:

1. **Analyze** (10 concurrent) — `analyze-script.ts` runs each script through Haiku with an adapted prompt (no video metadata). Produces the same 23-field `ReelAnalysis` schema.

2. **Audit** (1 call) — `audit.ts` sends all analyses + original script texts to Sonnet with the theory system prompt. Produces a `ScriptAuditResult` containing per-script `ScriptScorecard`s (overall score, hook/packaging/retention/authenticity assessments, issues list, refined opening) plus cross-script patterns.

Job type is distinguished by `job.jobType: "reels" | "scripts"`. The API route dispatches to either `processJob` or `processScriptJob`.

### State & Polling

- **Server state**: In-memory `Map` on `globalThis.__reelsiq_jobs` (survives HMR). 30-minute TTL with cleanup every 5 minutes. No database.
- **Client polling**: SWR fetches `/api/jobs/[jobId]/status` every 2 seconds. Polling stops when status reaches `complete` or `error`.

### AI Call Pattern

Both `analyze.ts` and `synthesize.ts` follow the same JSON robustness pattern:
1. Call Claude, attempt `tryParseJson` (4-step fallback: direct parse → strip fences → regex extract `{...}` → null)
2. On parse failure, retry once with a stricter "Return ONLY JSON" instruction
3. On second failure, return error for that reel (analyze) or the whole job (synthesize)

Key difference: Haiku calls (analyze) use 2048 max tokens with no system prompt. Sonnet calls (synthesize) use 8192 max tokens with the theory system prompt.

### Theory Engine (src/lib/theory-prompt.ts)

The synthesis system prompt encodes Instagram growth mechanics: algorithm signals (session time > watch time), hook science (Two-Step Test, Brain Trigger Trifecta), retention architecture (payoff delay, rhetorical interrupts), packaging frameworks, session strategy, and trust recession dynamics. This is what makes the output theory-grounded rather than generic pattern matching. The full theory reference lives in `docs/GROWTH_THEORY.md`.

### Formula Card Structure (src/types/formula-card.ts)

The FormulaCard has 13 sections, each rendered by a dedicated component in `src/components/FormulaCard/`. The master container (`FormulaCard.tsx`) renders them in order. Supporting UI components: `ConfidenceBadge` (high/medium/low), `InfoTip` (glossary tooltip linking to terms in `src/lib/glossary.ts`).

## Key Files

| File | What it does |
|------|-------------|
| `src/lib/job-processor.ts` | Pipeline orchestrator — the core of the application |
| `src/lib/theory-prompt.ts` | Growth theory system prompt for Sonnet synthesis |
| `src/lib/analyze.ts` | Per-reel Haiku extraction (23-field ReelAnalysis schema) |
| `src/lib/synthesize.ts` | Cross-reel Sonnet synthesis (FormulaCard output) |
| `src/lib/parse-json.ts` | 4-step JSON parsing fallback |
| `src/lib/job-store.ts` | In-memory job store with TTL |
| `src/lib/analyze-script.ts` | Per-script Haiku extraction (adapted prompt, no metadata) |
| `src/lib/audit.ts` | Script audit Sonnet synthesis (ScriptScorecard output) |
| `src/lib/script-processor.ts` | Script Lab pipeline orchestrator |
| `src/types/script-audit.ts` | TypeScript interfaces for Script Lab |
| `src/lib/apify.ts` | Apify actor integration |
| `src/lib/transcribe.ts` | Transcript quality gate + Groq Whisper fallback |
| `src/lib/rate-limit.ts` | Per-IP rate limiting (10/hr) + kill switch |
| `src/lib/validators.ts` | Input validation (URLs, handles, niche, goal) |
| `src/types/formula-card.ts` | TypeScript interfaces for the entire FormulaCard |

## Configuration

- **Path alias**: `@/*` maps to `./src/*`
- **TypeScript**: Strict mode enabled
- **ESLint**: Extends `next/core-web-vitals` and `next/typescript`
- **next.config.mjs**: `apify-client` externalized from server bundle
- **ffmpeg**: Required system dependency for audio extraction
- **Environment**: `APIFY_API_TOKEN`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY` in `.env`. Optional `REELSIQ_KILL_SWITCH=1` to block new jobs.
