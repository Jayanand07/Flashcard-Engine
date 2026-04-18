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
  ("What is X?", "Define Y")
- 10 cards: Deep understanding 
  ("Why does X happen?", "How does X work?")
- 8 cards: Relationships and comparisons 
  ("How does X differ from Y?", "What connects X and Y?")
- 8 cards: Real-world application 
  ("Give an example of X in practice")
- 7 cards: Edge cases and exceptions 
  ("What happens when X fails?", "When does Y not apply?")
- 7 cards: Cause and effect 
  ("What causes X?", "What are consequences of Y?")
- 5 cards: Synthesis questions 
  ("Explain how X, Y, and Z work together")
- 5 cards: Tricky misconception busters 
  ("Why do people wrongly think X?")

STRICT QUALITY RULES:
- Every question must be answerable WITHOUT the PDF
- Every answer must be self-contained (2-4 sentences)
- No two cards can test the same concept
- Questions must be specific, never vague
- Include actual numbers, names, examples from the content
- Write like a great teacher explaining to a smart student
- Vary sentence structure across all 50 questions

Return ONLY a valid JSON array with NO markdown:
[{"question": "...", "answer": "..."}]

Content to analyze:
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

export async function generateMCQs(
  topic: string
): Promise<Array<{ question: string; options: string[]; correct_index: number; explanation: string }>> {
  const prompt = `You are an expert teacher creating a quiz.
Generate exactly 20 multiple choice questions about: ${topic}

Rules:
- 4 options each (A, B, C, D)
- Exactly 1 correct answer
- Options must be plausible (not obviously wrong)
- Include a clear explanation for the correct answer
- Vary difficulty: 30% easy, 50% medium, 20% hard
- Cover different aspects of the topic

Return ONLY valid JSON array:
[{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "correct_index": number (0-3),
  "explanation": "string"
}]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

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
