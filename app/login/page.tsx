"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      router.push("/");
      router.refresh();
    } else {
      console.error(error);
      setLoading(false);
      alert("Failed to login as guest");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-grid-pattern" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-md animate-fade-up rounded-[32px] p-8 text-center sm:p-12 relative overflow-hidden" 
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
        
        {/* Floating gradient orb behind text */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 rounded-full blur-3xl opacity-30" style={{ background: "linear-gradient(135deg, #7c6af7, #a855f7)" }} />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text-primary)" }}>FlashCard Engine</h1>
          <p className="text-sm mb-10" style={{ color: "var(--text-secondary)" }}>Master any topic using spaced repetition.</p>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
              style={{ background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" style={{ borderColor: "var(--border)" }} /></div>
              <div className="relative flex justify-center text-xs"><span className="px-4" style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>OR</span></div>
            </div>

            <button 
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-all active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, var(--accent), #a855f7)", opacity: loading ? 0.7 : 1 }}
            >
              Play as Guest
            </button>
          </div>
          
          <p className="mt-8 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            By continuing, you agree to our Terms of Service and Privacy Policy. Guest data may be cleared when cookies are reset.
          </p>
        </div>
      </div>
    </div>
  );
}
