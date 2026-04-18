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
    { label: "Decks", value: decks.length, color: "#7c6af7" },
    { label: "Mastered", value: totalMastered, color: "#22c55e" },
    { label: "Due Today", value: totalDue, color: "#f59e0b" },
    { label: "Total Cards", value: totalCards, color: "#3b82f6" },
  ];

  return (
    <div className="min-h-screen bg-grid-pattern" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar onUploadClick={() => setShowUploadModal(true)} />

      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -left-40 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(124,106,247,0.15)", animationDuration: "4s" }}/>
        <div className="absolute -top-20 -right-20 w-36 h-36 sm:w-72 sm:h-72 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(59,130,246,0.1)", animationDuration: "6s", animationDelay: "1s" }}/>
        <div className="absolute -bottom-40 -right-40 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(168,85,247,0.15)", animationDuration: "5s", animationDelay: "2s" }}/>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 sm:w-64 sm:h-64 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(245,158,11,0.08)", animationDuration: "7s", animationDelay: "0.5s" }}/>
        <div className="particle" style={{top:'20%',left:'10%',animationDuration:'8s'}}/>
        <div className="particle" style={{top:'60%',left:'85%',animationDuration:'12s',animationDelay:'2s'}}/>
        <div className="particle" style={{top:'40%',left:'70%',animationDuration:'10s',animationDelay:'4s'}}/>
        <div className="particle" style={{top:'80%',left:'30%',animationDuration:'9s',animationDelay:'1s'}}/>
        <div className="particle" style={{top:'15%',left:'60%',animationDuration:'11s',animationDelay:'3s'}}/>
        <div className="particle" style={{top:'70%',left:'15%',animationDuration:'13s',animationDelay:'5s'}}/>
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6" style={{ zIndex: 10 }}>
        {/* Hero */}
        {!loading && decks.length === 0 && (
          <section className="animate-fade-up py-24 text-center sm:py-32">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 text-sm font-medium"
              style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", color: "var(--accent)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }}/>
              Powered by Gemini AI
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl" style={{ color: "var(--text-primary)" }}>Turn any PDF into</h1>
            <h1 className="mt-2 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x" style={{ backgroundSize: "200% auto" }}>a learning machine</span>
            </h1>
            <p className="mx-auto mt-6 max-w-lg text-lg sm:text-xl" style={{ color: "var(--text-secondary)" }}>
              Upload study material. AI generates smart flashcards.<br/>Spaced repetition makes them stick forever.
            </p>
            <button onClick={() => setShowUploadModal(true)} className="mt-10 rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>
              Get started — Upload a PDF
            </button>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {["AI Generated", "SM-2 Algorithm", "Tracks Progress"].map(t => (
                <span key={t} className="rounded-full px-3.5 py-1.5 text-[11px] font-semibold" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{t}</span>
              ))}
            </div>
          </section>
        )}

        {/* Stats grid */}
        {!loading && decks.length > 0 && (
          <div className="animate-fade-up mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {statCards.map(s => (
              <div key={s.label} className="stat-card-shimmer overflow-hidden rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ height: 4, background: s.color }} />
                <div className="px-5 py-4">
                  <div className="text-[32px] font-bold leading-none" style={{ color: "var(--text-primary)" }}>{s.value}</div>
                  <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {(decks.length > 0 || searchQuery) && (
          <div className="animate-fade-up mt-5 relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search your decks..."
              className="w-full rounded-xl py-2.5 pl-11 pr-10 text-sm outline-none transition-all"
              style={{ height: 44, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-secondary)" }}>✕</button>}
          </div>
        )}

        {!loading && decks.length > 0 && (
          <h2 className="animate-fade-up animate-delay-100 mt-7 mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Your Decks</h2>
        )}

        {loading ? (
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-[20px] p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="skeleton-shimmer h-5 w-3/4 rounded mb-2" /><div className="skeleton-shimmer h-3 w-1/2 rounded" />
                <div className="skeleton-shimmer mt-5 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 && searchQuery ? (
          <div className="mt-16 text-center animate-fade-in"><p className="text-sm" style={{ color: "var(--text-secondary)" }}>No results for &quot;{searchQuery}&quot;</p></div>
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
