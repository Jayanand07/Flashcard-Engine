import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side only — this file is only imported by API routes
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function generateFlashcards(
  extractedText: string
): Promise<Array<{ question: string; answer: string }>> {
  const trimmedText = extractedText.substring(0, 30000);

  const prompt = `You are a world-class educator with 
20 years of experience creating study materials.

Analyze the following content deeply and generate 
exactly 50 flashcards that would help a student 
truly MASTER this material — not just memorize it.

MANDATORY card type distribution:
- 10 cards: Core concept definitions 
- 10 cards: Deep understanding (Why/How questions)
- 8 cards: Relationships and comparisons
- 8 cards: Real-world application with examples
- 7 cards: Edge cases and exceptions
- 7 cards: Cause and effect
- 5 cards: Synthesis (how X Y Z work together)
- 5 cards: Misconception busters

STRICT QUALITY RULES:
- Every question answerable WITHOUT the PDF
- Every answer self-contained (2-4 sentences max)
- No two cards test the same concept
- Questions must be specific, never vague
- Include actual examples from the content
- Write like a great teacher, not a bot
- Vary question types across all 50

Return ONLY valid JSON, no markdown, no backticks:
[{"question": "...", "answer": "..."}]

Content:
${trimmedText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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

export async function generateMCQs(
  content: string
): Promise<Array<{ question: string; options: string[]; correct_index: number; explanation: string }>> {
  const trimmedText = content.substring(0, 30000);
  const prompt = `You are an expert teacher creating 
a high-quality quiz about the following content.

Generate exactly 20 multiple choice questions.

Rules:
- 4 options per question (A, B, C, D)
- Options must ALL be plausible (not obviously wrong)
- Exactly 1 correct answer per question
- Difficulty mix: 25% easy, 50% medium, 25% hard
- Cover different aspects — no repeated concepts
- Explanation must be 2-3 sentences, teach the WHY
- Questions test understanding, not just memory

Return ONLY valid JSON array, no markdown:
[{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correct_index": 0,
  "explanation": "..."
}]

Content to analyze:
${trimmedText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in the AI response");

    return JSON.parse(match[0]);
  } catch (error) {
    throw new Error(
      "Failed to parse generated MCQs. Details: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
