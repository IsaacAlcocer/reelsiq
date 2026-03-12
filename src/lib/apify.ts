import { ApifyClient } from "apify-client";

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const ACTOR_ID = "apify/instagram-reel-scraper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApifyReelInput {
  /** Instagram Reel URL (e.g. https://www.instagram.com/reel/xyz/) */
  url?: string;
  /** Instagram handle — the scraper will pull recent reels from this profile */
  handle?: string;
}

export interface ApifyReelResult {
  url: string;
  videoUrl: string | null;
  transcript: string | null;
  transcriptWordCount: number;
  viewCount: number | null;
  likeCount: number | null;
  shareCount: number | null;
  commentCount: number | null;
  caption: string | null;
  followerCount: number | null;
  postDate: string | null;
  durationSeconds: number | null;
  ownerUsername: string | null;
  hasUsableTranscript: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeUrl(input: string): string {
  let url = input.trim();
  // Strip trailing slash for consistency
  if (url.endsWith("/")) url = url.slice(0, -1);
  return url;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

function isHandle(input: string): boolean {
  return /^@?[\w.]+$/.test(input.trim());
}

/**
 * Classifies each raw input string as a URL or a handle and returns
 * structured ApifyReelInput objects.
 */
export function parseInputs(raw: string[]): ApifyReelInput[] {
  return raw.map((s) => {
    const trimmed = s.trim();
    if (isUrl(trimmed)) {
      return { url: normalizeUrl(trimmed) };
    }
    if (isHandle(trimmed)) {
      return { handle: trimmed.replace(/^@/, "") };
    }
    // Fallback: treat as URL (Apify will reject gracefully if invalid)
    return { url: trimmed };
  });
}

// ---------------------------------------------------------------------------
// Map raw Apify dataset item → our structured result
// ---------------------------------------------------------------------------

function mapItem(item: Record<string, unknown>): ApifyReelResult {
  // The Apify actor returns varying field names depending on version.
  // We normalise the most common ones here.
  const transcript =
    (item.transcript as string) ??
    (item.transcriptText as string) ??
    (item.caption_transcript as string) ??
    null;

  const wordCount = transcript
    ? transcript.split(/\s+/).filter(Boolean).length
    : 0;

  return {
    url:
      (item.url as string) ??
      (item.inputUrl as string) ??
      (item.shortCode
        ? `https://www.instagram.com/reel/${item.shortCode}`
        : "unknown"),
    videoUrl: (item.videoUrl as string) ?? (item.video_url as string) ?? null,
    transcript,
    transcriptWordCount: wordCount,
    viewCount:
      (item.videoViewCount as number) ??
      (item.viewCount as number) ??
      (item.video_view_count as number) ??
      null,
    likeCount:
      (item.likesCount as number) ??
      (item.likeCount as number) ??
      (item.like_count as number) ??
      null,
    shareCount: (item.shareCount as number) ?? (item.share_count as number) ?? null,
    commentCount:
      (item.commentsCount as number) ??
      (item.commentCount as number) ??
      (item.comment_count as number) ??
      null,
    caption: (item.caption as string) ?? null,
    followerCount:
      (item.ownerFollowerCount as number) ??
      (item.followerCount as number) ??
      null,
    postDate:
      (item.timestamp as string) ??
      (item.takenAtTimestamp
        ? new Date((item.takenAtTimestamp as number) * 1000).toISOString()
        : null),
    durationSeconds:
      (item.videoDuration as number) ??
      (item.duration as number) ??
      (item.video_duration as number) ??
      null,
    ownerUsername:
      (item.ownerUsername as string) ??
      (item.owner_username as string) ??
      null,
    hasUsableTranscript: wordCount >= 30,
  };
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Scrape Instagram Reels via Apify's `apify/instagram-reel-scraper` actor.
 *
 * Accepts an array of Reel URLs and/or Instagram handles.
 * Returns structured results including transcripts.
 */
export async function scrapeReels(
  inputs: string[]
): Promise<ApifyReelResult[]> {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error(
      "APIFY_API_TOKEN is not set. Add it to your .env file."
    );
  }

  const parsed = parseInputs(inputs);

  // The actor accepts a single `username` array field that can contain
  // usernames, profile URLs, or direct reel URLs.
  const username = parsed.map((p) => p.url ?? p.handle!);

  const actorInput: Record<string, unknown> = {
    username,
    includeTranscript: true,
  };

  console.log(
    `[apify] Starting actor run — ${username.length} input(s)`
  );

  const run = await client.actor(ACTOR_ID).call(actorInput, {
    waitSecs: 300, // wait up to 5 minutes for the run to finish
  });

  console.log(`[apify] Run finished — status: ${run.status}`);

  // Fetch all items from the default dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`[apify] Retrieved ${items.length} item(s) from dataset`);

  return items.map((item) =>
    mapItem(item as Record<string, unknown>)
  );
}
