import { NextRequest, NextResponse } from "next/server";
import { createSession, getActiveSession } from "@/lib/supabase-api";

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

    // Create new session
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
