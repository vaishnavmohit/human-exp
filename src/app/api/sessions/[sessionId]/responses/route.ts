import { NextRequest, NextResponse } from "next/server";
import { getSessionResponses } from "@/lib/supabase-api";

/**
 * GET /api/sessions/[sessionId]/responses
 * Get all responses for a specific session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // `params` can be a Promise in Next.js route handlers; unwrap it first
    const p = await params as any;
    const { sessionId } = p;

    const responses = await getSessionResponses(sessionId);

    return NextResponse.json({ 
      success: true, 
      data: responses,
      count: responses?.length || 0
    });
  } catch (error: any) {
    console.error("Error fetching session responses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch responses" },
      { status: 500 }
    );
  }
}
