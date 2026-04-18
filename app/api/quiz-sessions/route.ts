import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("quiz_sessions")
      .select("*")
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Quiz Sessions GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deck_id, deck_name, score, total_questions, accuracy } = body;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("quiz_sessions")
      .insert({
        deck_id,
        deck_name,
        score,
        total_questions,
        accuracy,
        user_id: user.id,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Quiz Sessions POST Error:", error);
    return NextResponse.json({ error: "Failed to save quiz session" }, { status: 500 });
  }
}
