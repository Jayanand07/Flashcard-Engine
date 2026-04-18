import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      deck_id, 
      deck_name, 
      cards_reviewed, 
      easy_count, 
      okay_count, 
      hard_count, 
      accuracy 
    } = await req.json();

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SESSIONS)
      .insert({
        user_id: session.user.id,
        deck_id,
        deck_name,
        cards_reviewed,
        easy_count,
        okay_count,
        hard_count,
        accuracy,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    // Update last_studied for the deck
    await supabase
      .from(SUPABASE_TABLES.DECKS)
      .update({ last_studied: new Date().toISOString() })
      .eq("id", deck_id);

    return NextResponse.json(data);
  } catch (err) {
      console.error("[api/sessions/POST]", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.SESSIONS)
      .select("*")
      .order("completed_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/sessions/GET]", err);
    return NextResponse.json([]);
  }
}
