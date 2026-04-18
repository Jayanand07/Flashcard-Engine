import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getTodayString } from "@/lib/sm2";

export async function POST(
  req: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const deckId = params.deckId;
    const today = getTodayString();

    const { error } = await supabase
      .from("cards")
      .update({
        difficulty: "new",
        next_review: today,
        interval: 1,
        ease_factor: 2.5,
      })
      .eq("deck_id", deckId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Regenerate API Error:", error);
    return NextResponse.json(
      { error: "Failed to reset cards" },
      { status: 500 }
    );
  }
}
