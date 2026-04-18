import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deckId = searchParams.get("deckId");
    
    if (!deckId || !isValidUUID(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ cards: [] });
    }

    const { data: cards, error } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .select("*")
      .eq("deck_id", deckId);

    if (error) throw error;

    return NextResponse.json({ cards: cards || [] });
  } catch (err) {
    console.error("[api/cards/all/GET]", err);
    return NextResponse.json({ cards: [] });
  }
}
