import { NextResponse } from "next/server";
import { listSavedResults } from "@/lib/job-persistence";

export async function GET() {
  try {
    const results = await listSavedResults();
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to list results: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
