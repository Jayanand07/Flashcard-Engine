import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    const prompt = `Explain this concept in simple terms: 
Question: ${question}
Answer: ${answer}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ explanation: text }, { status: 200 });
  } catch (error) {
    console.error("Explain API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation. Please try again." },
      { status: 500 }
    );
  }
}
