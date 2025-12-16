import { NextRequest, NextResponse } from "next/server";
import { getIncompleteSession } from "@/lib/supabase-api";

/**
 * GET /api/sessions/resume?participant_id=XXX
 * Check for incomplete session to resume
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participant_id = searchParams.get("participant_id");

    if (!participant_id) {
      return NextResponse.json(
        { error: "Missing participant_id" },
        { status: 400 }
      );
    }

    const session = await getIncompleteSession(participant_id);

    if (!session) {
      return NextResponse.json(
        { success: true, data: null, message: "No incomplete session found" },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error("Error checking for incomplete session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check session" },
      { status: 500 }
    );
  }
}
