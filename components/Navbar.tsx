"use client";

import React from "react";
import { useTheme } from "next-themes";

interface NavbarProps {
  onUploadClick?: () => void;
}

export default function Navbar({ onUploadClick }: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ background: "color-mix(in srgb, var(--background) 80%, transparent)" }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⚡</span>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            FlashCard Engine
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-2)]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-4 w-4" style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="h-4 w-4" style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          )}

          {onUploadClick && (
            <button
              onClick={onUploadClick}
              className="btn-accent px-4 py-2 text-sm"
            >
              Upload PDF
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
