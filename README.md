# ReelsIQ

A theory-enhanced Instagram Reels analysis engine that extracts viral content patterns from transcripts and delivers actionable playbooks grounded in proven growth mechanics.

ReelsIQ is not a metrics dashboard. It explains **why** content works at the script and structure level, evaluated against Instagram's 2026 algorithm mechanics, hook psychology, retention science, and content architecture.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Usage](#usage)
  - [Running the App](#running-the-app)
  - [Submitting an Analysis](#submitting-an-analysis)
  - [Viewing Results](#viewing-results)
  - [Exporting Results](#exporting-results)
- [Understanding the Formula Card](#understanding-the-formula-card)
- [The Theory Engine](#the-theory-engine)
- [API Reference](#api-reference)
- [Testing Scripts](#testing-scripts)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Cost Estimates](#cost-estimates)

---

## How It Works

ReelsIQ processes Instagram Reels through a five-stage AI pipeline:

```
1. SCRAPING        yt-dlp fetches video metadata from Instagram, GraphQL enriches with insights
         |
2. TRANSCRIBING    Groq Whisper transcribes audio extracted from reel videos
         |
3. ANALYZING       Claude Haiku extracts 23 structured fields per reel
         |
4. SYNTHESIZING    Claude Sonnet finds cross-reel patterns through a growth theory lens
         |
5. FORMULA CARD    A 13-section playbook: hooks, packaging, retention, voice, deployment plan
```

**Stage 1 - Scraping:** yt-dlp (free, open-source) fetches reel metadata and audio URLs, then Instagram's GraphQL API enriches each reel with view counts, play counts, and follower counts. When handles are provided instead of URLs, yt-dlp lists their recent reels, scrapes each one, and ranks them by view count, taking the top N based on analysis depth. An optional Apify backend is preserved for production use (set `SCRAPER_BACKEND=apify`).

**Stage 2 - Transcription:** Each reel's transcript is quality-gated. If the scraper returned a usable transcript (30+ words), it's used directly. Otherwise, the audio is downloaded from the CDN URL, extracted via ffmpeg, and sent to Groq Whisper for transcription. Reels with fewer than 20 words after all attempts are flagged as "visual-only" and skipped. Up to 5 transcriptions run concurrently.

**Stage 3 - Per-Reel Analysis:** Each transcript is sent to Claude Haiku 4.5 for structured extraction. The model returns a JSON object with 23 fields covering hooks, narrative structure, packaging framework, retention mechanics, vocabulary, emotion, CTAs, and transferable insights. Up to 10 analyses run concurrently.

**Stage 4 - Cross-Reel Synthesis:** All successful per-reel analyses are batched into a single Claude Sonnet 4.5 call. This call is prefixed with the Theory System Prompt — a comprehensive Instagram growth theory framework — and produces the Formula Card by finding patterns across all analyzed reels and evaluating them against the theory.

**Stage 5 - Formula Card:** The final output is a 13-section playbook ready for immediate use. Results are stored in-memory with a 30-minute TTL.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Framework | Next.js 14 (App Router) | Full-stack web application |
| Frontend | React 18 + Tailwind CSS | Dark-themed analysis UI |
| State/Polling | SWR | Real-time job progress polling (2s interval) |
| Storage | In-memory Map (30-min TTL) | Job state; no database required |
| Scraping | yt-dlp + Instagram GraphQL | Instagram metadata, video URLs, and insights (free) |
| Scraping (production) | Apify (`apify/instagram-reel-scraper`) | Optional paid backend for production scale |
| Transcription | Groq Whisper Large V3 Turbo | Audio-to-text transcription (216x real-time) |
| Audio Processing | ffmpeg | Audio extraction from video |
| Per-Reel AI | Claude Haiku 4.5 | Structured JSON extraction from transcripts |
| Synthesis AI | Claude Sonnet 4.5 | Theory-grounded cross-reel pattern synthesis |

---

## Setup

### Prerequisites

- **Node.js** 18+
- **yt-dlp** installed and available on PATH (required for Instagram scraping)
- **ffmpeg** installed and available on PATH (required for audio extraction)
- **Python** 3.x (used by yt-dlp and for cookie extraction)
- **Firefox** with a logged-in Instagram account (for cookie-based authentication)
- API keys for Groq and Anthropic

### Installation

```bash
git clone <repo-url>
cd reelsiq
npm install
```

### System Dependencies

```bash
# Verify yt-dlp
yt-dlp --version

# Verify ffmpeg
ffmpeg -version

# Install if missing:
# macOS:   brew install yt-dlp ffmpeg
# Windows: winget install yt-dlp.yt-dlp && winget install ffmpeg
# Linux:   pip install yt-dlp && apt install ffmpeg
```

### Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=gsk_...                   # Groq API key (for Whisper transcription)
ANTHROPIC_API_KEY=sk-ant-api03-...     # Anthropic API key (for Claude)
```

Optional:

```env
# Scraper configuration (yt-dlp is the default — no config needed)
INSTAGRAM_COOKIES_BROWSER=firefox      # Browser to read Instagram cookies from (default: firefox)
# INSTAGRAM_COOKIES_FILE=              # Path to Netscape cookies.txt file (overrides browser)
# YTDLP_CONCURRENCY=3                 # Max concurrent yt-dlp calls (default: 3)
# YTDLP_DELAY_MS=1000                 # Delay between requests in ms (default: 1000)

# Production: switch to Apify for managed scraping
# SCRAPER_BACKEND=apify               # Set to "apify" to use Apify instead of yt-dlp
# APIFY_API_TOKEN=apify_api_...       # Required only when SCRAPER_BACKEND=apify

REELSIQ_KILL_SWITCH=1                  # Set to "1" to block all new job submissions
```

### Instagram Cookie Setup

The yt-dlp scraper reads Instagram cookies from Firefox to authenticate with Instagram:

1. Open Firefox and log into a **dedicated scraper Instagram account** (not your personal account)
2. That's it — yt-dlp automatically reads the cookies from Firefox

> **Tip:** Use a separate Instagram account for scraping to avoid any risk to your personal account. Keep Chrome for personal browsing, Firefox for the scraper account.

---

## Usage

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Submitting an Analysis

On the home page, you'll see the input form with these fields:

**Input Mode — URLs or Handles (at least one required):**

- **Reel URLs**: Paste up to 30 Instagram Reel URLs (one per line, or comma-separated). Must match `instagram.com/reel/` or `instagram.com/p/` format. Duplicates are automatically removed.
- **Handles**: Enter up to 3 Instagram handles (e.g., `@username`). The system will pull their recent reels and select the top-performing ones by view count.

**Configuration:**

- **Niche** (required): Describe the content niche in free-form text (e.g., "video editing education", "personal finance for millennials").
- **Goal** (required): Select one of:
  - Grow following
  - Generate leads
  - Build brand awareness
- **Depth**: Choose analysis depth:
  - **Quick** — Analyzes up to 10 reels. Faster and cheaper.
  - **Deep** — Analyzes up to 25 reels. More data points for stronger pattern detection.

Click **Analyze** to submit. You'll be redirected to the results page immediately.

### Viewing Results

The results page (`/analysis/[jobId]`) shows real-time progress through each pipeline stage:

1. **Scraping** — Fetching reel data from Instagram
2. **Transcribing** — Extracting/generating transcripts
3. **Analyzing** — Running per-reel AI analysis
4. **Synthesizing** — Building the cross-reel Formula Card
5. **Complete** — Results ready

A progress bar shows completion percentage, and any skipped reels (visual-only, failed transcript, etc.) are listed with their skip reasons.

Once complete, the page displays:

- **The Formula Card** — The 13-section playbook (see below)
- **Individual Analyses** — Collapsible panels showing the raw structured extraction for each reel

### Exporting Results

Two export options are available on the results page:

- **Copy as Markdown** — Copies the full Formula Card as formatted Markdown to your clipboard
- **Download as JSON** — Downloads the raw Formula Card data as a JSON file

Results are available for 30 minutes after job completion.

### Guide Page

Visit `/guide` for an interactive educational resource with three tabs:

- **How It Works** — Visual pipeline walkthrough and theory engine explanation
- **Reading Your Card** — Detailed explanation of each Formula Card section
- **Glossary** — 25+ searchable terms (Two-Step Test, Payoff Delay, Packaging, Brain Trigger Trifecta, etc.)

---

## Understanding the Formula Card

The Formula Card is a 13-section playbook synthesized from all analyzed reels. Each section targets a specific aspect of content strategy:

### 1. Algorithm Alignment Score

An overall assessment of how well the analyzed content aligns with Instagram's 2026 algorithm. Includes:
- Overall rating (strong / moderate / weak)
- Individual signal assessments (session time, retention, shareability, etc.)
- Biggest strength and biggest gap

### 2. Hook Diagnostic

Deep analysis of hook patterns across all reels:
- **Two-Step Test Results** — How many hooks passed both instant clarity AND curiosity gap
- **Brain Trigger Trifecta Usage** — How many reels used all three triggers (visual + text + spoken) in the first 1-2 seconds
- **Dominant Hook Category** — The most common hook type (question, contradiction, bold claim, etc.)

### 3. Winning Hooks

Fill-in-the-blank hook templates extracted from the best-performing patterns:
- Category, template, and example for each
- Confidence level (high / medium / low)
- Two-Step verdict and psychology explanation

### 4. Packaging Strategy

Analysis of content frameworks — the "lens" through which information is delivered:
- Dominant packaging framework (A vs B comparison, contrarian gap, curation, etc.)
- Recommended frameworks with templates, examples, and explanations of why they work

### 5. Retention Architecture

How the content keeps viewers watching:
- **Payoff Delay Analysis** — Where in the video the answer/payoff is revealed (early, middle, delayed, or none)
- **Rhetorical Interrupt Density** — Average number of pattern breaks per reel
- **Dominant Narrative Structure** — The most common story arc (problem-solution, before-after, etc.)

### 6. Vocabulary Profile

Language and voice patterns:
- Vocabulary level (simple/punchy, conversational, technical)
- Sentence rhythm (rapid-fire, measured, mixed)
- Words to use and words to avoid
- Authenticity assessment

### 7. Emotional Journey

A narrative description of the emotional arc across the analyzed content — how the reels make viewers feel and the emotional progression from hook to payoff.

### 8. Session Time Strategy

How the content drives (or kills) viewing sessions:
- **Bingeability Score** — How likely the content is to drive multi-video sessions
- **Session Behavior Breakdown** — Profile drivers, engagement prompts, series references, external links
- **Session Killers** — CTAs or patterns that end viewing sessions
- **Series Recommendation** — Suggested series format based on content patterns

### 9. CTA Patterns

Call-to-action analysis:
- CTA styles found (soft, direct, embedded, none)
- Session impact assessment (extending, neutral, or killing)
- Templates for each CTA style

### 10. Cross-Niche Transferables

Universal principles extracted from the analyzed content that work regardless of niche — the structural patterns that transcend any specific topic.

### 11. Script Opening

A ready-to-use 30-50 word script opening tailored to your niche and goal, built from the strongest patterns found in the analysis.

### 12. Top Insight

The single most important finding from the entire analysis — the one thing that would make the biggest difference if implemented.

### 13. Deployment Playbook

A structured action plan for implementing the Formula Card findings:
- **Trial Reel Strategy** — How to test the patterns with trial reels
- **Story Sequence** — A 3-story trailer sequence for promoting content
- **Optimization Loop** — How to iterate based on retention data
- **Series Launch Plan** — How to build a signature series
- **PCR Tracking** — Profile Conversion Rate monitoring guidance
- **Posting Cadence** — Recommended content schedule

---

## The Theory Engine

The synthesis stage uses a comprehensive Instagram Growth Theory framework as its system prompt. This is not generic AI analysis — every pattern is evaluated against proven growth mechanics:

**Algorithm Mechanics:**
- Session time > individual watch time as the dominant ranking signal
- Multi-wave distribution over weeks (content can "resurrect" after seeming dead)
- Sweet spots: 11-30s (quick) and 60-120s (deep engagement)
- External link CTAs kill sessions and hurt distribution

**Hook Science:**
- Two-Step Test: every hook must deliver instant clarity AND a curiosity gap
- Brain Trigger Trifecta: visual + text + spoken triggers in the first 1-2 seconds
- Cold audiences need both clarity and gap to stop scrolling

**Retention Architecture:**
- Payoff Delay: hold the answer until the final second
- Rhetorical Interrupts: 30+ pattern breaks per 40-second video
- Structure: Hook > Setup > Secondary Hooks > Payoff

**Packaging > Hooks:**
- The framework/lens makes ideas interesting — videos fail from weak packaging more than weak hooks
- Frameworks: A vs B, Contrarian Gap, Curation, Steps, Payoff Delay

**Session Strategy:**
- Signature Series force binge sessions
- CTAs should drive to profile/series, not external links
- Profile is a library (Netflix mental model)

**Trust Recession (2026):**
- Audiences reject robotic, AI-generated, performative content
- Authenticity is the only durable advantage
- Silent consumption is the norm — vanity metrics are deceptive

The full theory reference is available in `docs/GROWTH_THEORY.md`.

---

## API Reference

### POST `/api/jobs` — Create Analysis Job

**Request Body:**

```json
{
  "urls": ["https://instagram.com/reel/..."],
  "handles": ["@username"],
  "niche": "video editing education",
  "goal": "Grow following",
  "depth": "quick"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `urls` | string[] | At least one of `urls` or `handles` | Max 30 URLs. Must match `instagram.com/reel/` or `instagram.com/p/` |
| `handles` | string[] | At least one of `urls` or `handles` | Max 3 handles |
| `niche` | string | Yes | Free-form niche description |
| `goal` | string | Yes | `"Grow following"`, `"Generate leads"`, or `"Build brand awareness"` |
| `depth` | string | Yes | `"quick"` (10 reels) or `"deep"` (25 reels) |

**Response (201):**

```json
{
  "jobId": "abc123",
  "duplicatesRemoved": 0
}
```

**Errors:**
- `400` — Validation error (missing fields, invalid URLs, etc.)
- `429` — Rate limited (10 jobs per IP per hour). Returns `retryAfterMs`.
- `503` — Kill switch active (`REELSIQ_KILL_SWITCH=1`)

---

### GET `/api/jobs/[jobId]/status` — Poll Job Progress

**Response (200):**

```json
{
  "status": "analyzing",
  "progress": {
    "stage": "analyzing",
    "completed": 5,
    "total": 10,
    "skipped": 1,
    "skipReasons": [
      { "url": "https://...", "reason": "Visual-only content (< 20 words)" }
    ]
  },
  "result": null,
  "error": null
}
```

Status values: `scraping` > `transcribing` > `analyzing` > `synthesizing` > `complete` | `error`

When `status` is `complete`, `result` contains:

```json
{
  "result": {
    "formulaCard": { ... },
    "individualAnalyses": [
      { "url": "https://...", "analysis": { ... }, "error": null }
    ]
  }
}
```

**Errors:**
- `404` — Job not found or expired (30-minute TTL)

---

### POST `/api/jobs/[jobId]/export` — Export Formula Card

**Query Parameters:**

| Param | Values | Description |
|-------|--------|-------------|
| `format` | `json` | Raw Formula Card JSON |
| `format` | `markdown` | Formatted Markdown with all sections |

**Response:** The exported content in the requested format.

---

## Testing Scripts

Four test scripts are available for validating individual pipeline stages:

```bash
# Test Instagram scraping via yt-dlp + GraphQL enrichment (3 default reels)
npm run test:scraper

# Test transcript extraction (scrape + transcribe a reel)
npm run test:transcribe

# Test per-reel analysis (scrape + transcribe + analyze)
npm run test:analyze [url1] [url2] ...

# Test full pipeline (scrape + transcribe + analyze + synthesize)
npm run test:synthesize [url1] [url2] ...
```

These scripts run outside the web app and output results directly to the console. They require yt-dlp + ffmpeg installed, Firefox with Instagram cookies, and the API keys in `.env`.

---

## Architecture

### File Structure

```
src/
├── app/
│   ├── api/jobs/
│   │   ├── route.ts                    # POST - create analysis job
│   │   └── [jobId]/
│   │       ├── status/route.ts         # GET - poll job progress
│   │       └── export/route.ts         # POST - export results
│   ├── analysis/[jobId]/page.tsx       # Results page with progress + Formula Card
│   ├── guide/page.tsx                  # Educational guide + glossary
│   ├── layout.tsx                      # Root layout (dark theme)
│   ├── page.tsx                        # Home page (input form)
│   └── globals.css                     # Tailwind + custom styles
├── components/
│   ├── InputForm.tsx                   # URL/handle input, niche/goal/depth config
│   ├── ProgressIndicator.tsx           # Pipeline stage progress display
│   ├── GuidedTour.tsx                  # Interactive Formula Card tour
│   ├── InfoTip.tsx                     # Glossary term tooltip
│   ├── ConfidenceBadge.tsx             # High/medium/low confidence badge
│   └── FormulaCard/
│       ├── FormulaCard.tsx             # Master container (renders 13 sections)
│       ├── AlgorithmAlignment.tsx      # Section 1: Algorithm alignment score
│       ├── HookDiagnostic.tsx          # Section 2: Hook analysis
│       ├── WinningHooks.tsx            # Section 3: Hook templates
│       ├── PackagingStrategy.tsx       # Section 4: Content frameworks
│       ├── RetentionArchitecture.tsx   # Section 5: Retention mechanics
│       ├── VocabularyProfile.tsx       # Section 6: Language patterns
│       ├── EmotionalJourney.tsx        # Section 7: Emotional arc
│       ├── SessionTimeStrategy.tsx     # Section 8: Session strategy
│       ├── CTAPatterns.tsx             # Section 9: CTA analysis
│       ├── CrossNicheTransferables.tsx # Section 10: Universal patterns
│       ├── ScriptOpening.tsx           # Section 11: Ready-to-use opener
│       ├── TopInsight.tsx              # Section 12: Key finding
│       └── DeploymentPlaybook.tsx      # Section 13: Action plan
├── lib/
│   ├── job-store.ts                    # In-memory job CRUD with TTL cleanup
│   ├── job-processor.ts               # Five-stage pipeline orchestrator
│   ├── validators.ts                   # Input validation (URLs, handles, niche, goal)
│   ├── rate-limit.ts                   # IP-based rate limiting + kill switch
│   ├── scraper/
│   │   ├── index.ts                   # Scraper dispatcher (yt-dlp default, Apify optional)
│   │   ├── types.ts                   # ScrapedReel interface shared by all backends
│   │   ├── ytdlp.ts                   # Free yt-dlp + GraphQL insights backend
│   │   └── apify.ts                   # Paid Apify backend (for production)
│   ├── transcribe.ts                   # Transcript quality gate + Groq Whisper
│   ├── analyze.ts                      # Per-reel Claude Haiku extraction
│   ├── synthesize.ts                   # Cross-reel Claude Sonnet synthesis
│   ├── theory-prompt.ts                # Instagram Growth Theory system prompt
│   ├── glossary.ts                     # Searchable glossary entries
│   └── parse-json.ts                   # Robust JSON parsing (fences, regex fallback)
├── types/
│   └── formula-card.ts                 # TypeScript interfaces for Formula Card
scripts/
├── test-scraper.ts                     # Test yt-dlp + GraphQL scraping
├── test-transcribe.ts                  # Test transcription pipeline
├── test-analyze.ts                     # Test per-reel analysis
└── test-synthesize.ts                  # Test full pipeline
docs/
├── BUILD_SPEC.md                       # Detailed technical specification
└── GROWTH_THEORY.md                    # Instagram growth theory reference
```

### Processing Pipeline Concurrency

| Stage | Concurrency | Service |
|-------|-------------|---------|
| Scraping | 3 concurrent | yt-dlp + Instagram GraphQL |
| Transcribing | 5 concurrent | Groq Whisper |
| Analyzing | 10 concurrent | Claude Haiku 4.5 |
| Synthesizing | 1 (single call) | Claude Sonnet 4.5 |

### Data Flow

```
User Input (URLs/handles + niche + goal + depth)
    │
    ▼
Job Store (in-memory, 30-min TTL)
    │
    ▼
Job Processor ─── Stage 1: yt-dlp + GraphQL ────────── ScrapedReel[]
    │                                                        │
    │              Stage 2: Groq Whisper ◄───────────────────┘
    │                  │                              TranscriptResult[]
    │                  │
    │              Stage 3: Claude Haiku ◄────────────────────┘
    │                  │                              ReelAnalysis[]
    │                  │
    │              Stage 4: Claude Sonnet ◄───────────────────┘
    │                  │                              FormulaCard
    │                  ▼
    └──────────── Complete ──► Results Page + Export
```

### State Management

- **Server:** Jobs are stored in an in-memory `Map` with a 30-minute TTL. A cleanup interval runs every 5 minutes to purge expired jobs. The store survives HMR in development.
- **Client:** SWR polls the status endpoint every 2 seconds until the job reaches `complete` or `error` status.

---

## Configuration

### next.config.mjs

```javascript
{
  experimental: {
    serverComponentsExternalPackages: ["apify-client"]
  }
}
```

The `apify-client` package is externalized from the Next.js server bundle for compatibility (only loaded when using the Apify backend).

### Rate Limiting

- **10 jobs per IP per hour** — enforced via an in-memory bucket per IP address
- **Kill switch** — set `REELSIQ_KILL_SWITCH=1` to return `503` on all new job submissions

### Validation Rules

| Field | Constraint |
|-------|-----------|
| URLs | Must match `instagram.com/reel/` or `instagram.com/p/` format |
| URLs | Maximum 30; duplicates auto-removed |
| Handles | 1-30 characters, alphanumeric + underscores + dots |
| Handles | Maximum 3 |
| Niche | Required, non-empty string |
| Goal | Must be one of the three predefined options |

---

## Cost Estimates

Approximate cost per analysis run (using yt-dlp default backend):

| Depth | Reels | Estimated Cost |
|-------|-------|---------------|
| Quick | ~10 | ~$0.08 |
| Deep | ~25 | ~$0.15 |
| Max | 30 | ~$0.17 |

Cost breakdown by service:
- **yt-dlp + GraphQL**: Free (default scraping backend)
- **Groq Whisper**: ~$0.04 per hour of audio (free tier available)
- **Claude Haiku 4.5**: Low cost per reel analysis
- **Claude Sonnet 4.5**: Single synthesis call per job
- **Apify** (optional production backend): ~$0.0026 per reel scraped

---

## Deployment Notes

- **yt-dlp and ffmpeg are required** on the server. Serverless platforms like Vercel Edge do not include them — use a serverful environment (e.g., Railway, Fly.io, or a VPS).
- **Firefox with Instagram cookies** is required on the scraping machine for the yt-dlp backend. For production, switch to `SCRAPER_BACKEND=apify` which handles authentication via managed account pools.
- **No database required** — jobs are stored in-memory. For production scale, swap the job store for Redis or a database.
- Environment variables must be available at runtime (not just build time).
- Keep yt-dlp updated (`yt-dlp -U`) as Instagram frequently changes their frontend.
