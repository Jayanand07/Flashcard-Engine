import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFlashcards, generateMCQs } from "@/lib/gemini";
import { getTodayString } from "@/lib/sm2";
export async function POST(req: NextRequest) {
  try {
    // Step 1 - Parse the incoming request
    const formData = await req.formData();
    const file = formData.get("pdf") as File | null;
    const name = formData.get("name") as string | null;

    if (!file || !name) {
      return NextResponse.json(
        { error: "Missing PDF file or deck name" },
        { status: 400 }
      );
    }

    // Step 2 - Extract text from PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Fix for Next.js App Router CommonJS module import behavior
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from PDF. Make sure it is not a scanned image PDF.",
        },
        { status: 400 }
      );
    }

    console.log("Extracted text preview:", extractedText.substring(0, 200));

    // Step 3 - Generate flashcards with Gemini
    let flashcards;
    try {
      flashcards = await generateFlashcards(extractedText);
      console.log(`Successfully generated ${flashcards.length} flashcards.`);
    } catch (aiError) {
      console.error("Gemini AI generation failed:", aiError);
      return NextResponse.json(
        { error: "AI failed to generate flashcards. Please try again." },
        { status: 500 }
      );
    }

    // Step 4 - Get User & Save deck to Supabase
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .insert({ name: name, card_count: flashcards.length, user_id: user.id })
      .select()
      .single();

    if (deckError) {
      throw new Error(`Failed to create deck: ${deckError.message}`);
    }

    if (!deck) {
      throw new Error("Deck creation returned no data");
    }

    // New Step: Generate MCQs
    let mcqs;
    try {
      mcqs = await generateMCQs(extractedText);
      console.log(`Successfully generated ${mcqs?.length || 0} MCQs.`);
    } catch (mcqError) {
      console.error("Gemini MCQ generation failed:", mcqError);
      // We don't fail the whole process if MCQs fail, but we'll try to insert them only if they exist
    }

    // Step 5 - Save all cards to Supabase
    const today = getTodayString();
    const cardsArray = flashcards.map(
      (card: { question: string; answer: string }) => ({
        deck_id: deck.id,
        question: card.question,
        answer: card.answer,
        difficulty: "new",
        next_review: today,
        interval: 1,
        ease_factor: 2.5,
        user_id: user.id,
      })
    );

    const { error: cardsError } = await supabase
      .from("cards")
      .insert(cardsArray);

    if (cardsError) {
      throw new Error(`Failed to insert cards: ${cardsError.message}`);
    }

    // Step 5.5 - Save all MCQs to Supabase
    if (mcqs && mcqs.length > 0) {
      const mcqsArray = mcqs.map(m => ({
        deck_id: deck.id,
        question: m.question,
        options: m.options,
        correct_index: m.correct_index,
        explanation: m.explanation,
        user_id: user.id
      }));
      const { error: mcqsError } = await supabase.from("mcqs").insert(mcqsArray);
      if (mcqsError) console.error("Failed to insert MCQs:", mcqsError.message);
    }

    // Step 6 - Return success
    return NextResponse.json({ deckId: deck.id }, { status: 201 });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
