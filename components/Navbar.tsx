"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { truncateEmail } from "@/lib/utils";
import { User } from "@supabase/supabase-js";

interface NavbarProps { onUploadClick?: () => void; }

const Navbar = ({ onUploadClick }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.refresh();
  }, [supabase.auth, router]);

  const handleSignIn = useCallback(() => {
    router.push('/login');
  }, [router]);

  const handleThemeToggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const isAnonymous = user?.is_anonymous || false;
  const userIdentifier = user?.email || "Guest";

  return (
    <nav className="navbar-gradient-border sticky top-0 z-50 backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
            <span className="text-xl sm:text-2xl">⚡</span>
            <span className="hidden text-sm font-bold tracking-tight sm:block" style={{ color: "var(--text-primary)" }}>{APP_NAME}</span>
            <span className="text-sm font-bold sm:hidden" style={{ color: "var(--text-primary)" }}>FE</span>
          </Link>
          <Link href="/history"
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
            style={{ color: pathname === "/history" ? "var(--accent)" : "var(--text-secondary)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
            <span className="hidden sm:inline">History</span>
          </Link>
        </div>

        {/* Right: toggle + user + upload */}
        <div className="flex items-center gap-2 sm:gap-3">
          {mounted && (
            <button onClick={handleThemeToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Toggle theme">
              {theme === "dark" ? (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          )}

          {mounted && user && (
            <div className="hidden items-center gap-3 border-l pl-3 sm:flex" style={{ borderColor: "var(--border)" }}>
              {isAnonymous ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-gray-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-500/20">
                    👤 Guest
                  </span>
                  <button onClick={handleSignIn} className="text-xs font-bold transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
                    Sign in
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm" style={{ backgroundColor: "#7c6af7" }}>
                    {userIdentifier[0].toUpperCase()}
                  </div>
                  <span className="hidden text-xs font-medium lg:block" style={{ color: "var(--text-secondary)" }}>
                    {truncateEmail(userIdentifier, 15)}
                  </span>
                  <button onClick={handleLogout} className="text-xs font-bold transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}

          {onUploadClick && (
            <button onClick={onUploadClick}
              className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-4 sm:text-sm"
              style={{ backgroundColor: "var(--accent)" }}>
              Upload
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
