import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSM2, getTodayString, Rating } from "@/lib/sm2";
import { SUPABASE_TABLES, MAX_CARDS_PER_SESSION } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deck_id = searchParams.get("deck_id");
    const due_only = searchParams.get("due_only");

    if (!deck_id || !isValidUUID(deck_id)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }
    
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json([]);
    }

    const today = getTodayString();

    if (due_only === "true") {
      const { data: eligibleCards, error } = await supabase
        .from(SUPABASE_TABLES.CARDS)
        .select("*")
        .eq("deck_id", deck_id)
        .or(`next_review.lte.${today},difficulty.eq.new`);

      if (error) throw error;

      const cards = eligibleCards || [];

      // Sorting logic: Mastered last, then due status, then date ASC
      cards.sort((a, b) => {
        const aMastered = a.difficulty === "mastered" ? 1 : 0;
        const bMastered = b.difficulty === "mastered" ? 1 : 0;
        if (aMastered !== bMastered) return aMastered - bMastered;

        const aDue = a.next_review <= today ? 0 : 1;
        const bDue = b.next_review <= today ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;

        return a.next_review.localeCompare(b.next_review);
      });

      return NextResponse.json(cards.slice(0, MAX_CARDS_PER_SESSION));
    }

    const { data: cards, error } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .select("*")
      .eq("deck_id", deck_id)
      .order("next_review", { ascending: true });

    if (error) throw error;
    return NextResponse.json(cards);
  } catch (err) {
    console.error("[api/cards/GET]", err);
    return NextResponse.json([]);
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { card_id, rating, current_interval, current_ease_factor, current_difficulty } = body;

    if (!card_id || !isValidUUID(card_id)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    if (!rating || !["hard", "okay", "easy"].includes(rating)) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sm2Result = calculateSM2(
      {
        interval: current_interval,
        ease_factor: current_ease_factor,
        difficulty: current_difficulty,
      },
      rating as Rating
    );

    const { data: updatedCard, error } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .update({
        interval: sm2Result.interval,
        ease_factor: sm2Result.ease_factor,
        difficulty: sm2Result.difficulty,
        next_review: sm2Result.next_review,
      })
      .eq("id", card_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(updatedCard);
  } catch (err) {
    console.error("[api/cards/PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
