import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateSM2, getTodayString, Rating } from "@/lib/sm2";

export async function GET(req: NextRequest) {
  try {
    const deck_id = req.nextUrl.searchParams.get("deck_id");
    const due_only = req.nextUrl.searchParams.get("due_only");

    if (!deck_id) {
      return NextResponse.json(
        { error: "deck_id is required" },
        { status: 400 }
      );
    }
    
    const supabase = createClient();

    let query = supabase.from("cards").select("*").eq("deck_id", deck_id);

    if (due_only === "true") {
      const today = getTodayString();

      // Implement exactly: 
      // WHERE deck_id = [deckId] AND (next_review <= CURRENT_DATE OR difficulty = 'new')
      const { data: eligibleCards, error } = await supabase
        .from("cards")
        .select("*")
        .eq("deck_id", deck_id)
        .or(`next_review.lte.${today},difficulty.eq.new`);

      if (error) throw new Error(`Failed to fetch cards: ${error.message}`);

      let cards = eligibleCards || [];

      // Implement exact sorting logic:
      // Mastered cards never show unless everything else is done.
      // ORDER BY CASE WHEN next_review <= CURRENT_DATE THEN 0 ELSE 1 END, next_review ASC
      cards.sort((a, b) => {
        // 1. Mastered last
        const aMastered = a.difficulty === "mastered" ? 1 : 0;
        const bMastered = b.difficulty === "mastered" ? 1 : 0;
        if (aMastered !== bMastered) return aMastered - bMastered;

        // 2. CASE WHEN next_review <= CURRENT_DATE THEN 0 ELSE 1 END
        const aDue = a.next_review <= today ? 0 : 1;
        const bDue = b.next_review <= today ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;

        // 3. next_review ASC (older dates first)
        return a.next_review.localeCompare(b.next_review);
      });

      // LIMIT 50
      return NextResponse.json(cards.slice(0, 50), { status: 200 });
    }

    // Non-due: return all cards
    const { data: cards, error } = await supabase
      .from("cards")
      .select("*")
      .eq("deck_id", deck_id)
      .order("next_review", { ascending: true });

    if (error) throw new Error(`Failed to fetch cards: ${error.message}`);
    return NextResponse.json(cards, { status: 200 });
  } catch (error) {
    console.error("Cards GET API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      card_id,
      rating,
      current_interval,
      current_ease_factor,
      current_difficulty,
    } = body;

    // Validate existence of all fields safely (since interval/ease could be numbers)
    if (
      !card_id ||
      !rating ||
      current_interval === undefined ||
      current_ease_factor === undefined ||
      !current_difficulty
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Validate rating enum
    const validRatings = ["hard", "okay", "easy"];
    if (!validRatings.includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be "hard", "okay", or "easy"' },
        { status: 400 }
      );
    }

    // Calculate SM-2 result
    const sm2Result = calculateSM2(
      {
        interval: current_interval,
        ease_factor: current_ease_factor,
        difficulty: current_difficulty,
      },
      rating as Rating
    );

    // Update the card in Supabase
    const { data: updatedCard, error } = await supabase
      .from("cards")
      .update({
        interval: sm2Result.interval,
        ease_factor: sm2Result.ease_factor,
        difficulty: sm2Result.difficulty,
        next_review: sm2Result.next_review,
      })
      .eq("id", card_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update card: ${error.message}`);
    }

    return NextResponse.json(updatedCard, { status: 200 });
  } catch (error) {
    console.error("Cards PATCH API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
