import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

    let query = supabase.from("cards").select("*").eq("deck_id", deck_id);

    // If due_only flag is specified, get cards due today OR overdue
    if (due_only === "true") {
      query = query.lte("next_review", getTodayString());
    }

    // Order by most overdue to least
    query = query.order("next_review", { ascending: true });

    const { data: cards, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch cards: ${error.message}`);
    }

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
