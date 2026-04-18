"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync() {
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }
    };
    initAuth();
  }, [supabase]);

  return null;
}
