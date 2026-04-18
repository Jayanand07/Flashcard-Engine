import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards } from "@/lib/gemini";
import { SUPABASE_TABLES } from "@/lib/constants";

export async function POST(
  _req: Request,
  { params }: { params: { deckId: string } }
) {
  try {
    const { deckId } = params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get the deck to find the PDF name or content
    const { data: deck, error: deckError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .select("*")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // 2. Fetch some existing cards to get context for regeneration
    const { data: existingCards } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .select("question, answer")
      .eq("deck_id", deckId)
      .limit(10);

    // 3. Generate new flashcards
    const context = `Deck Name: ${deck.name}. Existing cards: ${JSON.stringify(existingCards)}`;
    const newCards = await generateFlashcards(context);

    // 4. Delete old cards
    await supabase
      .from(SUPABASE_TABLES.CARDS)
      .delete()
      .eq("deck_id", deckId);

    // 5. Insert new cards
    const cardsToInsert = newCards.map((c: { question: string, answer: string }) => ({
      deck_id: deckId,
      user_id: user.id,
      question: c.question,
      answer: c.answer,
      difficulty: 'new',
      interval: 1,
      ease_factor: 2.5,
      next_review: new Date().toISOString().split('T')[0]
    }));

    const { error: insertError } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .insert(cardsToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, count: newCards.length });
  } catch (err) {
    console.error("[api/regenerate/POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
