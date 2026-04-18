"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getTodayString } from "@/lib/sm2";
import Navbar from "@/components/Navbar";
import ProgressBar from "@/components/ProgressBar";

interface Deck { id: string; name: string; card_count: number; created_at: string; }
interface Card { id: string; deck_id: string; question: string; answer: string; difficulty: string; next_review: string; created_at: string; }

export default function DeckPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: d, error: de } = await supabase.from("decks").select("*").eq("id", params.id).single();
      if (de || !d) { setFetchError("Deck not found"); setLoading(false); return; }
      setDeck(d);
      const { data: c } = await supabase.from("cards").select("*").eq("deck_id", params.id).order("created_at", { ascending: true });
      setCards(c || []);
      setLoading(false);
    })();
  }, [params.id]);

  const handleDelete = async () => {
    if (!deck) return;
    if (confirm("Delete this deck?")) {
      setIsDeleting(true);
      const { error } = await supabase.from("decks").delete().eq("id", deck.id);
      if (!error) router.push("/"); else { alert("Failed"); setIsDeleting(false); }
    }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="skeleton-shimmer h-8 w-64 rounded-lg mb-3" />
        <div className="skeleton-shimmer h-4 w-40 rounded mb-8" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-20 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  if (fetchError || !deck) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center animate-fade-up">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Deck not found</h2>
        <Link href="/" className="mt-3 block text-sm" style={{ color: "var(--accent)" }}>← Dashboard</Link>
      </div>
    </div>
  );

  const today = getTodayString();
  const mastered = cards.filter(c => c.difficulty === "mastered").length;
  const learning = cards.filter(c => c.difficulty === "learning").length;
  const newCards = cards.filter(c => c.difficulty === "new").length;
  const dueToday = cards.filter(c => c.next_review <= today).length;
  const retention = cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0;
  const retentionColor = retention >= 71 ? "var(--success)" : retention >= 31 ? "var(--warning)" : "var(--danger)";

  const filteredCards = cards.filter(c => c.question.toLowerCase().includes(searchQuery.toLowerCase()));
  const formattedDate = new Date(deck.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: "var(--background)" }}>
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        {/* Header */}
        <div className="pt-8 pb-6 animate-fade-up">
          <Link href="/" className="mb-5 inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>{deck.name}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{formattedDate} · {deck.card_count} cards</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => router.push(`/practice/${deck.id}`)} disabled={dueToday === 0}
              className={`btn-accent px-5 py-2.5 text-sm ${dueToday === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
              Practice{dueToday > 0 ? ` (${dueToday} due)` : ""}
            </button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-500/10"
              style={{ color: "var(--danger)" }}>
              {isDeleting ? "Deleting..." : "Delete deck"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t pt-6 animate-fade-up animate-delay-100" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: cards.length, color: "var(--text-primary)", accent: "var(--accent)" },
              { label: "Due today", value: dueToday, color: dueToday > 0 ? "var(--warning)" : "var(--text-primary)", accent: "var(--warning)" },
              { label: "Mastered", value: mastered, color: "var(--success)", accent: "var(--success)" },
              { label: "Learning", value: learning, color: "var(--accent)", accent: "var(--accent)" },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${s.accent}` }}>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                <p className="mt-1 text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress + Retention */}
          {cards.length > 0 && (
            <div className="mt-5 rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Progress</span>
                <span className="text-sm font-bold" style={{ color: retentionColor }}>Retention: {retention}%</span>
              </div>
              <ProgressBar mastered={mastered} learning={learning} newCards={newCards} total={cards.length} height="h-3" />
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="mt-10 border-t pt-6 animate-fade-up animate-delay-200" style={{ borderColor: "var(--border)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Flashcards <span className="ml-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--surface-2)" }}>{cards.length}</span>
            </h2>
          </div>

          <div className="relative mb-5">
            <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search flashcards..."
              className="w-full max-w-sm rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)", "--tw-ring-color": "var(--accent)" } as React.CSSProperties} />
          </div>

          {filteredCards.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{cards.length === 0 ? "No cards." : "No match."}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCards.map(card => {
                const badge = card.difficulty === "mastered" ? { text: "Mastered", bg: "rgba(34,197,94,0.1)", color: "var(--success)" }
                  : card.difficulty === "learning" ? { text: "Learning", bg: "rgba(245,158,11,0.1)", color: "var(--warning)" }
                  : { text: "New", bg: "var(--surface-2)", color: "var(--text-secondary)" };
                const accent = card.difficulty === "mastered" ? "var(--success)" : card.difficulty === "learning" ? "var(--warning)" : "var(--border)";
                const isOpen = expandedCard === card.id;

                return (
                  <div key={card.id} className="rounded-xl p-4 transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${accent}` }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: badge.bg, color: badge.color }}>{badge.text}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{card.next_review}</span>
                    </div>
                    <h3 className="mb-2 text-sm font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>{card.question}</h3>
                    <button onClick={() => setExpandedCard(isOpen ? null : card.id)} className="text-xs font-medium transition-colors" style={{ color: "var(--accent)" }}>
                      {isOpen ? "Hide answer" : "Show answer"}
                    </button>
                    {isOpen && (
                      <div className="mt-3 rounded-lg p-3 text-sm leading-relaxed animate-fade-in" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                        {card.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
