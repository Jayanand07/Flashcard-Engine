"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTodayString } from "@/lib/sm2";
import Navbar from "@/components/Navbar";
import DeckCard from "@/components/DeckCard";
import UploadModal from "@/components/UploadModal";

interface Deck {
  id: string;
  name: string;
  card_count: number;
  created_at: string;
  stats?: { mastered: number; learning: number; newCards: number };
  dueToday?: number;
}

export default function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDecks = async () => {
    setLoading(true);
    const { data: decksData, error: decksError } = await supabase
      .from("decks").select("*").order("created_at", { ascending: false });

    if (decksError || !decksData) { setDecks([]); setLoading(false); return; }
    if (decksData.length === 0) { setDecks([]); setLoading(false); return; }

    const { data: cardsData } = await supabase.from("cards").select("deck_id, difficulty, next_review");
    const today = getTodayString();

    const statsMap: Record<string, { mastered: number; learning: number; newCards: number; due: number }> = {};
    if (cardsData) {
      cardsData.forEach((c) => {
        if (!statsMap[c.deck_id]) statsMap[c.deck_id] = { mastered: 0, learning: 0, newCards: 0, due: 0 };
        if (c.difficulty === "mastered") statsMap[c.deck_id].mastered++;
        else if (c.difficulty === "learning") statsMap[c.deck_id].learning++;
        else statsMap[c.deck_id].newCards++;
        if (c.next_review <= today) statsMap[c.deck_id].due++;
      });
    }

    setDecks(decksData.map((d) => ({
      ...d,
      stats: statsMap[d.id] ? { mastered: statsMap[d.id].mastered, learning: statsMap[d.id].learning, newCards: statsMap[d.id].newCards } : { mastered: 0, learning: 0, newCards: d.card_count },
      dueToday: statsMap[d.id]?.due ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchDecks(); }, []);

  const totalCards = decks.reduce((a, d) => a + d.card_count, 0);
  const totalMastered = decks.reduce((a, d) => a + (d.stats?.mastered ?? 0), 0);
  const totalDue = decks.reduce((a, d) => a + (d.dueToday ?? 0), 0);

  const filteredDecks = decks.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: "var(--background)" }}>
      <Navbar onUploadClick={() => setShowUploadModal(true)} />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        {/* ── Hero (empty state) ── */}
        {!loading && decks.length === 0 && (
          <section className="animate-fade-up py-20 text-center sm:py-28">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: "var(--text-primary)" }}>
              Turn any PDF into
              <br />
              <span className="text-gradient">a learning machine</span>
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base sm:text-lg" style={{ color: "var(--text-secondary)" }}>
              Upload study material. AI generates smart flashcards.
              Spaced repetition makes them stick.
            </p>
            <button onClick={() => setShowUploadModal(true)} className="btn-accent animate-pulse-glow mt-8 px-8 py-3.5 text-sm">
              Get started — upload a PDF
            </button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {["AI Generated", "SM-2 Algorithm", "Tracks Progress"].map((t) => (
                <span key={t} className="rounded-full px-3.5 py-1.5 text-xs font-semibold" style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {t}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Stats bar ── */}
        {!loading && decks.length > 0 && (
          <div className="animate-fade-up mt-6 flex gap-3 overflow-x-auto pb-2">
            {[
              { icon: "📚", label: "Decks", value: decks.length },
              { icon: "🃏", label: "Mastered", value: totalMastered },
              { icon: "⏰", label: "Due today", value: totalDue },
              { icon: "📝", label: "Total cards", value: totalCards },
            ].map((s) => (
              <div key={s.label} className="flex min-w-[120px] items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="text-lg">{s.icon}</span>
                <div>
                  <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search ── */}
        {(decks.length > 0 || searchQuery.length > 0) && (
          <div className="animate-fade-up mt-6 relative">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search decks..."
              className="w-full max-w-sm rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-secondary)" }}>✕</button>
            )}
          </div>
        )}

        {/* ── Section label ── */}
        {!loading && decks.length > 0 && (
          <h2 className="animate-fade-up animate-delay-100 mt-8 mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Your Decks
          </h2>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="skeleton-shimmer h-5 w-3/4 rounded mb-3" />
                <div className="skeleton-shimmer h-3 w-1/2 rounded mb-5" />
                <div className="skeleton-shimmer h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredDecks.length === 0 && searchQuery ? (
          <div className="mt-16 text-center animate-fade-in">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No results for &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {filteredDecks.map((deck, idx) => (
              <div key={deck.id} className={`animate-fade-up animate-delay-${Math.min((idx + 1) * 100, 500)}`}>
                <DeckCard deck={deck} onDeleted={fetchDecks} />
              </div>
            ))}
          </div>
        )}
      </main>

      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onSuccess={() => { setShowUploadModal(false); fetchDecks(); }} />
    </div>
  );
}
