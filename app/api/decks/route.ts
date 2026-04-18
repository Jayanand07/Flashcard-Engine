import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTodayString } from "@/lib/sm2";
import { SUPABASE_TABLES } from "@/lib/constants";
import { Deck } from "@/lib/types";

export async function GET() {
  try {
    const supabase = createClient();
    
    // Get session - if no session, still proceed (anonymous auth will handle it)
    const { data: { session } } = await supabase.auth.getSession();
    
    // If no session at all, return empty decks (ISSUE 1 fix)
    if (!session) {
      return NextResponse.json({ decks: [] });
    }

    // 1. Fetch decks
    const { data: decksData, error: decksError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .select("*")
      .order("created_at", { ascending: false });

    if (decksError) throw decksError;
    if (!decksData || decksData.length === 0) {
      return NextResponse.json({ decks: [] });
    }

    // 2. Fetch card counts per difficulty and due status
    const { data: cardsData, error: cardsError } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .select("deck_id, difficulty, next_review");

    if (cardsError) throw cardsError;

    const today = getTodayString();
    const statsMap: Record<string, { mastered: number; learning: number; newCards: number; due: number }> = {};
    
    if (cardsData) {
      cardsData.forEach(c => {
        if (!statsMap[c.deck_id]) {
          statsMap[c.deck_id] = { mastered: 0, learning: 0, newCards: 0, due: 0 };
        }
        if (c.difficulty === "mastered") statsMap[c.deck_id].mastered++;
        else if (c.difficulty === "learning") statsMap[c.deck_id].learning++;
        else statsMap[c.deck_id].newCards++;
        
        if (c.next_review <= today) statsMap[c.deck_id].due++;
      });
    }

    // 3. Assemble final deck objects
    const decks: Deck[] = decksData.map(d => ({
      ...d,
      stats: statsMap[d.id] ? {
        mastered: statsMap[d.id].mastered,
        learning: statsMap[d.id].learning,
        newCards: statsMap[d.id].newCards
      } : undefined,
      due_today: statsMap[d.id]?.due ?? 0
    }));

    return NextResponse.json({ decks });
  } catch (err) {
    console.error("[api/decks/GET]", err);
    return NextResponse.json({ decks: [] });
  }
}
