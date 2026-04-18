import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const deckId = req.nextUrl.searchParams.get("deckId");
    
    if (!deckId) {
      return NextResponse.json({ error: "deckId is required" }, { status: 400 });
    }

    const { data: cards, error } = await supabase
      .from("cards")
      .select("*")
      .eq("deck_id", deckId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cards: cards || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
