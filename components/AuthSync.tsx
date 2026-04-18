"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthSync() {
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) console.error("Anonymous auth failed:", error);
      }
    };
    
    // Small delay to let Supabase client initialize
    const timer = setTimeout(init, 100);
    return () => clearTimeout(timer);
  }, []);
  
  return null;
}
