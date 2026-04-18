import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards, generateMCQs } from "@/lib/gemini";
import { getTodayString } from "@/lib/sm2";

export async function POST(
  req: NextRequest,
  { params }: { params: { deckId: string } }
) {
  try {
    const deckId = params.deckId;

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch deck and check regenerate count
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("*")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) throw new Error("Deck not found");
    if (deck.regenerate_count >= 10) {
      return NextResponse.json({ error: "Maximum regenerations reached (10/10)" }, { status: 400 });
    }

    // 2. Fetch current cards and save to history
    const { data: currentCards } = await supabase.from("cards").select("*").eq("deck_id", deckId);
    if (currentCards && currentCards.length > 0) {
      await supabase.from("deck_history").insert({
        deck_id: deckId,
        generation_number: (deck.regenerate_count || 0) + 1,
        cards: currentCards
      });
    }

    // 3. Delete current cards and MCQs
    await supabase.from("cards").delete().eq("deck_id", deckId);
    await supabase.from("mcqs").delete().eq("deck_id", deckId);

    // 4. Generate NEW cards and MCQs
    // Use deck name and previous flashcards as context for regeneration
    const contentContext = `Topic: ${deck.name}\n\nContext based on previous cards:\n` + 
      (currentCards?.map(c => `Q: ${c.question}\nA: ${c.answer}`).join('\n') || deck.name);

    const [newFlashcards, newMCQs] = await Promise.all([
      generateFlashcards(`Generate 50 completely NEW and DIFFERENT flashcards about: ${deck.name}. These must be different from common knowledge — cover advanced concepts, edge cases, real examples.\n\nContext:\n${contentContext}`),
      generateMCQs(contentContext)
    ]);

    // 5. Save new cards
    const today = getTodayString();
    const cardsArray = newFlashcards.map(c => ({
      deck_id: deckId,
      question: c.question,
      answer: c.answer,
      difficulty: "new",
      next_review: today,
      interval: 1,
      ease_factor: 2.5,
      user_id: user.id
    }));
    await supabase.from("cards").insert(cardsArray);

    // 6. Save new MCQs
    const mcqsArray = newMCQs.map(m => ({
      deck_id: deckId,
      question: m.question,
      options: m.options,
      correct_index: m.correct_index,
      explanation: m.explanation,
      user_id: user.id
    }));
    await supabase.from("mcqs").insert(mcqsArray);

    // 7. Update deck count and regenerate_count
    await supabase
      .from("decks")
      .update({ 
        regenerate_count: (deck.regenerate_count || 0) + 1,
        card_count: newFlashcards.length 
      })
      .eq("id", deckId);

    return NextResponse.json({ success: true, regenerate_count: (deck.regenerate_count || 0) + 1 });
  } catch (error) {
    console.error("Regenerate API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to regenerate deck" },
      { status: 500 }
    );
  }
}
