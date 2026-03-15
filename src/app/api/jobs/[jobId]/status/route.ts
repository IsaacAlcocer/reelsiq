import { NextRequest, NextResponse } from "next/server";
import { getJobOrSaved } from "@/lib/job-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJobOrSaved(jobId);

  if (!job) {
    return NextResponse.json(
      { error: "This analysis has expired. Please run a new analysis." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: job.status,
    jobType: job.jobType,
    progress: job.progress,
    result: job.result,
    ...(job.errorMessage ? { error: job.errorMessage } : {}),
  });
}
