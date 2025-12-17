import { NextRequest, NextResponse } from "next/server";
import { completeSession } from "@/lib/supabase-api";
import { RouteContext } from "../types";


/**
 * POST /api/sessions/[sessionId]/complete
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { sessionId } = await params;

    const session = await completeSession(sessionId);

    return NextResponse.json({
      success: true,
      data: session,
      message: "Session marked as complete",
    });
  } catch (error: any) {
    console.error("Error completing session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete session" },
      { status: 500 }
    );
  }
}
