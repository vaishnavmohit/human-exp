import { NextRequest, NextResponse } from "next/server";
import { upsertParticipant, getParticipant } from "@/lib/supabase-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      participant_id,
      email,
      enrollment_number,
      assigned_group,
      consent,
      share_data,
      n_per_category,
      metadata_json,
    } = body;

    // Validate required fields
    if (!participant_id || !assigned_group) {
      return NextResponse.json(
        { error: "Missing required fields: participant_id, assigned_group" },
        { status: 400 }
      );
    }

    // Validate group
    if (assigned_group < 1 || assigned_group > 6) {
      return NextResponse.json(
        { error: "Invalid group. Must be between 1 and 6" },
        { status: 400 }
      );
    }

    // Create or update participant
    const participant = await upsertParticipant({
      participant_id,
      email,
      enrollment_number,
      assigned_group,
      consent: consent ?? false,
      share_data: share_data ?? false,
      n_per_category: n_per_category ?? 10,
      metadata_json,
    });

    return NextResponse.json({ success: true, data: participant });
  } catch (error: any) {
    console.error("Error creating/updating participant:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create participant" },
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

    const participant = await getParticipant(participant_id);

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: participant });
  } catch (error: any) {
    console.error("Error fetching participant:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch participant" },
      { status: 500 }
    );
  }
}
