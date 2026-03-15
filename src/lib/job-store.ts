// ---------------------------------------------------------------------------
// In-memory job store with 30-minute TTL — Section 8
// ---------------------------------------------------------------------------

import type { ReelAnalysis } from "./analyze";
import type { FormulaCard } from "./synthesize";
import type { ScriptInput, ScriptAuditResult, RefinedScript } from "@/types/script-audit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStage =
  | "scraping"
  | "transcribing"
  | "analyzing"
  | "auditing"
  | "synthesizing"
  | "complete"
  | "error";

export type JobType = "reels" | "scripts";

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

export interface ReelsJobResult {
  formulaCard: FormulaCard;
  individualAnalyses: Array<{
    url: string;
    analysis: ReelAnalysis | null;
    error: string | null;
  }>;
}

export interface ScriptsJobResult {
  auditResult: ScriptAuditResult;
  individualAnalyses: Array<{
    title: string;
    analysis: ReelAnalysis | null;
    error: string | null;
  }>;
  /** Tier 2: refined scripts keyed by "{scriptIndex}_{humanizeMode}" */
  refinedScripts: Record<string, RefinedScript>;
}

export type JobResult = ReelsJobResult | ScriptsJobResult;

export interface Job {
  id: string;
  createdAt: number;
  jobType: JobType;
  /** Validated & deduped URLs to process (reels jobs) */
  urls: string[];
  /** Validated handles to process (reels jobs) */
  handles: string[];
  /** User-provided scripts (script jobs) */
  scripts: ScriptInput[];
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
  jobType?: JobType;
  urls?: string[];
  handles?: string[];
  scripts?: ScriptInput[];
  niche: string;
  goal: string;
  depth?: "quick" | "deep";
}): Job {
  const id = generateId();
  const jobType = params.jobType ?? "reels";
  const initialStage: JobStage = jobType === "scripts" ? "analyzing" : "scraping";
  const job: Job = {
    id,
    createdAt: Date.now(),
    jobType,
    urls: params.urls ?? [],
    handles: params.handles ?? [],
    scripts: params.scripts ?? [],
    niche: params.niche,
    goal: params.goal,
    depth: params.depth ?? "quick",
    status: initialStage,
    progress: {
      stage: initialStage,
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

/**
 * Async version that falls back to disk when the job is not in memory.
 * Use this in API routes where you want to serve saved results.
 */
export async function getJobOrSaved(id: string): Promise<Job | null> {
  // Check in-memory first
  const memJob = getJob(id);
  if (memJob) return memJob;

  // Fallback to disk
  const { loadSavedResult } = await import("./job-persistence");
  const saved = await loadSavedResult(id);
  return saved ? saved.job : null;
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
