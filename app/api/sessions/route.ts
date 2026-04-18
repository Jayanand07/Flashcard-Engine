import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Sessions GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deck_id, deck_name, cards_reviewed, easy_count, okay_count, hard_count, accuracy } = body;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        deck_id,
        deck_name,
        cards_reviewed,
        easy_count,
        okay_count,
        hard_count,
        accuracy,
        user_id: user.id,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("decks").update({ last_studied: new Date().toISOString() }).eq("id", deck_id);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Sessions POST API Error:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
