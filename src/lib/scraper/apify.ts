// ---------------------------------------------------------------------------
// Apify backend — paid, for production use
// Activate with SCRAPER_BACKEND=apify + APIFY_API_TOKEN
// ---------------------------------------------------------------------------

import { ApifyClient } from "apify-client";
import type { ScrapedReel, ParsedInput } from "./types";

const ACTOR_ID = "apify/instagram-reel-scraper";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (url.endsWith("/")) url = url.slice(0, -1);
  return url;
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

function isHandle(input: string): boolean {
  return /^@?[\w.]+$/.test(input.trim());
}

export function parseInputs(raw: string[]): ParsedInput[] {
  return raw.map((s) => {
    const trimmed = s.trim();
    if (isUrl(trimmed)) {
      return { url: normalizeUrl(trimmed) };
    }
    if (isHandle(trimmed)) {
      return { handle: trimmed.replace(/^@/, "") };
    }
    return { url: trimmed };
  });
}

// ---------------------------------------------------------------------------
// Map raw Apify dataset item → ScrapedReel
// ---------------------------------------------------------------------------

function mapItem(item: Record<string, unknown>): ScrapedReel {
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

export async function scrapeReelsApify(
  inputs: string[]
): Promise<ScrapedReel[]> {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error(
      "APIFY_API_TOKEN is not set. Add it to your .env file, or switch to SCRAPER_BACKEND=ytdlp."
    );
  }

  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
  });

  const parsed = parseInputs(inputs);
  const username = parsed.map((p) => p.url ?? p.handle!);

  const actorInput: Record<string, unknown> = {
    username,
    includeTranscript: true,
  };

  console.log(
    `[apify] Starting actor run — ${username.length} input(s)`
  );

  const run = await client.actor(ACTOR_ID).call(actorInput, {
    waitSecs: 300,
  });

  console.log(`[apify] Run finished — status: ${run.status}`);

  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  console.log(`[apify] Retrieved ${items.length} item(s) from dataset`);

  return items.map((item) =>
    mapItem(item as Record<string, unknown>)
  );
}
