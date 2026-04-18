"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

interface NavbarProps { onUploadClick?: () => void; }

export default function Navbar({ onUploadClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMounted(true), []);

  return (
    <nav className="navbar-gradient-border sticky top-0 z-50 backdrop-blur-xl"
      style={{ backgroundColor: "color-mix(in srgb, var(--bg) 85%, transparent)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>FlashCard Engine</span>
          </Link>
          <Link href="/history"
            className="text-sm font-medium transition-colors"
            style={{ color: pathname === "/history" ? "var(--accent)" : "var(--text-secondary)" }}>
            History
          </Link>
        </div>

        {/* Right: toggle + upload */}
        <div className="flex items-center gap-2.5">
          {mounted && (
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
              style={{ color: "var(--text-secondary)" }}
              aria-label="Toggle theme">
              {theme === "dark" ? (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
          )}
          {onUploadClick && (
            <button onClick={onUploadClick}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--accent)" }}>
              Upload PDF
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
