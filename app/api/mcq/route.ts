import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const deck_id = req.nextUrl.searchParams.get("deck_id");
    
    if (!deck_id || !isValidUUID(deck_id)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from(SUPABASE_TABLES.MCQS)
      .select("*")
      .eq("deck_id", deck_id);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/mcq/GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
