import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side only — this file is only imported by API routes
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function generateFlashcards(
  extractedText: string
): Promise<Array<{ question: string; answer: string }>> {
  const trimmedText = extractedText.substring(0, 30000);

  const prompt = `You are an expert teacher and educational content designer with 20 years of experience creating study material for students.

Your task is to generate the highest quality flashcards possible from the provided content. A lazy AI generates shallow definition cards. You generate cards that make students truly understand.

CARD TYPES TO INCLUDE (mix all of these):
- Conceptual: "What is X and why does it matter?"
- Definitional: "Define [term] in simple words"
- Relational: "How does X relate to Y?"
- Application: "Give a real-world example of X"
- Edge case: "What happens when X condition occurs?"
- Worked example: "Walk through how to solve X"
- Comparison: "What is the difference between X and Y?"
- Cause & effect: "What causes X? What are its effects?"
- Tricky: Questions that test deep understanding not surface recall

STRICT RULES:
- Generate exactly 50 flashcards
- Every question must be specific, never vague
- Every answer must be complete but concise (2-4 sentences max)
- Never generate duplicate concepts
- Never generate trivial or obvious cards
- Questions must make sense WITHOUT reading the PDF
- Answers must be self-contained and clear
- Vary question types — never 3 same types in a row
- If content has examples or worked problems — include them as cards
- If content has formulas — include them with explanation

Return ONLY a valid JSON array, no markdown, no backticks:
[{"question": "...", "answer": "..."}]

Content:
${trimmedText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Strictly isolate the JSON Array from the response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("No JSON array found in the AI response");
    }

    const flashcards = JSON.parse(match[0]);
    return flashcards;
  } catch (error) {
    throw new Error(
      "Failed to parse generated flashcards from AI response. Details: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
