"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getTodayString } from "@/lib/sm2";
import Navbar from "@/components/Navbar";

interface Deck { 
  id: string; 
  name: string; 
  card_count: number; 
  created_at: string; 
  regenerate_count?: number;
}
interface Card { id: string; deck_id: string; question: string; answer: string; difficulty: string; next_review: string; created_at: string; }
interface HistoryEntry { id: string; generation_number: number; cards: Card[]; saved_at: string; }

export default function DeckPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const deckId = params.id;
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data: d, error: de } = await supabase.from("decks").select("*").eq("id", deckId).single();
    if (de || !d) { setFetchError("Deck not found"); setLoading(false); return; }
    setDeck(d);

    const ObjectRes = await Promise.all([
      supabase.from("cards").select("*").eq("deck_id", deckId).order("created_at", { ascending: true }),
      supabase.from("deck_history").select("*").eq("deck_id", deckId).order("generation_number", { ascending: false }),
      fetch(`/api/cards/all?deckId=${deckId}`).then(res => res.json())
    ]);

    setCards(ObjectRes[0].data || []);
    setHistory(ObjectRes[1].data || []);
    setAllCards(ObjectRes[2].cards || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [deckId]);

  const handleDelete = async () => {
    if (!deck || !confirm("Delete this deck?")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("decks").delete().eq("id", deck.id);
    if (!error) router.push("/"); else { alert("Failed"); setIsDeleting(false); }
  };

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/regenerate/${deckId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Regeneration failed");
      
      // Auto redirect to practice mode after successful regeneration
      router.refresh();
      router.push(`/practice/${deckId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to regenerate");
      setIsRegenerating(false);
      setShowRegenModal(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <div className="mx-auto max-w-5xl px-6 pt-10">
        <div className="skeleton-shimmer h-8 w-64 rounded-lg mb-3" />
        <div className="skeleton-shimmer h-4 w-40 rounded mb-8" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-24 rounded-2xl" />)}</div>
      </div>
    </div>
  );

  if (fetchError || !deck) return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-center animate-fade-up">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Deck not found</h2>
        <Link href="/" className="mt-3 block text-sm" style={{ color: "var(--accent)" }}>← Dashboard</Link>
      </div>
    </div>
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown date'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Unknown date'
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const today = getTodayString();
  const total = allCards.length || 1;
  const masteredCount = allCards.filter(c => c.difficulty === "mastered").length;
  const learningCount = allCards.filter(c => c.difficulty === "learning").length;
  const newCount = allCards.filter(c => c.difficulty === "new").length;
  const dueToday = cards.filter(c => c.next_review <= today).length;

  const retention = Math.round((masteredCount / total) * 100);
  const retentionColor = retention > 70 ? "var(--success)" : retention >= 30 ? "var(--warning)" : "var(--danger)";
  const retentionMsg = retention === 0 ? "Keep practicing!" : retention < 50 ? "Getting there! 💪" : retention < 80 ? "Great progress! 🔥" : "Almost mastered! ⭐";

  const mp = (masteredCount / total) * 100;
  const lp = (learningCount / total) * 100;
  const np = (newCount / total) * 100;

  const filtered = cards.filter(c => c.question.toLowerCase().includes(searchQuery.toLowerCase()));
  const date = new Date(deck.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const stats = [
    { label: "Total", value: cards.length, color: "#7c6af7", textColor: "var(--text-primary)" },
    { label: "Due Today", value: dueToday, color: "#f59e0b", textColor: dueToday > 0 ? "var(--warning)" : "var(--text-primary)" },
    { label: "Mastered", value: masteredCount, color: "#22c55e", textColor: "var(--success)" },
    { label: "Learning", value: learningCount, color: "#a855f7", textColor: "var(--accent)" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <div className="pt-8 pb-6 animate-fade-up">
          <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Dashboard
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>{deck.name}</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>{date} · {deck.card_count} cards</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button onClick={() => router.push(`/practice/${deckId}`)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "var(--accent)" }}>
                Practice{dueToday > 0 ? ` (${dueToday} due)` : ""}
              </button>
              <button onClick={() => router.push(`/quiz/${deckId}`)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
                style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
                🧠 Take Quiz
              </button>
              <button 
                onClick={() => setShowRegenModal(true)}
                disabled={deck.regenerate_count! >= 10}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ border: "1px solid var(--accent)", color: "var(--accent)" }}>
                🔄 New Cards
              </button>
              <button onClick={handleDelete} disabled={isDeleting}
                className="rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
                style={{ color: "var(--danger)" }}>
                {isDeleting ? "Deleting..." : "Delete deck"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="border-t pt-6 animate-fade-up animate-delay-100" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(s => (
              <div key={s.label} className="overflow-hidden rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ height: 4, background: s.color }} />
                <div className="px-4 py-3">
                  <p className="text-xl font-bold" style={{ color: s.textColor }}>{s.value}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {cards.length > 0 && (
            <div className="mt-5 rounded-2xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Progress</span>
                <span className="text-sm font-bold" style={{ color: retentionColor }}>{retention}% — {retentionMsg}</span>
              </div>

              {/* Segmented progress bar — inline styles only */}
              <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", background: "#2a2a3a" }}>
                <div style={{ width: `${mp}%`, background: "#22c55e", transition: "width 0.6s" }} />
                <div style={{ width: `${lp}%`, background: "#f59e0b", transition: "width 0.6s" }} />
                <div style={{ width: `${np}%`, background: "#6b7280", transition: "width 0.6s" }} />
              </div>

              <div className="mt-3 flex items-center gap-5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />{masteredCount} Mastered</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />{learningCount} Learning</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ background: "#6b7280" }} />{newCount} New</span>
              </div>
            </div>
          )}
        </div>

        {/* Card History collapsible section */}
        {history.length > 0 && (
          <div className="mt-8 border-t pt-6 animate-fade-up animate-delay-150" style={{ borderColor: "var(--border)" }}>
            <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              📚 Card History ({history.length} generations)
            </h2>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <button 
                    onClick={() => setExpandedHistory(expandedHistory === h.id ? null : h.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-medium transition-colors hover:bg-gray-50/50 dark:hover:bg-white/5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span>Generation {h.generation_number} — saved {formatDate(h.saved_at)}</span>
                    <span style={{ color: "var(--text-secondary)" }}>{h.cards.length} cards {expandedHistory === h.id ? "↑" : "↓"}</span>
                  </button>
                  {expandedHistory === h.id && (
                    <div className="px-5 pb-5 pt-2 space-y-3 max-h-[400px] overflow-y-auto animate-fade-in border-t" style={{ borderColor: "var(--border)" }}>
                      {h.cards.map((c, idx) => (
                        <div key={idx} className="text-xs p-3 rounded-lg" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                          <p className="font-bold mb-1" style={{ color: "var(--text-primary)" }}>Q: {c.question}</p>
                          <p>A: {c.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cards list */}
        <div className="mt-10 border-t pt-6 animate-fade-up animate-delay-200" style={{ borderColor: "var(--border)" }}>
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Flashcards <span className="ml-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--surface-2)" }}>{cards.length}</span>
          </h2>
          <div className="relative mb-5">
            <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search flashcards..."
              className="w-full max-w-sm rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          </div>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: "var(--text-secondary)" }}>{cards.length === 0 ? "No cards." : "No match."}</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map(card => {
                const bd = card.difficulty === "mastered" ? { t: "Mastered", c: "var(--success)", bg: "rgba(34,197,94,0.08)" }
                  : card.difficulty === "learning" ? { t: "Learning", c: "var(--warning)", bg: "rgba(245,158,11,0.08)" }
                  : { t: "New", c: "var(--text-secondary)", bg: "var(--surface-2)" };
                const isOpen = expandedCard === card.id;
                return (
                  <div key={card.id} className="rounded-xl p-4 transition-colors" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold" style={{ background: bd.bg, color: bd.c }}>{bd.t}</span>
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Next: {card.next_review}</span>
                    </div>
                    <h3 className="text-sm font-semibold leading-relaxed" style={{ color: "var(--text-primary)" }}>{card.question}</h3>
                    <button onClick={() => setExpandedCard(isOpen ? null : card.id)} className="mt-2 text-xs font-medium transition-colors" style={{ color: "var(--accent)" }}>
                      {isOpen ? "Hide answer" : "Show answer"}
                    </button>
                    {isOpen && (
                      <div className="mt-3 rounded-lg p-3 text-sm leading-relaxed animate-fade-in" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>{card.answer}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Regeneration Modal */}
      {showRegenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} className="animate-fade-in">
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '90%', zIndex: 51 }} className="animate-bounce-in shadow-2xl">
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Generate 50 new cards?</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Your current cards will be saved to history. This will reset your progress for this deck.<br/><br/>
              <strong>({deck.regenerate_count || 0}/10 regenerations used)</strong>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowRegenModal(false)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-colors"
                style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}>
                Cancel
              </button>
              <button 
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: "var(--accent)" }}>
                {isRegenerating ? "Generating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
