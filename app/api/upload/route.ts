import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards, generateMCQs } from "@/lib/gemini";
import { getTodayString } from "@/lib/sm2";
import { MAX_FILE_SIZE_BYTES, SUPABASE_TABLES } from "@/lib/constants";
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const nameInput = formData.get("name") as string | null;

    // 1. Validation
    if (!file || !nameInput) {
      return NextResponse.json({ error: "Missing PDF file or deck name" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size must be under 10MB" }, { status: 400 });
    }

    const name = nameInput.trim();
    if (name.length === 0) {
      return NextResponse.json({ error: "Deck name is required" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Deck name must be under 100 characters" }, { status: 400 });
    }

    // 2. Auth Check
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json({ 
        error: "Could not extract text from PDF. Make sure it is not a scanned image PDF." 
      }, { status: 400 });
    }

    // 4. AIStep - Generate flashcards
    const flashcards = await generateFlashcards(extractedText);
    
    // 5. Save Deck
    const { data: deck, error: deckError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .insert({ name: name, card_count: flashcards.length, user_id: user.id })
      .select()
      .single();

    if (deckError || !deck) {
      throw new Error(`Failed to create deck: ${deckError?.message || 'No data'}`);
    }

    // 6. AIStep - Generate MCQs (Optional step, don't fail entire process)
    let mcqs: { question: string; options: string[]; correct_index: number; explanation: string }[] = [];
    try {
      mcqs = await generateMCQs(extractedText);
    } catch (mcqError) {
      console.error("[upload/POST] MCQ generation failed:", mcqError);
    }

    // 7. Save Flashcards
    const today = getTodayString();
    const cardsArray = flashcards.map((card: { question: string; answer: string }) => ({
      deck_id: deck.id,
      question: card.question,
      answer: card.answer,
      difficulty: "new",
      next_review: today,
      interval: 1,
      ease_factor: 2.5,
      user_id: user.id,
    }));

    const { error: cardsError } = await supabase.from(SUPABASE_TABLES.CARDS).insert(cardsArray);
    if (cardsError) throw new Error(`Failed to insert cards: ${cardsError.message}`);

    // 8. Save MCQs
    if (mcqs.length > 0) {
      const mcqsToInsert = mcqs.map((m) => ({
        deck_id: deck.id,
        question: m.question,
        options: m.options,
        correct_index: m.correct_index,
        explanation: m.explanation,
        user_id: user.id
      }));
      await supabase.from(SUPABASE_TABLES.MCQS).insert(mcqsToInsert);
    }

    return NextResponse.json({ deckId: deck.id }, { status: 201 });
  } catch (error) {
    console.error("[api/upload/POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
