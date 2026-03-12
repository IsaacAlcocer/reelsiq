// ---------------------------------------------------------------------------
// In-memory job store with 30-minute TTL — Section 8
// ---------------------------------------------------------------------------

import type { ApifyReelResult } from "./apify";
import type { ReelAnalysis } from "./analyze";
import type { FormulaCard } from "./synthesize";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStage =
  | "scraping"
  | "transcribing"
  | "analyzing"
  | "synthesizing"
  | "complete"
  | "error";

export interface SkipReason {
  url: string;
  reason: string;
}

export interface JobProgress {
  stage: JobStage;
  completed: number;
  total: number;
  skipped: number;
  skipReasons: SkipReason[];
}

export interface JobResult {
  formulaCard: FormulaCard;
  individualAnalyses: Array<{
    url: string;
    analysis: ReelAnalysis | null;
    error: string | null;
  }>;
}

export interface Job {
  id: string;
  createdAt: number;
  /** Validated & deduped URLs to process */
  urls: string[];
  /** Validated handles to process */
  handles: string[];
  niche: string;
  goal: string;
  depth: "quick" | "deep";
  status: JobStage;
  progress: JobProgress;
  result: JobResult | null;
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// Store — survives Next.js HMR in dev mode via globalThis
// ---------------------------------------------------------------------------

const TTL_MS = 30 * 60 * 1000; // 30 minutes

const globalKey = "__reelsiq_jobs" as const;

function getJobsMap(): Map<string, Job> {
  const g = globalThis as Record<string, unknown>;
  if (!g[globalKey]) {
    g[globalKey] = new Map<string, Job>();
  }
  return g[globalKey] as Map<string, Job>;
}

const jobs = getJobsMap();

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

export function createJob(params: {
  urls: string[];
  handles: string[];
  niche: string;
  goal: string;
  depth: "quick" | "deep";
}): Job {
  const id = generateId();
  const job: Job = {
    id,
    createdAt: Date.now(),
    urls: params.urls,
    handles: params.handles,
    niche: params.niche,
    goal: params.goal,
    depth: params.depth,
    status: "scraping",
    progress: {
      stage: "scraping",
      completed: 0,
      total: 0,
      skipped: 0,
      skipReasons: [],
    },
    result: null,
    errorMessage: null,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | null {
  const job = jobs.get(id);
  if (!job) return null;

  // Enforce TTL
  if (Date.now() - job.createdAt > TTL_MS) {
    jobs.delete(id);
    return null;
  }
  return job;
}

/** Periodic cleanup of expired entries (runs every 5 min) */
setInterval(() => {
  const now = Date.now();
  jobs.forEach((job, id) => {
    if (now - job.createdAt > TTL_MS) {
      jobs.delete(id);
    }
  });
}, 5 * 60 * 1000).unref();
