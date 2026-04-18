import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deck_id, deck_name, cards_reviewed, easy_count, okay_count, hard_count, accuracy } = body;

    if (!deck_id || !isValidUUID(deck_id)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SESSIONS)
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

    // Update last_studied for the deck
    await supabase
      .from(SUPABASE_TABLES.DECKS)
      .update({ last_studied: new Date().toISOString() })
      .eq("id", deck_id);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("[api/sessions/POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SESSIONS)
      .select("*")
      .order("completed_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/sessions/GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
