import { NextRequest, NextResponse } from "next/server";
import { completeSession } from "@/lib/supabase-api";

/**
 * POST /api/sessions/[sessionId]/complete
 * Mark session as completed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // `params` can be a Promise in Next.js route handlers; unwrap it first
    const p = await params as any;
    const { sessionId } = p;

    const session = await completeSession(sessionId);

    return NextResponse.json({ 
      success: true, 
      data: session,
      message: "Session marked as complete"
    });
  } catch (error: any) {
    console.error("Error completing session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete session" },
      { status: 500 }
    );
  }
}
