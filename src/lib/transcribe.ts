import { execFile } from "child_process";
import { createWriteStream, createReadStream } from "fs";
import { unlink, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import Groq from "groq-sdk";
import type { ApifyReelResult } from "./apify";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TranscriptResult {
  /** Final transcript text (may come from Apify or Groq Whisper) */
  transcript: string | null;
  /** Word count of the final transcript */
  wordCount: number;
  /** Where the transcript came from */
  source: "apify" | "whisper" | "none";
  /** True if the reel was flagged as visual-only (<20 words after all attempts) */
  visualOnly: boolean;
}

// ---------------------------------------------------------------------------
// Groq client (lazy singleton)
// ---------------------------------------------------------------------------

let _groq: Groq | null = null;

function getGroq(): Groq {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set. Add it to your .env file.");
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Downloads a file from a URL to a local path.
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download video: ${res.status} ${res.statusText}`);
  }
  const body = res.body;
  if (!body) throw new Error("Response body is null");
  const nodeStream = Readable.fromWeb(body as import("stream/web").ReadableStream);
  await pipeline(nodeStream, createWriteStream(destPath));
}

/**
 * Extracts audio from a video file using ffmpeg.
 * Outputs mono 16kHz MP3 at 64kbps (optimal for Whisper, keeps file small).
 */
function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      "ffmpeg",
      [
        "-i", videoPath,
        "-vn",
        "-acodec", "libmp3lame",
        "-ar", "16000",
        "-ac", "1",
        "-b:a", "64k",
        audioPath,
      ],
      { timeout: 60_000 },
      (error, _stdout, stderr) => {
        if (error) {
          reject(new Error(`ffmpeg failed: ${error.message}\n${stderr}`));
        } else {
          resolve();
        }
      }
    );
  });
}

/**
 * Sends an audio file to Groq Whisper Large V3 Turbo for transcription.
 */
async function whisperTranscribe(audioPath: string): Promise<string> {
  const groq = getGroq();

  const transcription = await groq.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: "whisper-large-v3-turbo",
    response_format: "text",
  });

  // The response is a string when response_format is "text"
  return (typeof transcription === "string"
    ? transcription
    : (transcription as { text: string }).text
  ).trim();
}

// ---------------------------------------------------------------------------
// Main: Transcript quality gate
// ---------------------------------------------------------------------------

/**
 * Runs the transcript quality gate for a single reel:
 *
 * 1. If Apify transcript has >= 30 words -> pass through
 * 2. If missing/short -> download video, extract audio with ffmpeg, send to Groq Whisper
 * 3. If still < 20 words after Whisper -> flag as "visual-only"
 */
export async function ensureTranscript(
  reel: ApifyReelResult
): Promise<TranscriptResult> {
  // Gate 1: Apify transcript is sufficient
  if (reel.hasUsableTranscript && reel.transcript) {
    console.log(
      `[transcribe] Apify transcript OK for ${reel.url} (${reel.transcriptWordCount} words)`
    );
    return {
      transcript: reel.transcript,
      wordCount: reel.transcriptWordCount,
      source: "apify",
      visualOnly: false,
    };
  }

  // Gate 2: Need Whisper fallback
  if (!reel.videoUrl) {
    console.log(
      `[transcribe] No video URL for ${reel.url} — cannot transcribe`
    );
    return {
      transcript: reel.transcript,
      wordCount: reel.transcriptWordCount,
      source: "none",
      visualOnly: true,
    };
  }

  console.log(
    `[transcribe] Apify transcript insufficient for ${reel.url} (${reel.transcriptWordCount} words) — falling back to Whisper`
  );

  const tempDir = await mkdtemp(join(tmpdir(), "reelsiq-"));
  const videoPath = join(tempDir, "video.mp4");
  const audioPath = join(tempDir, "audio.mp3");

  try {
    // Download video
    console.log(`[transcribe] Downloading video...`);
    await downloadFile(reel.videoUrl, videoPath);

    // Extract audio with ffmpeg
    console.log(`[transcribe] Extracting audio with ffmpeg...`);
    await extractAudio(videoPath, audioPath);

    // Send to Groq Whisper
    console.log(`[transcribe] Sending to Groq Whisper...`);
    let whisperText: string;
    try {
      whisperText = await whisperTranscribe(audioPath);
    } catch (err) {
      // Retry once on failure (per spec Section 11)
      console.log(`[transcribe] Whisper failed, retrying once...`);
      whisperText = await whisperTranscribe(audioPath);
    }

    const wc = countWords(whisperText);
    console.log(`[transcribe] Whisper returned ${wc} words`);

    // Gate 3: If still < 20 words, flag as visual-only
    if (wc < 20) {
      console.log(
        `[transcribe] Flagging ${reel.url} as visual-only (${wc} words after Whisper)`
      );
      return {
        transcript: whisperText || null,
        wordCount: wc,
        source: "whisper",
        visualOnly: true,
      };
    }

    return {
      transcript: whisperText,
      wordCount: wc,
      source: "whisper",
      visualOnly: false,
    };
  } finally {
    // Clean up temp files
    await unlink(videoPath).catch(() => {});
    await unlink(audioPath).catch(() => {});
    // Remove temp dir (will fail silently if not empty, which is fine)
    await unlink(tempDir).catch(() => {});
  }
}

/**
 * Process multiple reels through the transcript quality gate.
 * Runs up to `concurrency` reels in parallel (default 5 per spec).
 */
export async function ensureTranscripts(
  reels: ApifyReelResult[],
  concurrency = 5
): Promise<TranscriptResult[]> {
  const results: TranscriptResult[] = new Array(reels.length);
  let idx = 0;

  async function worker() {
    while (idx < reels.length) {
      const i = idx++;
      results[i] = await ensureTranscript(reels[i]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, reels.length) },
    () => worker()
  );
  await Promise.all(workers);

  return results;
}
