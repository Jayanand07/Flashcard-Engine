"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Flashcard from "@/components/Flashcard";
import Navbar from "@/components/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import confetti from "canvas-confetti";
import { useCards } from "@/hooks/useCards";
import { useDecks } from "@/hooks/useDecks";

export default function PracticePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const deckId = params.id;
  const { cards, loading: cardsLoading, refetch: fetchCards } = useCards(deckId, true);
  const { decks } = useDecks();
  
  const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
  const deckName = deck?.name || "Flashcards";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardAnim, setCardAnim] = useState("");
  const [floatText, setFloatText] = useState<string | null>(null);
  const [explanationMap, setExplanationMap] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState(false);
  
  const [stats, setStats] = useState({ hard: 0, okay: 0, easy: 0 });
  const [showCompletion, setShowCompletion] = useState(false);
  const [resetting, setResetting] = useState(false);
  const sessionStart = useState(Date.now())[0];
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFloat = useCallback((t: string) => {
    setFloatText(t);
    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatText(null), 1000);
  }, []);

  const saveSession = useCallback(async (s: typeof stats) => {
    const total = s.hard + s.okay + s.easy;
    if (total === 0) return;
    const accuracy = Math.round(((s.easy + s.okay) / total) * 100);
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck_id: deckId, 
          deck_name: deckName,
          cards_reviewed: total, 
          easy_count: s.easy, 
          okay_count: s.okay, 
          hard_count: s.hard, 
          accuracy,
        }),
      });
      router.refresh();
    } catch (err) { console.error(err); }
  }, [deckId, deckName, router]);

  const handleRate = useCallback(async (rating: "hard" | "okay" | "easy") => {
    if (isSubmitting || cards.length === 0 || showCompletion) return;
    setIsSubmitting(true);
    const card = cards[currentIndex];

    setStats(prev => {
      const next = { ...prev, [rating]: prev[rating] + 1 };
      if (currentIndex + 1 >= cards.length) saveSession(next);
      return next;
    });

    if (rating === "easy") {
      showFloat("🎯 Easy!");
    } else {
      showFloat(rating === "hard" ? "😤 Hard" : "😌 Okay");
    }

    try {
      const res = await fetch("/api/cards", {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          card_id: card.id, 
          rating, 
          current_interval: card.interval, 
          current_ease_factor: card.ease_factor, 
          current_difficulty: card.difficulty 
        }),
      });
      if (!res.ok) throw new Error("Failed");
      
      if (rating === "hard") { setCardAnim("animate-shake"); await new Promise(r => setTimeout(r, 400)); }
      setCardAnim(rating === "easy" ? "animate-card-exit-left" : "animate-card-exit-fade");
      setIsFlipped(false);
      await new Promise(r => setTimeout(r, 350));

      const next = currentIndex + 1;
      if (next >= cards.length) {
        setShowCompletion(true);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } else {
        setCurrentIndex(next);
        setCardAnim("animate-card-enter-right");
      }
      setIsSubmitting(false);
    } catch (err) { 
      console.error(err);
      setIsSubmitting(false); 
      setCardAnim(""); 
    }
  }, [isSubmitting, cards, currentIndex, showCompletion, saveSession, showFloat]);

  const handlePracticeAgain = useCallback(async () => {
    setResetting(true);
    try {
      await fetch(`/api/regenerate/${deckId}`, { method: "POST" });
      setCurrentIndex(0);
      setIsFlipped(false);
      setStats({ hard: 0, okay: 0, easy: 0 });
      setShowCompletion(false);
      setExplanationMap({});
      await fetchCards();
    } finally { setResetting(false); }
  }, [deckId, fetchCards]);

  const handleExplain = useCallback(async () => {
    const card = cards[currentIndex];
    if (!card || explanationMap[card.id]) return;
    setIsExplaining(true);
    try {
      const res = await fetch("/api/explain", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ question: card.question, answer: card.answer }) 
      });
      const data = await res.json();
      setExplanationMap(p => ({ ...p, [card.id]: data.explanation }));
    } finally { setIsExplaining(false); }
  }, [cards, currentIndex, explanationMap]);

  if (!cardsLoading && cards.length === 0) return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
       <Navbar />
       <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 text-6xl">🎉</div>
          <h2 className="text-2xl font-black mb-2">No cards due today!</h2>
          <p className="text-secondary mb-8 font-medium">You&apos;ve cleared your deck for now. Great work staying on top of your study!</p>
          <button onClick={() => router.push(`/deck/${deckId}`)}
            className="w-full rounded-2xl bg-accent py-4 text-sm font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
            Back to Deck
          </button>
       </div>
    </div>
  );

  if (cardsLoading) return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4">
         <Skeleton h="480px" r="24px" className="mb-8" />
         <div className="flex w-full gap-3">
            <Skeleton h="72px" r="16px" className="flex-1" />
            <Skeleton h="72px" r="16px" className="flex-1" />
            <Skeleton h="72px" r="16px" className="flex-1" />
         </div>
      </div>
    </div>
  );

  if (showCompletion) {
    const total = stats.hard + stats.okay + stats.easy;
    const accuracy = total > 0 ? Math.round(((stats.easy + stats.okay) / total) * 100) : 0;
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const timeStr = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed/60)}m ${elapsed%60}s`;

    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#7c6af7] to-[#a855f7] text-white">
        <Navbar />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div className="animate-bounce-in mb-6 text-7xl sm:text-8xl">🎉</div>
          <h2 className="animate-fade-up text-4xl font-black tracking-tight sm:text-6xl">Session Done!</h2>
          <p className="animate-fade-up animate-delay-100 mt-2 text-lg font-bold opacity-80">You&apos;re making great progress.</p>
          
          <div className="animate-fade-up animate-delay-200 mt-12 grid w-full max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Hard", val: stats.hard, color: "rgba(239,68,68,0.2)" },
              { label: "Okay", val: stats.okay, color: "rgba(245,158,11,0.2)" },
              { label: "Easy", val: stats.easy, color: "rgba(34,197,94,0.2)" },
              { label: "Accuracy", val: accuracy + "%", color: "rgba(255,255,255,0.1)" }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-3xl border border-white/10 p-6 backdrop-blur-md" style={{ background: s.color }}>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{s.label}</span>
                <span className="text-2xl font-black">{s.val}</span>
              </div>
            ))}
          </div>

          <div className="animate-fade-up animate-delay-400 mt-12 flex w-full max-w-md flex-col gap-3">
             <div className="mb-4 text-center text-sm font-medium opacity-60">⏱ Time: {timeStr}</div>
            <button onClick={handlePracticeAgain} disabled={resetting}
              className="w-full rounded-2xl bg-white py-4 text-sm font-black text-accent shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
              {resetting ? "Resetting..." : "Practice Again"}
            </button>
            <button onClick={() => router.push("/")}
              className="w-full rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = cards.length > 0 ? ((currentIndex + (isSubmitting ? 1 : 0)) / cards.length) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-grid-pattern" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      
      {/* Premium Progress */}
      <div className="px-4 pt-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" style={{ background: "var(--surface-2)" }}>
            <div className="h-full bg-accent transition-all duration-500 ease-out" 
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7c6af7, #a855f7)" }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-secondary">
             <span>{deckName}</span>
             <span style={{ color: "var(--text-primary)" }}>{Math.min(currentIndex + 1, cards.length)} / {cards.length}</span>
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        {floatText && (
          <div className="pointer-events-none absolute top-1/4 z-50 animate-float-text text-4xl font-black" style={{ color: "var(--text-primary)" }}>
            {floatText}
          </div>
        )}

        <div className={`w-full ${cardAnim}`} key={cards[currentIndex]?.id}>
          <Flashcard 
            question={cards[currentIndex]?.question || ""} 
            answer={cards[currentIndex]?.answer || ""} 
            isFlipped={isFlipped} 
            onFlip={() => setIsFlipped(!isFlipped)} 
          />
        </div>

        {isFlipped && (
          <div className="mt-8 w-full max-w-[680px] animate-fade-in px-4">
             {cards[currentIndex] && !explanationMap[cards[currentIndex].id] ? (
                <button onClick={handleExplain} disabled={isExplaining}
                  className="mx-auto flex items-center gap-2 rounded-xl bg-surface-2 px-6 py-3 text-sm font-black text-primary transition-all hover:bg-border disabled:opacity-50">
                   {isExplaining ? "Thinking..." : "✨ Ask AI to explain"}
                </button>
             ) : (
                <div className="linear-card p-6">
                   <p className="text-sm font-medium leading-relaxed text-secondary">{explanationMap[cards[currentIndex].id]}</p>
                </div>
             )}
          </div>
        )}
      </div>

      {/* Tactile Controls */}
      <div className={`border-t bg-surface transition-all duration-300 ${isFlipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}>
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "hard", label: "Hard", emoji: "😤", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
              { id: "okay", label: "Okay", emoji: "😌", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
              { id: "easy", label: "Easy", emoji: "🎯", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" }
            ].map(r => (
              <button key={r.id} onClick={() => handleRate(r.id as "hard" | "okay" | "easy")} disabled={isSubmitting}
                className="flex flex-col items-center justify-center rounded-2xl border-2 py-4 shadow-sm transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: r.bg, borderColor: r.border, color: r.color, height: "72px" }}>
                <span className="text-xl">{r.emoji}</span>
                <span className="text-xs font-black uppercase tracking-widest">{r.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
