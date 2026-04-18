import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GoogleGenerativeAI } = require("@google/generative-ai");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Context: A flashcard with 
      Question: "${question}"
      Answer: "${answer}"

      Task: Provide a concise (max 100 words), helpful, and plain-English explanation of this concept. 
      Why is this the answer? If it's a fact, give a bit of background. If it's a process, explain it briefly.
      Keep it encouraging and educational.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ explanation: text });
  } catch (error) {
    console.error("[api/explain/POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
