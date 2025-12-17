import { NextRequest, NextResponse } from "next/server";
import { upsertParticipant, getParticipant } from "@/lib/supabase-api";
import { loadConfig } from "@/lib/config";

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

    // Validate required fields (participant_id may be omitted; we will generate one)
    if (!assigned_group) {
      return NextResponse.json(
        { error: "Missing required field: assigned_group" },
        { status: 400 }
      );
    }

    // If participant_id was not provided, generate a safe one server-side.
    // Prefer a derivation from email/enrollment when available, otherwise fall
    // back to a timestamp-based id.
    let finalParticipantId = participant_id;
    if (!finalParticipantId) {
      if (email) {
        const local = String(email).split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "_");
        finalParticipantId = `${local}_${Date.now()}`;
      } else if (enrollment_number) {
        const local = String(enrollment_number).replace(/[^a-zA-Z0-9_-]/g, "_");
        finalParticipantId = `${local}_${Date.now()}`;
      } else {
        finalParticipantId = `participant_${Date.now()}`;
      }
    }

    // Load config and validate group against supported groups
    const config = await loadConfig();
    if (!config.supported_groups.includes(assigned_group)) {
      return NextResponse.json(
        { 
          error: `Invalid group ${assigned_group}. Supported groups: ${config.supported_groups.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create or update participant
    const participant = await upsertParticipant({
      participant_id: finalParticipantId,
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
