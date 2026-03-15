import { NextRequest, NextResponse } from "next/server";
import { loadSavedResult, deleteSavedResult } from "@/lib/job-persistence";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;

  try {
    const saved = await loadSavedResult(resultId);
    if (!saved) {
      return NextResponse.json(
        { error: "Result not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to load result: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await params;

  try {
    const deleted = await deleteSavedResult(resultId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Result not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to delete result: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
