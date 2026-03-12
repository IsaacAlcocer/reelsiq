import { NextRequest, NextResponse } from "next/server";
import { validateJobInput } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { createJob } from "@/lib/job-store";
import { processJob } from "@/lib/job-processor";

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    const isKillSwitch = process.env.REELSIQ_KILL_SWITCH === "1";
    return NextResponse.json(
      {
        error: isKillSwitch
          ? "Service temporarily unavailable."
          : "Rate limit exceeded. Try again later.",
        retryAfterMs: limit.retryAfterMs,
      },
      { status: 429 }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Validate
  const validation = validateJobInput({
    urls: body.urls as string[] | undefined,
    handles: body.handles as string[] | undefined,
    niche: body.niche as string | undefined,
    goal: body.goal as string | undefined,
    depth: body.depth as string | undefined,
  });

  if (!validation.valid) {
    return NextResponse.json(
      { errors: validation.errors },
      { status: 400 }
    );
  }

  // Create job
  const job = createJob({
    urls: validation.urls,
    handles: validation.handles,
    niche: (body.niche as string).trim(),
    goal: (body.goal as string).trim(),
    depth: (body.depth as "quick" | "deep") ?? "quick",
  });

  // Fire and forget — pipeline runs in the background
  processJob(job).catch((err) => {
    console.error(`[job ${job.id}] Unhandled error:`, err);
    job.status = "error";
    job.errorMessage = `Unexpected error: ${(err as Error).message}`;
  });

  return NextResponse.json(
    {
      jobId: job.id,
      ...(validation.duplicatesRemoved > 0
        ? { duplicatesRemoved: validation.duplicatesRemoved }
        : {}),
    },
    { status: 201 }
  );
}
