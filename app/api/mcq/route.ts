import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const deck_id = searchParams.get("deck_id");
    
    if (!deck_id || !isValidUUID(deck_id)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from(SUPABASE_TABLES.MCQS)
      .select("*")
      .eq("deck_id", deck_id);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/mcq/GET]", err);
    return NextResponse.json([]);
  }
}
