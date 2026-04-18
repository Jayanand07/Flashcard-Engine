import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards, generateMCQs } from "@/lib/gemini";
import { getTodayString } from "@/lib/sm2";
import { SUPABASE_TABLES, MAX_REGENERATIONS } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const { deckId } = params;

    if (!deckId || !isValidUUID(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch deck and check regenerate count
    const { data: deck, error: deckError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .select("*")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (deck.regenerate_count >= MAX_REGENERATIONS) {
      return NextResponse.json(
        { error: `Maximum regenerations reached (${MAX_REGENERATIONS}/${MAX_REGENERATIONS})` }, 
        { status: 400 }
      );
    }

    // 2. Fetch current cards and save to history
    const { data: currentCards } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .select("*")
      .eq("deck_id", deckId);

    if (currentCards && currentCards.length > 0) {
      await supabase.from(SUPABASE_TABLES.DECK_HISTORY).insert({
        deck_id: deckId,
        generation_number: (deck.regenerate_count || 0) + 1,
        cards: currentCards
      });
    }

    // 3. Delete current cards and MCQs
    await Promise.all([
      supabase.from(SUPABASE_TABLES.CARDS).delete().eq("deck_id", deckId),
      supabase.from(SUPABASE_TABLES.MCQS).delete().eq("deck_id", deckId)
    ]);

    // 4. Generate NEW cards and MCQs
    const contentContext = `Topic: ${deck.name}\n\nContext based on previous cards:\n` + 
      (currentCards?.map((c: { question: string; answer: string }) => `Q: ${c.question}\nA: ${c.answer}`).join('\n') || deck.name);

    const [newFlashcards, newMCQs] = await Promise.all([
      generateFlashcards(`Generate 50 completely NEW and DIFFERENT flashcards about: ${deck.name}. These must be different from common knowledge — cover advanced concepts, edge cases, real examples.\n\nContext:\n${contentContext}`),
      generateMCQs(contentContext)
    ]);

    // 5. Save new cards
    const today = getTodayString();
    const cardsArray = newFlashcards.map((c: { question: string; answer: string }) => ({
      deck_id: deckId,
      question: c.question,
      answer: c.answer,
      difficulty: "new",
      next_review: today,
      interval: 1,
      ease_factor: 2.5,
      user_id: user.id
    }));
    await supabase.from(SUPABASE_TABLES.CARDS).insert(cardsArray);

    // 6. Save new MCQs
    if (newMCQs && newMCQs.length > 0) {
      const mcqsArray = newMCQs.map((m: { question: string; options: string[]; correct_index: number; explanation: string }) => ({
        deck_id: deckId,
        question: m.question,
        options: m.options,
        correct_index: m.correct_index,
        explanation: m.explanation,
        user_id: user.id
      }));
      await supabase.from(SUPABASE_TABLES.MCQS).insert(mcqsArray);
    }

    // 7. Update deck count and regenerate_count
    const newRegenCount = (deck.regenerate_count || 0) + 1;
    await supabase
      .from(SUPABASE_TABLES.DECKS)
      .update({ 
        regenerate_count: newRegenCount,
        card_count: newFlashcards.length 
      })
      .eq("id", deckId);

    return NextResponse.json({ success: true, regenerate_count: newRegenCount });
  } catch (error) {
    console.error("[api/regenerate/POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
