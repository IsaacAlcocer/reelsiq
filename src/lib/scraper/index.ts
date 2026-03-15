// ---------------------------------------------------------------------------
// Scraper dispatcher — routes to the active backend
//
// Default: yt-dlp (free)
// Set SCRAPER_BACKEND=apify + APIFY_API_TOKEN for paid Apify backend
// ---------------------------------------------------------------------------

export type { ScrapedReel } from "./types";

export async function scrapeReels(inputs: string[]): Promise<import("./types").ScrapedReel[]> {
  const backend = process.env.SCRAPER_BACKEND || "ytdlp";

  if (backend === "apify") {
    const { scrapeReelsApify } = await import("./apify");
    return scrapeReelsApify(inputs);
  } else {
    const { scrapeReelsYtdlp } = await import("./ytdlp");
    return scrapeReelsYtdlp(inputs);
  }
}
