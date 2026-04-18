import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards, generateMCQs } from "@/lib/gemini";
import { SUPABASE_TABLES } from "@/lib/constants";

export async function POST(
  req: Request,
  { params }: { params: { deckId: string } }
) {
  try {
    const { deckId } = params;
    const { type = "cards" } = await req.json().catch(() => ({})); 
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get the deck to find the context
    const { data: deck, error: deckError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .select("*")
      .eq("id", deckId)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (type === "cards") {
      // 2. Fetch some existing cards to get context for regeneration
      const { data: existingCards } = await supabase
        .from(SUPABASE_TABLES.CARDS)
        .select("question, answer")
        .eq("deck_id", deckId)
        .limit(10);

      // 3. Generate new flashcards
      const context = `Deck Name: ${deck.name}. Existing cards: ${JSON.stringify(existingCards)}`;
      const newFlashcards = await generateFlashcards(context);

      // 4. Save old cards to history if needed or just delete
      // (Currently existing logic deletes)
      await supabase
        .from(SUPABASE_TABLES.CARDS)
        .delete()
        .eq("deck_id", deckId);

      // 5. Insert new cards
      const cardsToInsert = newFlashcards.map((c: { question: string, answer: string }) => ({
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

      // Update card_count in deck
      await supabase
        .from(SUPABASE_TABLES.DECKS)
        .update({ card_count: newFlashcards.length })
        .eq("id", deckId);

      return NextResponse.json({ success: true, count: newFlashcards.length });
    } 
    
    if (type === "quiz") {
      // 2. Fetch existing MCQs for context
      const { data: existingMCQs } = await supabase
        .from(SUPABASE_TABLES.MCQS)
        .select("question, options, correct_index")
        .eq("deck_id", deckId)
        .limit(5);

      // 3. Generate new MCQs
      const context = `Deck Name: ${deck.name}. Existing MCQs: ${JSON.stringify(existingMCQs)}`;
      const newMCQs = await generateMCQs(context);

      // 4. Delete old MCQs
      await supabase
        .from(SUPABASE_TABLES.MCQS)
        .delete()
        .eq("deck_id", deckId);

      // 5. Insert new MCQs
      const mcqsToInsert = newMCQs.map((m: any) => ({
        deck_id: deckId,
        user_id: user.id,
        question: m.question,
        options: m.options,
        correct_index: m.correct_index,
        explanation: m.explanation
      }));

      const { error: mcqsError } = await supabase
        .from(SUPABASE_TABLES.MCQS)
        .insert(mcqsToInsert);

      if (mcqsError) throw mcqsError;

      return NextResponse.json({ success: true, count: newMCQs.length });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("[api/regenerate/POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
