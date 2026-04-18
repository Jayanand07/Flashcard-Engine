import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { explainFlashcard } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, answer } = await req.json();
    const explanation = await explainFlashcard(question, answer);
    
    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("[api/explain/POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
