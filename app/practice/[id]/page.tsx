"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Flashcard from "@/components/Flashcard";
import confetti from "canvas-confetti";

interface Card {
  id: string; deck_id: string; question: string; answer: string;
  difficulty: string; interval: number; ease_factor: number;
}

export default function PracticePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardAnim, setCardAnim] = useState("");
  const [floatText, setFloatText] = useState<string | null>(null);
  const [explanationMap, setExplanationMap] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState(false);
  const [sessionStats, setSessionStats] = useState({ hard: 0, okay: 0, easy: 0 });
  const [easyStreak, setEasyStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const floatTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cards?deck_id=${params.id}&due_only=true`);
        if (!res.ok) throw new Error("Failed to fetch cards");
        setCards(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const showFloat = (text: string) => {
    setFloatText(text);
    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatText(null), 1000);
  };

  const handleRate = useCallback(async (rating: "hard" | "okay" | "easy") => {
    if (isSubmitting || cards.length === 0) return;
    setIsSubmitting(true);
    const currentCard = cards[currentIndex];
    setSessionStats(p => ({ ...p, [rating]: p[rating] + 1 }));

    if (rating === "easy") {
      const ns = easyStreak + 1;
      setEasyStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
      showFloat("😊 Easy!");
    } else if (rating === "hard") {
      setEasyStreak(0);
      showFloat("💪 Keep going!");
    } else {
      setEasyStreak(0);
      showFloat("👍 Good!");
    }

    try {
      const res = await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: currentCard.id, rating,
          current_interval: currentCard.interval,
          current_ease_factor: currentCard.ease_factor,
          current_difficulty: currentCard.difficulty,
        }),
      });
      if (!res.ok) throw new Error("Failed");

      if (rating === "hard") { setCardAnim("animate-shake"); await new Promise(r => setTimeout(r, 400)); }
      
      setCardAnim(rating === "easy" ? "animate-card-exit-left" : "animate-card-exit-fade");
      setIsFlipped(false);
      await new Promise(r => setTimeout(r, 350));

      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsSubmitting(false);
      setCardAnim("animate-card-enter-right");

      // Milestone check
      if (nextIdx === Math.floor(cards.length / 2) && cards.length > 4) {
        setShowMilestone("Halfway there! 🔥");
        setTimeout(() => setShowMilestone(null), 2000);
      }

      // Completion — confetti
      if (nextIdx >= cards.length) {
        setTimeout(() => {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }, 300);
      }
    } catch {
      alert("Error saving. Try again.");
      setIsSubmitting(false);
      setCardAnim("");
    }
  }, [isSubmitting, cards, currentIndex, easyStreak, bestStreak]);

  const handleExplain = async () => {
    const c = cards[currentIndex];
    if (explanationMap[c.id]) return;
    setIsExplaining(true);
    try {
      const res = await fetch("/api/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: c.question, answer: c.answer }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setExplanationMap(p => ({ ...p, [c.id]: data.explanation }));
    } catch { alert("Failed."); }
    finally { setIsExplaining(false); }
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--background)" }}>
      <div className="border-b px-6 py-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-2xl justify-between"><div className="skeleton-shimmer h-4 w-12 rounded" /><div className="skeleton-shimmer h-4 w-16 rounded" /></div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-[600px] skeleton-shimmer h-[420px] rounded-2xl" />
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="card-surface max-w-sm p-8 text-center animate-fade-up">
        <p className="mb-4 text-sm text-red-400">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-accent w-full py-2.5 text-sm">Try Again</button>
      </div>
    </div>
  );

  // ── Session Complete ──
  if (cards.length === 0 || currentIndex >= cards.length) {
    const total = sessionStats.hard + sessionStats.okay + sessionStats.easy;
    const accuracy = total > 0 ? Math.round(((sessionStats.easy + sessionStats.okay) / total) * 100) : 0;

    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md rounded-2xl p-10 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="animate-bounce-in mb-4 text-6xl">🎉</div>
          <h2 className="animate-fade-up animate-delay-100 text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Session Complete!</h2>
          <p className="animate-fade-up animate-delay-200 mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Great work — your brain just got stronger 💪</p>

          {total > 0 && (
            <div className="animate-fade-up animate-delay-300 mt-6 space-y-3">
              <div className="grid grid-cols-3 gap-3 rounded-xl p-4" style={{ background: "var(--surface-2)" }}>
                <div><div className="text-2xl font-bold text-rose-500">{sessionStats.hard}</div><div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Hard</div></div>
                <div><div className="text-2xl font-bold text-amber-500">{sessionStats.okay}</div><div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Okay</div></div>
                <div><div className="text-2xl font-bold text-emerald-500">{sessionStats.easy}</div><div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Easy</div></div>
              </div>
              <div className="flex justify-around text-sm" style={{ color: "var(--text-secondary)" }}>
                <span>🎯 Accuracy: <strong style={{ color: "var(--text-primary)" }}>{accuracy}%</strong></span>
                <span>🔥 Best streak: <strong style={{ color: "var(--text-primary)" }}>{bestStreak}</strong></span>
              </div>
            </div>
          )}

          <div className="animate-fade-up animate-delay-400 mt-8 flex flex-col gap-2.5">
            <button onClick={() => { setCurrentIndex(0); setSessionStats({ hard: 0, okay: 0, easy: 0 }); setIsFlipped(false); }} className="btn-accent w-full py-3 text-sm">Practice Again</button>
            <button onClick={() => router.push(`/deck/${params.id}`)} className="btn-ghost w-full py-2.5 text-sm">Back to Deck</button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => router.push(`/deck/${params.id}`)} className="flex items-center gap-1.5 text-sm transition-colors active:scale-95" style={{ color: "var(--text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Exit
          </button>
          <span className="rounded-full px-3.5 py-1 text-xs font-bold tabular-nums" style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}>
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2 sm:px-6" style={{ background: "var(--surface)" }}>
        <div className="mx-auto h-2 w-full max-w-2xl overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, background: "var(--accent)" }} />
        </div>
      </div>

      {/* Float text */}
      {floatText && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center">
          <span className="animate-float-text text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{floatText}</span>
        </div>
      )}

      {/* Milestone */}
      {showMilestone && (
        <div className="fixed inset-x-0 top-24 z-50 flex justify-center animate-fade-up">
          <span className="rounded-full px-5 py-2 text-sm font-bold shadow-lg" style={{ background: "var(--accent)", color: "#fff" }}>{showMilestone}</span>
        </div>
      )}

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6">
        <div className={`w-full ${cardAnim}`} key={currentCard.id}>
          <Flashcard question={currentCard.question} answer={currentCard.answer} isFlipped={isFlipped} onFlip={() => !isFlipped && setIsFlipped(true)} />
        </div>

        {isFlipped && (
          <div className="mt-5 w-full max-w-[600px] animate-fade-in">
            {!explanationMap[currentCard.id] ? (
              <button onClick={handleExplain} disabled={isExplaining}
                className="mx-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {isExplaining ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Thinking...</>
                ) : "✨ Explain this answer"}
              </button>
            ) : (
              <div className="rounded-xl p-5 animate-fade-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>AI Explanation</span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{explanationMap[currentCard.id]}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons */}
      <div className={`border-t transition-all duration-300 ${isFlipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <p className="mb-3 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>How well did you know this?</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: "hard" as const, emoji: "😤", label: "Hard", sub: "Again soon", hoverBg: "rgba(239,68,68,0.1)", hoverBorder: "rgba(239,68,68,0.4)", hoverColor: "#ef4444" },
              { key: "okay" as const, emoji: "😐", label: "Okay", sub: "Normal", hoverBg: "rgba(245,158,11,0.1)", hoverBorder: "rgba(245,158,11,0.4)", hoverColor: "#f59e0b" },
              { key: "easy" as const, emoji: "😊", label: "Easy", sub: "Got it", hoverBg: "rgba(34,197,94,0.1)", hoverBorder: "rgba(34,197,94,0.4)", hoverColor: "#22c55e" },
            ].map(b => (
              <button key={b.key} onClick={() => handleRate(b.key)} disabled={isSubmitting}
                className="group flex flex-col items-center gap-1 rounded-xl py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = b.hoverBg; e.currentTarget.style.borderColor = b.hoverBorder; e.currentTarget.style.color = b.hoverColor; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              >
                <span className="text-lg">{b.emoji}</span>
                {b.label}
                <span className="text-[10px] font-normal" style={{ color: "var(--text-secondary)" }}>{b.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
