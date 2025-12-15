

import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase-server";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { human_id, reaction_time } = await req.json();
    // Secure server-side Supabase client
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase.from("responses").insert({
       human_id: human_id,
       reaction_time: reaction_time,
    }).select();
    console.log(data);
    console.log(error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Server error in log-error route:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
