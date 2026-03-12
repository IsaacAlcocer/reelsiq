// ---------------------------------------------------------------------------
// Input validation — Section 8
// ---------------------------------------------------------------------------

const INSTAGRAM_REEL_RE =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[\w-]+\/?/i;

const HANDLE_RE = /^@?[\w.]{1,30}$/;

export interface ValidationResult {
  valid: boolean;
  /** Deduplicated, normalised URLs (if URL mode) */
  urls: string[];
  /** Normalised handles (if handle mode) */
  handles: string[];
  /** Human-readable error messages */
  errors: string[];
  /** Number of duplicates removed */
  duplicatesRemoved: number;
}

export function validateJobInput(input: {
  urls?: string[];
  handles?: string[];
  niche?: string;
  goal?: string;
  depth?: string;
}): ValidationResult {
  const errors: string[] = [];
  let urls: string[] = [];
  let handles: string[] = [];
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
    errors,
    duplicatesRemoved,
  };
}
