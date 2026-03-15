import { NextRequest, NextResponse } from "next/server";
import { validateJobInput, validateScriptInput } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { createJob } from "@/lib/job-store";
import { processJob } from "@/lib/job-processor";
import { processScriptJob } from "@/lib/script-processor";

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

  const jobType = body.jobType as string | undefined;

  // ---------------------------------------------------------------------------
  // Script Lab job
  // ---------------------------------------------------------------------------
  if (jobType === "scripts") {
    const validation = validateScriptInput({
      scripts: body.scripts as Array<{ title?: string; content?: string }> | undefined,
      niche: body.niche as string | undefined,
      goal: body.goal as string | undefined,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { errors: validation.errors },
        { status: 400 }
      );
    }

    const job = createJob({
      jobType: "scripts",
      scripts: validation.scripts,
      niche: (body.niche as string).trim(),
      goal: (body.goal as string).trim(),
      targetAudience: ((body.targetAudience as string) ?? "").trim(),
      tone: ((body.tone as string) ?? "").trim(),
      offerDescription: ((body.offerDescription as string) ?? "").trim(),
    });

    // Fire and forget
    processScriptJob(job).catch((err) => {
      console.error(`[script-job ${job.id}] Unhandled error:`, err);
      job.status = "error";
      job.errorMessage = `Unexpected error: ${(err as Error).message}`;
    });

    return NextResponse.json({ jobId: job.id }, { status: 201 });
  }

  // ---------------------------------------------------------------------------
  // Reels job (default)
  // ---------------------------------------------------------------------------
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
    jobType: "reels",
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
