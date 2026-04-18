import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const deck_id = req.nextUrl.searchParams.get("deck_id");
    if (!deck_id) return NextResponse.json({ error: "deck_id is required" }, { status: 400 });

    const supabase = createClient();
    
    const { data, error } = await supabase.from("mcqs").select("*").eq("deck_id", deck_id);
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("MCQ GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch MCQs" }, { status: 500 });
  }
}
