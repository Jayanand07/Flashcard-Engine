import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMCQs } from "@/lib/gemini";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { deck_id } = await req.json();
    if (!deck_id || !isValidUUID(deck_id)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch deck info
    const { data: deck, error: deckError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .select("name")
      .eq("id", deck_id)
      .single();

    if (deckError || !deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // 2. Fetch existing flashcards
    const { data: cards, error: cardsError } = await supabase
      .from(SUPABASE_TABLES.CARDS)
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
      cards.map((c: { question: string; answer: string }) => `Q: ${c.question}\nA: ${c.answer}`).join("\n");

    // 4. Generate MCQs using Gemini
    const mcqs = await generateMCQs(contentContext);

    if (!mcqs || mcqs.length === 0) {
      throw new Error("AI returned no results");
    }

    // 5. Insert MCQs into the database
    const mcqsArray = mcqs.map((m: { question: string; options: string[]; correct_index: number; explanation: string }) => ({
      deck_id: deck_id,
      question: m.question,
      options: m.options,
      correct_index: m.correct_index,
      explanation: m.explanation,
      user_id: user.id,
    }));

    const { error: insertError } = await supabase.from(SUPABASE_TABLES.MCQS).insert(mcqsArray);

    if (insertError) {
      throw new Error(`Failed to save generated MCQs: ${insertError.message}`);
    }

    return NextResponse.json({ success: true, mcqs: mcqsArray }, { status: 201 });
  } catch (error) {
    console.error("[api/mcq/generate/POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
