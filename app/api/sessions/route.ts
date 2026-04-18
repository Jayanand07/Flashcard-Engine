import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
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
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Sessions POST API Error:", error);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
