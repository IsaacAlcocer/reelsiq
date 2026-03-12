import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "This analysis has expired. Please run a new analysis." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    result: job.result,
    ...(job.errorMessage ? { error: job.errorMessage } : {}),
  });
}
