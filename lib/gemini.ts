import { GoogleGenerativeAI } from "@google/generative-ai";

// Server-side only — this file is only imported by API routes
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

const parseGeminiJSON = (text: string) => {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  
  if (start === -1 || end === -1) {
    throw new Error("No JSON array found in AI response");
  }
  
  let jsonStr = text.slice(start, end + 1);
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Attempt to fix escape characters and control characters
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, " ");
    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new Error("JSON parse failed even after sanitization");
    }
  }
};

const validateItems = (parsed: any, requiredFields: string[]): any[] => {
  if (!Array.isArray(parsed)) throw new Error("AI response is not a valid JSON array");
  
  return parsed.filter(item => {
    return requiredFields.every(field => field in item && item[field] !== null);
  });
};

export async function generateFlashcards(
  extractedText: string
): Promise<Array<{ question: string; answer: string }>> {
  const trimmedText = extractedText.substring(0, 30000);

  const prompt = `You are a world-class educator with 
20 years of experience creating study materials.

Analyze the following content deeply and generate 
exactly 20 flashcards that would help a student 
truly MASTER this material.

CRITICAL: Return ONLY raw JSON array.
No markdown, no backticks, no explanation.
Keep all answers under 80 words.
Never use double quotes inside text values.

MANDATORY card type distribution:
- 4 cards: Core concept definitions 
- 4 cards: Deep understanding (Why/How questions)
- 3 cards: Relationships and comparisons
- 3 cards: Real-world application with examples
- 2 cards: Edge cases and exceptions
- 2 cards: Cause and effect
- 1 card: Synthesis
- 1 card: Misconception busters

Return exactly 20 cards in this format:
[{"question": "...", "answer": "..."}]

Content:
${trimmedText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const parsed = parseGeminiJSON(text);
    const validated = validateItems(parsed, ["question", "answer"]);
    
    if (validated.length === 0) throw new Error("No valid flashcards generated");
    return validated;
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

Generate exactly 10 MCQ questions.

CRITICAL: Return ONLY raw JSON array.
No markdown, no backticks, no explanation.
Keep all explanations under 80 words.
Never use double quotes inside text values.

Rules:
- 4 options per question (A, B, C, D)
- Options must ALL be plausible (not obviously wrong)
- Exactly 1 correct answer per question
- Difficulty mix: 25% easy, 50% medium, 25% hard

Format:
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

    const parsed = parseGeminiJSON(text);
    const validated = validateItems(parsed, ["question", "options", "correct_index", "explanation"]);
    
    if (validated.length === 0) throw new Error("No valid MCQs generated");
    return validated;
  } catch (error) {
    throw new Error(
      "Failed to parse generated MCQs. Details: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

export async function explainFlashcard(question: string, answer: string): Promise<string> {
  const prompt = `You are an expert tutor. A student is looking at the following flashcard:
Question: ${question}
Answer: ${answer}

Provide a brief (2-4 sentences), encouraging, and deep explanation of WHY this is the answer. 
Break down any complex terms. Focus on deep understanding, not just memorization.
Write in a friendly, conversational tone.

Return ONLY the explanation text, no markdown.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Explanation failure:", error);
    return "I'm sorry, I couldn't generate an explanation for this card at the moment.";
  }
}
