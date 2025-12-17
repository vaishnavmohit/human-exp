import { NextRequest, NextResponse } from "next/server";
import { updateSession, completeSession } from "@/lib/supabase-api";
import { RouteContext } from "./types";
/**
 * PATCH /api/sessions/[sessionId]
 * Update session progress
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // `params` can be a Promise in Next.js route handlers; unwrap it first
    const { sessionId } = await params;
    const body = await request.json();

    const session = await updateSession(sessionId, body);

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update session" },
      { status: 500 }
    );
  }
}
