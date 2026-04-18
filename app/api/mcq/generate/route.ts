import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateMCQs } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { deck_id } = await req.json();
    if (!deck_id) {
      return NextResponse.json({ error: "deck_id is required" }, { status: 400 });
    }

    // 1. Fetch deck info
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("name")
      .eq("id", deck_id)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // 2. Fetch existing flashcards
    const { data: cards, error: cardsError } = await supabase
      .from("cards")
      .select("question, answer")
      .eq("deck_id", deck_id);

    if (cardsError || !cards || cards.length === 0) {
      return NextResponse.json(
        { error: "No flashcards found for this deck to base the quiz on." },
        { status: 404 }
      );
    }

    // 3. Prepare context for MCQ generation
    const contentContext = `Topic: ${deck.name}\n\nContent:\n` + 
      cards.map((c) => `Q: ${c.question}\nA: ${c.answer}`).join("\n");

    // 4. Generate MCQs using Gemini
    const mcqs = await generateMCQs(contentContext);

    if (!mcqs || mcqs.length === 0) {
      throw new Error("AI returned empty MCQs array");
    }

    // 5. Insert MCQs into the database
    const mcqsArray = mcqs.map((m) => ({
      deck_id,
      question: m.question,
      options: m.options,
      correct_index: m.correct_index,
      explanation: m.explanation,
    }));

    const { error: insertError } = await supabase.from("mcqs").insert(mcqsArray);

    if (insertError) {
      throw new Error(`Failed to save generated MCQs: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, mcqs: mcqsArray }, { status: 201 });
  } catch (error) {
    console.error("MCQ Generate Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate MCQs" },
      { status: 500 }
    );
  }
}
