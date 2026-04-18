"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getTodayString } from "@/lib/sm2";
import Navbar from "@/components/Navbar";
import DeckCard from "@/components/DeckCard";
import UploadModal from "@/components/UploadModal";

interface Deck {
  id: string; name: string; card_count: number; created_at: string;
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
    const { data: decksData } = await supabase.from("decks").select("*").order("created_at", { ascending: false });
    if (!decksData || decksData.length === 0) { setDecks([]); setLoading(false); return; }

    const { data: cardsData } = await supabase.from("cards").select("deck_id, difficulty, next_review");
    const today = getTodayString();
    const sm: Record<string, { mastered: number; learning: number; newCards: number; due: number }> = {};
    if (cardsData) {
      cardsData.forEach(c => {
        if (!sm[c.deck_id]) sm[c.deck_id] = { mastered: 0, learning: 0, newCards: 0, due: 0 };
        if (c.difficulty === "mastered") sm[c.deck_id].mastered++;
        else if (c.difficulty === "learning") sm[c.deck_id].learning++;
        else sm[c.deck_id].newCards++;
        if (c.next_review <= today) sm[c.deck_id].due++;
      });
    }
    setDecks(decksData.map(d => ({
      ...d,
      stats: sm[d.id] ? { mastered: sm[d.id].mastered, learning: sm[d.id].learning, newCards: sm[d.id].newCards } : undefined,
      dueToday: sm[d.id]?.due ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchDecks(); }, []);

  const totalCards = decks.reduce((a, d) => a + d.card_count, 0);
  const totalMastered = decks.reduce((a, d) => a + (d.stats?.mastered ?? 0), 0);
  const totalDue = decks.reduce((a, d) => a + (d.dueToday ?? 0), 0);
  const filtered = decks.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const statCards = [
    { label: "Decks", value: decks.length, color: "#8b5cf6" },
    { label: "Mastered", value: totalMastered, color: "#22c55e" },
    { label: "Due Today", value: totalDue, color: "#f59e0b" },
    { label: "Total Cards", value: totalCards, color: "#3b82f6" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar onUploadClick={() => setShowUploadModal(true)} />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">

        {/* ── Hero empty state ── */}
        {!loading && decks.length === 0 && (
          <section className="animate-fade-up py-24 text-center sm:py-32">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl" style={{ color: "var(--text)" }}>
              Turn any PDF into<br /><span className="text-gradient">a learning machine</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base sm:text-lg" style={{ color: "var(--text-muted)" }}>
              Upload study material. AI generates smart flashcards.<br />Spaced repetition makes them stick.
            </p>
            <button onClick={() => setShowUploadModal(true)}
              className="mt-8 rounded-xl bg-violet-600 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700">
              Get started — Upload a PDF
            </button>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {["AI Generated", "SM-2 Algorithm", "Tracks Progress"].map(t => (
                <span key={t} className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>{t}</span>
              ))}
            </div>
          </section>
        )}

        {/* ── Stats grid ── */}
        {!loading && decks.length > 0 && (
          <div className="animate-fade-up mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map(s => (
              <div key={s.label} className="overflow-hidden rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ height: 4, background: s.color }} />
                <div className="px-5 py-4">
                  <div className="text-[32px] font-bold leading-none" style={{ color: "var(--text)" }}>{s.value}</div>
                  <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search ── */}
        {(decks.length > 0 || searchQuery) && (
          <div className="animate-fade-up mt-5 relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search your decks..."
              className="w-full rounded-xl py-2.5 pl-11 pr-10 text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500"
              style={{ height: 44, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>✕</button>
            )}
          </div>
        )}

        {/* ── Section label ── */}
        {!loading && decks.length > 0 && (
          <h2 className="animate-fade-up animate-delay-100 mt-7 mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Your Decks</h2>
        )}

        {/* ── Deck grid ── */}
        {loading ? (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-[20px] p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between"><div className="flex-1"><div className="skeleton-shimmer h-5 w-3/4 rounded mb-2" /><div className="skeleton-shimmer h-3 w-1/2 rounded" /></div><div className="skeleton-shimmer h-16 w-16 rounded-full" /></div>
                <div className="skeleton-shimmer mt-5 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && searchQuery ? (
          <div className="mt-16 text-center animate-fade-in"><p className="text-sm" style={{ color: "var(--text-muted)" }}>No results for &quot;{searchQuery}&quot;</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((d, i) => (
              <div key={d.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}>
                <DeckCard deck={d} onDeleted={fetchDecks} />
              </div>
            ))}
          </div>
        )}
      </main>

      <UploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onSuccess={() => { setShowUploadModal(false); fetchDecks(); }} />
    </div>
  );
}
