# Instagram Scraping Limits & Safety Guide

This guide covers the free yt-dlp + GraphQL scraping backend. These limits are based on community experience with Instagram's anti-bot systems — Instagram does not publish official thresholds.

---

## Current Configuration

| Setting | Default | Env Var |
|---------|---------|---------|
| Concurrent yt-dlp calls | 3 | `YTDLP_CONCURRENCY` |
| Delay between yt-dlp requests | 1000ms | `YTDLP_DELAY_MS` |
| Delay between GraphQL calls | 500ms | Hardcoded |
| Cookie source | Firefox | `INSTAGRAM_COOKIES_BROWSER` |
| Effective throughput | ~20-25 reels/min | — |

---

## Safe Usage Limits

### Per-Job Timing

| Job Type | Reels | Scrape Time | Risk Level |
|----------|-------|-------------|------------|
| Quick analysis | 10 | ~15-20s | Very safe |
| Deep analysis | 25 | ~45-60s | Safe |
| Max (30 URLs) | 30 | ~60-90s | Safe |
| Handle + deep | list + 25 | ~90-120s | Safe |

### Daily Limits

| Level | Reels/Hour | Reels/Day | Quick Jobs/Day | Deep Jobs/Day |
|-------|-----------|-----------|----------------|---------------|
| **Very safe** | **~60** | **~300** | **~30** | **~12** |
| Moderate | ~150 | ~800 | ~80 | ~30 |
| Aggressive (ban risk) | 300+ | 1500+ | Don't | Don't |

### Maximum Very Safe Daily Session

**Stay within these numbers and you will not get flagged:**

- 10-12 deep jobs (25 reels each) = ~250-300 reels/day
- OR 25-30 quick jobs (10 reels each) = ~250-300 reels/day
- Spread across 2-3 sessions (morning, afternoon, evening)
- No more than 4-5 jobs per hour
- No more than 60 reels per hour
- Wait at least 10 seconds between starting jobs

---

## What Triggers Instagram Issues

### High Risk (avoid these)
- Sudden volume spikes — going from 0 to 100+ reels after days of inactivity
- Scraping the same profile repeatedly — hitting one creator 10+ times per hour
- Running jobs 24/7 with no breaks
- New account + high volume in the first week
- Using a VPN that switches IPs frequently

### Low Risk (normal behavior)
- 2-5 jobs spread across the day
- Different creators/URLs per job
- Consistent daily usage patterns
- Using a warmed-up account (1+ weeks old, has normal activity)

---

## Account Safety

### Recommended Setup
1. Create a **dedicated scraper Instagram account** (not your personal account)
2. Make it look real: profile picture, bio, follow ~50 accounts, post 2-3 things
3. Log into this account in **Firefox** (keep Chrome for personal browsing)
4. **Age the account for at least 1 week** before any scraping
5. Warm up gradually: 5 reels on day 1, 10 on day 2, 20 on day 3, then normal use

### If You Get Flagged
- **"Suspicious activity" / checkpoint**: Stop for 24-48 hours, then resume with lower volume
- **Temporary lock**: Wait 48-72 hours, verify via phone/email, then start very slowly (5-10 reels/day)
- **Account disabled**: Very rare for view-only scraping. Appeal through Instagram if it happens.
- These are almost always temporary — permanent bans from scraping alone are extremely rare

---

## Tuning for Speed vs Safety

```env
# Default (balanced)
YTDLP_CONCURRENCY=3
YTDLP_DELAY_MS=1000

# Conservative (heavy daily use, 300+ reels/day)
YTDLP_CONCURRENCY=2
YTDLP_DELAY_MS=2000

# Fast (light use, <100 reels/day)
YTDLP_CONCURRENCY=5
YTDLP_DELAY_MS=500
```

---

## Other Service Limits

| Service | Free Tier Limit | Notes |
|---------|----------------|-------|
| Groq Whisper | ~20 req/min, 14,400 req/day | 1 call per reel needing transcription |
| Claude Haiku | Depends on API plan | 10 concurrent per job |
| Claude Sonnet | Depends on API plan | 1 call per job |

---

## Maintenance

- **Update yt-dlp regularly**: `yt-dlp -U` — Instagram changes their frontend frequently and yt-dlp patches within days
- **Check yt-dlp version**: `yt-dlp --version`
- **If scraping starts failing**: Update yt-dlp first, then check if Instagram cookies are still valid (re-login in Firefox)

---

## Production Scale

When the app launches with pricing plans, switch to the Apify backend for production:

```env
SCRAPER_BACKEND=apify
APIFY_API_TOKEN=apify_api_...
```

Apify manages its own Instagram account pools, proxy rotation, and anti-ban infrastructure — no personal account risk, no rate limit concerns, reliable at any scale.
