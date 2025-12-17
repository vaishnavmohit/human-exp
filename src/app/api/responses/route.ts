import { NextRequest, NextResponse } from "next/server";
import { saveResponse } from "@/lib/supabase-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      participant_id,
      session_id,
      question_id,
      category,
      assigned_group,
      answer,
      is_correct,
      reaction_time,
      question_number,
      mouse_data_json,
    } = body;

    // Validate required fields
    if (!participant_id || !session_id || !question_id || !category || !answer || assigned_group === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: participant_id, session_id, question_id, category, answer, assigned_group" },
        { status: 400 }
      );
    }

    // Validate answer
    if (answer !== "positive" && answer !== "negative") {
      return NextResponse.json(
        { error: "Invalid answer. Must be 'positive' or 'negative'" },
        { status: 400 }
      );
    }

    // Save response to Supabase
    const response = await saveResponse({
      participant_id,
      session_id,
      question_id,
      category,
      assigned_group,
      answer,
      is_correct: is_correct ?? false,
      reaction_time: reaction_time ?? 0,
      question_number,
      mouse_data_json,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error("Error saving response:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save response" },
      { status: 500 }
    );
  }
}
