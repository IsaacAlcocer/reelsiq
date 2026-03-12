import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";
import type { ScriptsJobResult } from "@/lib/job-store";
import type { ScriptAuditResult } from "@/types/script-audit";
import { refineScript } from "@/lib/refine-script";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "Job not found or expired." },
      { status: 404 }
    );
  }

  if (job.jobType !== "scripts" || job.status !== "complete" || !job.result) {
    return NextResponse.json(
      { error: "Refinement is only available for completed script jobs." },
      { status: 400 }
    );
  }

  let body: { scriptIndex?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const scriptIndex = body.scriptIndex;
  if (typeof scriptIndex !== "number" || scriptIndex < 0) {
    return NextResponse.json(
      { error: "scriptIndex is required and must be a non-negative number." },
      { status: 400 }
    );
  }

  if (scriptIndex >= job.scripts.length) {
    return NextResponse.json(
      { error: `scriptIndex ${scriptIndex} is out of range.` },
      { status: 400 }
    );
  }

  const result = job.result as ScriptsJobResult;

  // Return cached result if already refined
  if (result.refinedScripts[scriptIndex]) {
    return NextResponse.json({
      refined: result.refinedScripts[scriptIndex],
      cached: true,
    });
  }

  const auditResult = result.auditResult as ScriptAuditResult;
  const scorecard = auditResult.scorecards[scriptIndex];

  if (!scorecard) {
    return NextResponse.json(
      { error: `No scorecard found for script index ${scriptIndex}.` },
      { status: 400 }
    );
  }

  const originalScript = job.scripts[scriptIndex];

  try {
    const refineResult = await refineScript(
      originalScript.content,
      scorecard,
      job.niche,
      job.goal
    );

    if (!refineResult.refined) {
      return NextResponse.json(
        { error: refineResult.error ?? "Refinement failed." },
        { status: 500 }
      );
    }

    // Cache on the job
    result.refinedScripts[scriptIndex] = refineResult.refined;

    return NextResponse.json({
      refined: refineResult.refined,
      cached: false,
    });
  } catch (err) {
    console.error(`[refine] Error refining script ${scriptIndex}:`, err);
    return NextResponse.json(
      { error: `Refinement error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
