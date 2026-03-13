// ---------------------------------------------------------------------------
// File-based job persistence — saves completed jobs as JSON to data/results/
// ---------------------------------------------------------------------------

import { promises as fs } from "fs";
import path from "path";
import type { Job } from "./job-store";

const RESULTS_DIR = path.join(process.cwd(), "data", "results");

// ---------------------------------------------------------------------------
// Saved result metadata (lightweight index entry)
// ---------------------------------------------------------------------------

export interface SavedResultMeta {
  id: string;
  filename: string;
  jobType: "reels" | "scripts";
  niche: string;
  goal: string;
  depth: "quick" | "deep";
  handles: string[];
  urlCount: number;
  scriptCount: number;
  createdAt: number;
  savedAt: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function buildFilename(job: Job): string {
  const date = new Date(job.createdAt).toISOString().slice(0, 10);
  const label =
    job.handles.length > 0
      ? sanitize(job.handles.join("_"))
      : job.jobType === "scripts"
        ? "scripts"
        : "urls";
  const niche = sanitize(job.niche);
  return `${job.jobType}_${label}_${niche}_${date}_${job.id}.json`;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(RESULTS_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Save a completed job to disk
// ---------------------------------------------------------------------------

export async function saveJobResult(job: Job): Promise<string> {
  await ensureDir();

  const filename = buildFilename(job);
  const filepath = path.join(RESULTS_DIR, filename);

  const payload = {
    _meta: {
      id: job.id,
      filename,
      jobType: job.jobType,
      niche: job.niche,
      goal: job.goal,
      depth: job.depth,
      handles: job.handles,
      urlCount: job.urls.length,
      scriptCount: job.scripts.length,
      createdAt: job.createdAt,
      savedAt: Date.now(),
    } satisfies SavedResultMeta,
    job: {
      id: job.id,
      createdAt: job.createdAt,
      jobType: job.jobType,
      urls: job.urls,
      handles: job.handles,
      scripts: job.scripts,
      niche: job.niche,
      goal: job.goal,
      depth: job.depth,
      status: job.status,
      progress: job.progress,
      result: job.result,
      errorMessage: job.errorMessage,
    },
  };

  await fs.writeFile(filepath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`[persistence] Saved result → ${filename}`);
  return filename;
}

// ---------------------------------------------------------------------------
// List all saved results (metadata only)
// ---------------------------------------------------------------------------

export async function listSavedResults(): Promise<SavedResultMeta[]> {
  await ensureDir();

  const files = await fs.readdir(RESULTS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  const metas: SavedResultMeta[] = [];

  for (const file of jsonFiles) {
    try {
      const raw = await fs.readFile(path.join(RESULTS_DIR, file), "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed._meta) {
        metas.push(parsed._meta);
      }
    } catch {
      // skip corrupted files
    }
  }

  // Sort newest first
  metas.sort((a, b) => b.createdAt - a.createdAt);
  return metas;
}

// ---------------------------------------------------------------------------
// Load a single saved result by ID
// ---------------------------------------------------------------------------

export async function loadSavedResult(
  id: string
): Promise<{ meta: SavedResultMeta; job: Job } | null> {
  await ensureDir();

  const files = await fs.readdir(RESULTS_DIR);
  const match = files.find((f) => f.includes(`_${id}.json`));

  if (!match) return null;

  try {
    const raw = await fs.readFile(path.join(RESULTS_DIR, match), "utf-8");
    const parsed = JSON.parse(raw);
    return { meta: parsed._meta, job: parsed.job as Job };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Delete a saved result by ID
// ---------------------------------------------------------------------------

export async function deleteSavedResult(id: string): Promise<boolean> {
  await ensureDir();

  const files = await fs.readdir(RESULTS_DIR);
  const match = files.find((f) => f.includes(`_${id}.json`));

  if (!match) return false;

  await fs.unlink(path.join(RESULTS_DIR, match));
  console.log(`[persistence] Deleted result → ${match}`);
  return true;
}
