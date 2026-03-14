// ---------------------------------------------------------------------------
// Shared types for all scraper backends
// ---------------------------------------------------------------------------

export interface ScrapedReel {
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

export interface ParsedInput {
  /** Instagram Reel URL (e.g. https://www.instagram.com/reel/xyz/) */
  url?: string;
  /** Instagram handle — the scraper will pull recent reels from this profile */
  handle?: string;
}
