// ---------------------------------------------------------------------------
// yt-dlp backend — free, for development and testing
// Default backend. Reads Instagram cookies from Firefox.
// ---------------------------------------------------------------------------

import { execFile, execFileSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { ScrapedReel } from "./types";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const YTDLP_BIN = process.env.YTDLP_PATH || "yt-dlp";
const CONCURRENCY = parseInt(process.env.YTDLP_CONCURRENCY || "3", 10);
const DELAY_MS = parseInt(process.env.YTDLP_DELAY_MS || "1000", 10);

function getCookieArgs(): string[] {
  if (process.env.INSTAGRAM_COOKIES_FILE) {
    return ["--cookies", process.env.INSTAGRAM_COOKIES_FILE];
  }
  const browser = process.env.INSTAGRAM_COOKIES_BROWSER || "firefox";
  return ["--cookies-from-browser", browser];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUrl(input: string): boolean {
  return /^https?:\/\//i.test(input.trim());
}

function isHandle(input: string): boolean {
  return /^@?[\w.]+$/.test(input.trim());
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  if (url.endsWith("/")) url = url.slice(0, -1);
  return url;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
}

// ---------------------------------------------------------------------------
// yt-dlp subprocess wrapper
// ---------------------------------------------------------------------------

function ytdlp(args: string[], timeoutMs = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_BIN,
      args,
      { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          const msg = stderr || error.message;
          if (msg.includes("Login required") || msg.includes("login")) {
            reject(
              new Error(
                `Instagram requires authentication. Make sure you're logged into Instagram in Firefox, then retry. Raw error: ${msg.slice(0, 200)}`
              )
            );
          } else {
            reject(new Error(`yt-dlp failed: ${msg.slice(0, 300)}`));
          }
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Map yt-dlp JSON → ScrapedReel
// ---------------------------------------------------------------------------

function mapYtdlpResult(
  data: Record<string, unknown>,
  inputUrl: string
): ScrapedReel {
  // Try to extract transcript from subtitles/automatic_captions
  let transcript: string | null = null;

  const autoSubs = data.automatic_captions as
    | Record<string, Array<{ url?: string; ext?: string; data?: string }>>
    | undefined;
  const subs = data.subtitles as
    | Record<string, Array<{ url?: string; ext?: string; data?: string }>>
    | undefined;

  // Check for embedded subtitle data (rare for Instagram)
  if (subs?.en?.[0]?.data) {
    transcript = stripSubtitleTags(subs.en[0].data);
  } else if (autoSubs?.en?.[0]?.data) {
    transcript = stripSubtitleTags(autoSubs.en[0].data);
  }

  const wordCount = transcript
    ? transcript.split(/\s+/).filter(Boolean).length
    : 0;

  // Post date: prefer unix timestamp (precise), fall back to upload_date (YYYYMMDD)
  let postDate: string | null = null;
  if (data.timestamp != null) {
    postDate = new Date((data.timestamp as number) * 1000).toISOString();
  } else {
    const uploadDate = data.upload_date as string | undefined;
    if (uploadDate && uploadDate.length === 8) {
      const y = uploadDate.slice(0, 4);
      const m = uploadDate.slice(4, 6);
      const d = uploadDate.slice(6, 8);
      postDate = new Date(`${y}-${m}-${d}`).toISOString();
    }
  }

  // Video URL: yt-dlp uses DASH for Instagram (separate video/audio streams).
  // Extract the best available URL from formats — prefer a format with audio
  // (for Whisper transcription), then fall back to any video format.
  const videoUrl = extractBestVideoUrl(data);

  return {
    url:
      (data.webpage_url as string) ??
      (data.original_url as string) ??
      inputUrl,
    videoUrl,
    transcript,
    transcriptWordCount: wordCount,
    viewCount: (data.view_count as number) ?? null,
    likeCount: (data.like_count as number) ?? null,
    shareCount: null, // yt-dlp does not provide share count
    commentCount: (data.comment_count as number) ?? null,
    caption: (data.description as string) ?? null,
    followerCount: null, // yt-dlp does not provide follower count
    postDate,
    durationSeconds:
      data.duration != null ? Math.round(data.duration as number) : null,
    ownerUsername:
      (data.channel as string) ??
      (data.uploader as string) ??
      (data.uploader_id as string) ??
      null,
    hasUsableTranscript: wordCount >= 30,
  };
}

interface YtdlpFormat {
  url?: string;
  format_id?: string;
  ext?: string;
  vcodec?: string;
  acodec?: string;
}

/**
 * Extract the best video/audio URL from yt-dlp's format list.
 * Instagram uses DASH (separate video/audio streams), so there's no
 * single URL with both. For transcription we primarily need audio,
 * but for the full pipeline we want video+audio.
 *
 * Priority:
 * 1. requested_formats — the audio stream (for Whisper transcription)
 * 2. formats — any format with audio
 * 3. Fall back to first available video format
 */
function extractBestVideoUrl(data: Record<string, unknown>): string | null {
  // Try requested_formats first — pick audio stream for transcription
  const requested = data.requested_formats as YtdlpFormat[] | undefined;
  if (requested) {
    // Find the audio-only format (has acodec, no vcodec)
    const audioFormat = requested.find(
      (f) => f.acodec && f.acodec !== "none" && (!f.vcodec || f.vcodec === "none")
    );
    if (audioFormat?.url) return audioFormat.url;

    // Fall back to any format with audio
    const anyAudio = requested.find(
      (f) => f.acodec && f.acodec !== "none" && f.url
    );
    if (anyAudio?.url) return anyAudio.url;

    // Fall back to first format with a URL
    const anyFormat = requested.find((f) => f.url);
    if (anyFormat?.url) return anyFormat.url;
  }

  // Try the formats array
  const formats = data.formats as YtdlpFormat[] | undefined;
  if (formats) {
    // Find format with audio
    const audioFormat = formats.find(
      (f) => f.acodec && f.acodec !== "none" && f.url
    );
    if (audioFormat?.url) return audioFormat.url;

    // Any format with URL
    const anyFormat = formats.find((f) => f.url);
    if (anyFormat?.url) return anyFormat.url;
  }

  // Top-level url (rare for Instagram DASH)
  return (data.url as string) ?? null;
}

function stripSubtitleTags(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "") // strip HTML/XML tags
    .replace(/\n+/g, " ") // collapse newlines
    .trim();
}

// ---------------------------------------------------------------------------
// Instagram GraphQL enrichment — fills in views, followers, play count
// ---------------------------------------------------------------------------

const GRAPHQL_DOC_ID = "8845758582119845"; // PostPage query
const IG_APP_ID = "936619743392459";

/**
 * Extract shortcode from an Instagram URL.
 * Handles /reel/CODE/, /p/CODE/, /reels/CODE/
 */
function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p|reels)\/([\w-]+)/i);
  return match ? match[1] : null;
}

/**
 * Read Firefox cookies for Instagram.
 * Returns { cookieString, csrfToken } or null if unavailable.
 */
function getFirefoxCookies(): { cookieString: string; csrfToken: string } | null {
  try {
    const profilesDir = join(
      homedir(),
      "AppData",
      "Roaming",
      "Mozilla",
      "Firefox",
      "Profiles"
    );

    if (!existsSync(profilesDir)) return null;

    // Find a profile with cookies.sqlite
    const profiles = readdirSync(profilesDir);
    let cookiesDb: string | null = null;

    for (const profile of profiles) {
      const dbPath = join(profilesDir, profile, "cookies.sqlite");
      if (existsSync(dbPath)) {
        cookiesDb = dbPath;
        break;
      }
    }

    if (!cookiesDb) return null;

    // Use sqlite3 via yt-dlp's Python (which must be installed)
    // Instead, we'll use a simpler approach: call a tiny Python script
    const result = execFileSync("python", [
      "-c",
      `
import sqlite3, json
db = sqlite3.connect("file:${cookiesDb.replace(/\\/g, "/")}?mode=ro", uri=True)
cookies = db.execute("SELECT name, value FROM moz_cookies WHERE host LIKE '%instagram.com'").fetchall()
db.close()
csrf = next((v for n,v in cookies if n == 'csrftoken'), '')
cookie_str = '; '.join(f'{n}={v}' for n,v in cookies)
print(json.dumps({"cookieString": cookie_str, "csrfToken": csrf}))
`.trim(),
    ], { timeout: 5000 }).toString().trim();

    return JSON.parse(result);
  } catch {
    return null;
  }
}

// Cache cookies for the duration of the scrape session
let _cachedCookies: { cookieString: string; csrfToken: string } | null | undefined;

function getCachedCookies() {
  if (_cachedCookies === undefined) {
    _cachedCookies = getFirefoxCookies();
    if (_cachedCookies) {
      console.log("[graphql] Firefox cookies loaded for insights enrichment");
    } else {
      console.warn("[graphql] Could not read Firefox cookies — insights (views, followers) will be unavailable");
    }
  }
  return _cachedCookies;
}

/**
 * Fetch reel insights from Instagram's GraphQL API.
 * Returns enrichment data or null if the query fails.
 */
async function fetchReelInsights(
  shortcode: string
): Promise<{
  viewCount: number | null;
  playCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
  followerCount: number | null;
  ownerUsername: string | null;
} | null> {
  const cookies = getCachedCookies();
  if (!cookies) return null;

  const variables = JSON.stringify({
    shortcode,
    fetch_tagged_user_count: null,
    hoisted_comment_id: null,
    hoisted_reply_id: null,
  });

  const body = new URLSearchParams({
    doc_id: GRAPHQL_DOC_ID,
    variables,
  }).toString();

  try {
    const res = await fetch("https://www.instagram.com/graphql/query/", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Cookie: cookies.cookieString,
        "X-CSRFToken": cookies.csrfToken,
        "X-IG-App-ID": IG_APP_ID,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const dataObj = data.data as Record<string, unknown> | undefined;
    if (!dataObj) return null;

    const media = (dataObj.xdt_shortcode_media ??
      dataObj.shortcode_media) as Record<string, unknown> | undefined;
    if (!media) return null;

    const owner = media.owner as Record<string, unknown> | undefined;
    const followedBy = owner?.edge_followed_by as
      | Record<string, unknown>
      | undefined;
    const likes = media.edge_media_preview_like as
      | Record<string, unknown>
      | undefined;
    const comments = media.edge_media_to_parent_comment as
      | Record<string, unknown>
      | undefined;

    return {
      viewCount: (media.video_view_count as number) ?? null,
      playCount: (media.video_play_count as number) ?? null,
      likeCount: (likes?.count as number) ?? null,
      commentCount: (comments?.count as number) ?? null,
      followerCount: (followedBy?.count as number) ?? null,
      ownerUsername: (owner?.username as string) ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Enrich a ScrapedReel with GraphQL insights data.
 * Fills in missing fields without overwriting existing non-null values.
 */
async function enrichWithInsights(reel: ScrapedReel): Promise<ScrapedReel> {
  const shortcode = extractShortcode(reel.url);
  if (!shortcode) return reel;

  const insights = await fetchReelInsights(shortcode);
  if (!insights) return reel;

  return {
    ...reel,
    viewCount: reel.viewCount ?? insights.viewCount,
    likeCount: reel.likeCount ?? insights.likeCount,
    commentCount: reel.commentCount ?? insights.commentCount,
    followerCount: reel.followerCount ?? insights.followerCount,
    ownerUsername: insights.ownerUsername ?? reel.ownerUsername,
  };
}

// ---------------------------------------------------------------------------
// Scrape a single reel
// ---------------------------------------------------------------------------

async function scrapeReel(url: string): Promise<ScrapedReel | null> {
  const args = [
    "--dump-json",
    "--no-warnings",
    ...getCookieArgs(),
    url,
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stdout = await ytdlp(args);
      const data = JSON.parse(stdout) as Record<string, unknown>;
      return mapYtdlpResult(data, url);
    } catch (err) {
      const msg = (err as Error).message;
      // Don't retry auth errors
      if (msg.includes("authentication") || msg.includes("Login required")) {
        console.error(`[yt-dlp] Auth error for ${url}: ${msg}`);
        return null;
      }
      if (attempt === 0) {
        console.warn(`[yt-dlp] Attempt 1 failed for ${url}, retrying in 2s...`);
        await sleep(2000);
      } else {
        console.error(`[yt-dlp] Failed after 2 attempts: ${url} — ${msg}`);
        return null;
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Scrape a profile's reels (handle input)
// ---------------------------------------------------------------------------

async function scrapeProfile(handle: string): Promise<string[]> {
  const profileUrl = `https://www.instagram.com/${handle}/reels/`;
  const args = [
    "--flat-playlist",
    "--dump-json",
    "--no-warnings",
    ...getCookieArgs(),
    profileUrl,
  ];

  console.log(`[yt-dlp] Listing reels for @${handle}...`);

  try {
    const stdout = await ytdlp(args, 120_000); // 2 min timeout for profiles
    const urls: string[] = [];

    // yt-dlp outputs one JSON object per line in flat-playlist mode
    for (const line of stdout.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed) as Record<string, unknown>;
        const entryUrl =
          (entry.webpage_url as string) ??
          (entry.url as string) ??
          (entry.original_url as string);
        if (entryUrl) urls.push(entryUrl);
      } catch {
        // skip unparseable lines
      }
    }

    console.log(`[yt-dlp] Found ${urls.length} reel(s) for @${handle}`);
    return urls;
  } catch (err) {
    console.error(
      `[yt-dlp] Failed to list reels for @${handle}: ${(err as Error).message}`
    );
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function scrapeReelsYtdlp(
  inputs: string[]
): Promise<ScrapedReel[]> {
  // Classify inputs as URLs or handles
  const reelUrls: string[] = [];
  const handles: string[] = [];

  for (const input of inputs) {
    const trimmed = input.trim();
    if (isUrl(trimmed)) {
      reelUrls.push(normalizeUrl(trimmed));
    } else if (isHandle(trimmed)) {
      handles.push(trimmed.replace(/^@/, ""));
    } else {
      reelUrls.push(trimmed); // fallback: treat as URL
    }
  }

  // Scrape profiles to get reel URLs
  for (const handle of handles) {
    const profileReels = await scrapeProfile(handle);
    reelUrls.push(...profileReels);
    if (handles.indexOf(handle) < handles.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(reelUrls));

  console.log(
    `[yt-dlp] Scraping ${uniqueUrls.length} reel(s) (concurrency: ${CONCURRENCY}, delay: ${DELAY_MS}ms)`
  );

  // Scrape individual reels with concurrency control and delays
  const results: (ScrapedReel | null)[] = new Array(uniqueUrls.length);
  let lastRequestTime = 0;

  await runWithConcurrency(uniqueUrls, CONCURRENCY, async (url, i) => {
    // Enforce delay between requests
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < DELAY_MS) {
      await sleep(DELAY_MS - elapsed);
    }
    lastRequestTime = Date.now();

    results[i] = await scrapeReel(url);

    if (results[i]) {
      console.log(
        `[yt-dlp] [${i + 1}/${uniqueUrls.length}] OK: @${results[i]!.ownerUsername ?? "unknown"} — ${results[i]!.viewCount?.toLocaleString() ?? "?"} views`
      );
    }
  });

  const scraped = results.filter((r): r is ScrapedReel => r !== null);
  console.log(
    `[yt-dlp] Scraped ${scraped.length} of ${uniqueUrls.length} reel(s) successfully`
  );

  // Enrich with Instagram GraphQL insights (views, followers, etc.)
  console.log(`[graphql] Enriching ${scraped.length} reel(s) with insights...`);
  const enriched: ScrapedReel[] = [];

  for (let i = 0; i < scraped.length; i++) {
    const reel = await enrichWithInsights(scraped[i]);
    enriched.push(reel);

    if (reel.viewCount != null) {
      console.log(
        `[graphql] [${i + 1}/${scraped.length}] @${reel.ownerUsername} — ${reel.viewCount.toLocaleString()} views, ${reel.followerCount?.toLocaleString() ?? "?"} followers`
      );
    } else {
      console.log(
        `[graphql] [${i + 1}/${scraped.length}] @${reel.ownerUsername ?? "unknown"} — insights unavailable`
      );
    }

    // Small delay between GraphQL requests
    if (i < scraped.length - 1) {
      await sleep(500);
    }
  }

  return enriched;
}
