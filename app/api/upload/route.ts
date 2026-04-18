import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards, generateMCQs } from "@/lib/gemini";
import { getTodayString } from "@/lib/sm2";
import { MAX_FILE_SIZE_BYTES, SUPABASE_TABLES } from "@/lib/constants";
import pdfParse from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File size must be under 10MB" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Create the deck first
    const deckName = file.name.replace(".pdf", "");
    const { data: deck, error: deckError } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .insert({
        user_id: session.user.id,
        name: deckName,
        card_count: 0,
        last_studied: null
      })
      .select()
      .single();

    if (deckError) throw deckError;

    // 2. Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json({ error: "PDF contains too little text to process" }, { status: 400 });
    }

    // 3. Generate both Flashcards and MCQs in parallel
    const [flashcards, mcqs] = await Promise.all([
      generateFlashcards(extractedText),
      generateMCQs(extractedText)
    ]);

    // 4. Insert Flashcards
    const cardsToInsert = flashcards.map((c: { question: string, answer: string }) => ({
      deck_id: deck.id,
      question: c.question,
      answer: c.answer,
      difficulty: 'new',
      interval: 0,
      ease_factor: 2.5,
      next_review: getTodayString()
    }));

    const { error: cardsError } = await supabase
      .from(SUPABASE_TABLES.CARDS)
      .insert(cardsToInsert);

    if (cardsError) throw cardsError;

    // 5. Insert MCQs
    const mcqsToInsert = mcqs.map((m: { question: string, options: string[], correct_index: number, explanation: string }) => ({
      deck_id: deck.id,
      question: m.question,
      options: m.options,
      correct_index: m.correct_index,
      explanation: m.explanation
    }));

    const { error: mcqsError } = await supabase
      .from(SUPABASE_TABLES.MCQS)
      .insert(mcqsToInsert);

    if (mcqsError) throw mcqsError;

    // 6. Update deck card count
    await supabase
      .from(SUPABASE_TABLES.DECKS)
      .update({ card_count: flashcards.length })
      .eq("id", deck.id);

    return NextResponse.json({ success: true, deckId: deck.id });
  } catch (err) {
    console.error("[api/upload/POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
