import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_TABLES } from "@/lib/constants";
import { isValidUUID } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: deck, error } = await supabase
      .from(SUPABASE_TABLES.DECKS)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ deck });
  } catch (error: unknown) {
    console.error("[api/decks/[id]/GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
