import { NextRequest, NextResponse } from "next/server";
import { createSession, getActiveSession, getIncompleteSession } from "@/lib/supabase-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      participant_id,
      assigned_group,
      total_questions,
      assignment_json,
      category_map,
    } = body;

    // Validate required fields
    if (!participant_id || !assigned_group || !total_questions || !assignment_json) {
      return NextResponse.json(
        { error: "Missing required fields: participant_id, assigned_group, total_questions, assignment_json" },
        { status: 400 }
      );
    }

    // If there's already an incomplete session for this participant, return it
    const existing = await getIncompleteSession(participant_id);
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    // Create new session (guard against race: if insert fails due to unique constraint,
    // fetch and return the existing incomplete session)
    try {
      const session = await createSession({
        participant_id,
        assigned_group,
        total_questions,
        assignment_json,
        category_map,
        current_index: 0,
        completed: false,
      });

      return NextResponse.json({ success: true, data: session });
    } catch (err: any) {
      const message = String(err?.message || err || "");
      if (message.toLowerCase().includes("unique constraint") || message.toLowerCase().includes("duplicate key")) {
        // Fetch the existing incomplete session and return it
        const existingAfterError = await getIncompleteSession(participant_id);
        if (existingAfterError) {
          return NextResponse.json({ success: true, data: existingAfterError });
        }
      }

      // Re-throw for upstream handler to log
      throw err;
    }
  } catch (error: any) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

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

    // Get active session
    const session = await getActiveSession(participant_id);

    if (!session) {
      return NextResponse.json(
        { error: "No active session found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
