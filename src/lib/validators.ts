// ---------------------------------------------------------------------------
// Input validation — Section 8
// ---------------------------------------------------------------------------

import type { ScriptInput } from "@/types/script-audit";

const INSTAGRAM_REEL_RE =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[\w-]+\/?/i;

const HANDLE_RE = /^@?[\w.]{1,30}$/;

const MIN_SCRIPT_WORDS = 20;
const MAX_SCRIPTS = 10;

export interface ValidationResult {
  valid: boolean;
  /** Deduplicated, normalised URLs (if URL mode) */
  urls: string[];
  /** Normalised handles (if handle mode) */
  handles: string[];
  /** Validated scripts (if script mode) */
  scripts: ScriptInput[];
  /** Human-readable error messages */
  errors: string[];
  /** Number of duplicates removed */
  duplicatesRemoved: number;
}

// ---------------------------------------------------------------------------
// Reels job validation (URLs + handles)
// ---------------------------------------------------------------------------

export function validateJobInput(input: {
  urls?: string[];
  handles?: string[];
  niche?: string;
  goal?: string;
  depth?: string;
}): ValidationResult {
  const errors: string[] = [];
  const urls: string[] = [];
  const handles: string[] = [];
  let duplicatesRemoved = 0;

  const hasUrls = input.urls && input.urls.length > 0;
  const hasHandles = input.handles && input.handles.length > 0;

  if (!hasUrls && !hasHandles) {
    errors.push("Provide at least one Reel URL or Instagram handle.");
  }

  // --- URL validation & dedup ---
  if (hasUrls) {
    const seen = new Set<string>();
    for (const raw of input.urls!) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      if (!INSTAGRAM_REEL_RE.test(trimmed)) {
        errors.push(
          `Not a valid Instagram Reel URL: "${trimmed}". URL must match instagram.com/reel/ or instagram.com/p/.`
        );
        continue;
      }

      const normalised = trimmed.replace(/\/+$/, "").toLowerCase();
      if (seen.has(normalised)) {
        duplicatesRemoved++;
        continue;
      }
      seen.add(normalised);
      // Keep original casing for the actual URL sent to Apify
      urls.push(trimmed.replace(/\/+$/, ""));
    }

    if (urls.length > 30) {
      errors.push(`Maximum 30 URLs allowed. You provided ${urls.length}.`);
    }
  }

  // --- Handle validation ---
  if (hasHandles) {
    for (const raw of input.handles!) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      if (!HANDLE_RE.test(trimmed)) {
        errors.push(
          `Invalid Instagram handle: "${trimmed}". Use only letters, numbers, dots, and underscores.`
        );
        continue;
      }
      handles.push(trimmed.replace(/^@/, ""));
    }

    if (handles.length > 3) {
      errors.push(`Maximum 3 handles allowed. You provided ${handles.length}.`);
    }
  }

  // --- Required fields ---
  if (!input.niche || !input.niche.trim()) {
    errors.push("Niche is required.");
  }
  if (!input.goal || !input.goal.trim()) {
    errors.push("Goal is required.");
  }
  if (input.depth && input.depth !== "quick" && input.depth !== "deep") {
    errors.push('Depth must be "quick" or "deep".');
  }

  return {
    valid: errors.length === 0,
    urls,
    handles,
    scripts: [],
    errors,
    duplicatesRemoved,
  };
}

// ---------------------------------------------------------------------------
// Script job validation
// ---------------------------------------------------------------------------

export function validateScriptInput(input: {
  scripts?: Array<{ title?: string; content?: string }>;
  niche?: string;
  goal?: string;
}): ValidationResult {
  const errors: string[] = [];
  const scripts: ScriptInput[] = [];

  if (!input.scripts || input.scripts.length === 0) {
    errors.push("Provide at least one script.");
  } else {
    if (input.scripts.length > MAX_SCRIPTS) {
      errors.push(
        `Maximum ${MAX_SCRIPTS} scripts allowed. You provided ${input.scripts.length}.`
      );
    }

    for (let i = 0; i < input.scripts.length; i++) {
      const s = input.scripts[i];
      const content = (s.content ?? "").trim();
      const title = (s.title ?? "").trim() || `Script ${i + 1}`;

      if (!content) {
        errors.push(`Script "${title}" is empty.`);
        continue;
      }

      const wordCount = content.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_SCRIPT_WORDS) {
        errors.push(
          `Script "${title}" has only ${wordCount} words. Minimum ${MIN_SCRIPT_WORDS} words required for meaningful analysis.`
        );
        continue;
      }

      scripts.push({ title, content });
    }
  }

  if (!input.niche || !input.niche.trim()) {
    errors.push("Niche is required.");
  }
  if (!input.goal || !input.goal.trim()) {
    errors.push("Goal is required.");
  }

  return {
    valid: errors.length === 0,
    urls: [],
    handles: [],
    scripts,
    errors,
    duplicatesRemoved: 0,
  };
}
