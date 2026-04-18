import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const deckId = req.nextUrl.searchParams.get("deckId");
    
    if (!deckId || !isValidUUID(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: cards, error } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .select("*")
      .eq("deck_id", deckId);

    if (error) throw error;

    return NextResponse.json({ cards: cards || [] });
  } catch (error: unknown) {
    console.error("[api/cards/all/GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
