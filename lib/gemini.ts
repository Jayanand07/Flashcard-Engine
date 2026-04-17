import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API client. This should only run on the server.
const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function generateFlashcards(
  extractedText: string
): Promise<Array<{ question: string; answer: string }>> {
  // Trim the text to max 15000 characters
  const trimmedText = extractedText.substring(0, 15000);

  const prompt = `You are an expert educator and curriculum designer. 
Analyze the following study material and create exactly 15 high-quality flashcards.

Requirements for questions:
- Test deep understanding, not surface memorization
- Use 'What', 'Why', 'How', 'Explain' style questions
- Each question should be clear and self-contained

Requirements for answers:
- Concise but complete (2-4 sentences maximum)
- Use simple language a student can understand
- Include the key fact or concept directly

CRITICAL: Return ONLY a valid JSON array. No markdown, no backticks, 
no explanation text. Just raw JSON.

Format:
[
  {"question": "your question here", "answer": "your answer here"},
  {"question": "your question here", "answer": "your answer here"}
]

Study material:
${trimmedText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean it by strictly isolating the JSON Array from the first '[' to the last ']'
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("No JSON array found in the AI response");
    }

    // Parse the JSON safely
    const flashcards = JSON.parse(match[0]);
    return flashcards;
  } catch (error) {
    throw new Error(
      "Failed to parse generated flashcards from AI response. Details: " +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
