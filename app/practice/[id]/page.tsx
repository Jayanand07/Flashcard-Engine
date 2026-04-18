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
  const [completed, setCompleted] = useState(false);
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/cards?deck_id=${params.id}&due_only=true`);
        if (!res.ok) throw new Error("Failed to fetch cards");
        setCards(await res.json());
      } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
      finally { setLoading(false); }
    })();
  }, [params.id]);

  const showFloat = (t: string) => {
    setFloatText(t);
    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatText(null), 1000);
  };

  const handleRate = useCallback(async (rating: "hard" | "okay" | "easy") => {
    if (isSubmitting || cards.length === 0) return;
    setIsSubmitting(true);
    const card = cards[currentIndex];
    setSessionStats(p => ({ ...p, [rating]: p[rating] + 1 }));

    if (rating === "easy") {
      const ns = easyStreak + 1; setEasyStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
      showFloat("🎯 Easy!");
    } else if (rating === "hard") { setEasyStreak(0); showFloat("😤 Keep going!"); }
    else { setEasyStreak(0); showFloat("😌 Good!"); }

    try {
      const res = await fetch("/api/cards", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: card.id, rating, current_interval: card.interval, current_ease_factor: card.ease_factor, current_difficulty: card.difficulty }),
      });
      if (!res.ok) throw new Error("Failed");

      if (rating === "hard") { setCardAnim("animate-shake"); await new Promise(r => setTimeout(r, 400)); }
      setCardAnim(rating === "easy" ? "animate-card-exit-left" : "animate-card-exit-fade");
      setIsFlipped(false);
      await new Promise(r => setTimeout(r, 350));

      const next = currentIndex + 1;
      setCurrentIndex(next);
      setIsSubmitting(false);
      setCardAnim("animate-card-enter-right");

      if (next === Math.floor(cards.length / 2) && cards.length > 4) {
        setShowMilestone("🔥 Halfway there!");
        setTimeout(() => setShowMilestone(null), 2000);
      }
      if (next >= cards.length) {
        setCompleted(true);
        setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }), 300);
      }
    } catch { alert("Error saving."); setIsSubmitting(false); setCardAnim(""); }
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
    } catch { alert("Failed."); } finally { setIsExplaining(false); }
  };

  // ── Loading ──
  if (loading) return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      <div className="border-b px-6 py-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-2xl justify-between"><div className="skeleton-shimmer h-4 w-12 rounded" /><div className="skeleton-shimmer h-4 w-16 rounded" /></div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6"><div className="w-full max-w-[640px] skeleton-shimmer rounded-2xl" style={{ minHeight: 460 }} /></div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="max-w-sm rounded-2xl p-8 text-center animate-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="mb-4 text-sm text-red-400">{error}</p>
        <button onClick={() => window.location.reload()} className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Try Again</button>
      </div>
    </div>
  );

  // ── Completion ──
  if (cards.length === 0 || completed) {
    const total = sessionStats.hard + sessionStats.okay + sessionStats.easy;
    const accuracy = total > 0 ? Math.round(((sessionStats.easy + sessionStats.okay) / total) * 100) : 0;

    return (
      <div className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #4c1d95, #7c3aed, #6d28d9)", backgroundSize: "200% 200%", animation: "gradient-shift 6s ease infinite" }}>
        <div className="w-full max-w-md rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="animate-bounce-in mb-4 text-6xl">🎉</div>
          <h2 className="animate-fade-up animate-delay-100 text-3xl font-bold tracking-tight text-white">Session Complete!</h2>
          <p className="animate-fade-up animate-delay-200 mt-2 text-sm text-white/60">Your brain just got stronger</p>

          {total > 0 && (
            <div className="animate-fade-up animate-delay-300 mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-2xl font-bold text-white">{sessionStats.hard}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wide">Hard</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-2xl font-bold text-white">{sessionStats.okay}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wide">Okay</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-2xl font-bold text-white">{sessionStats.easy}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wide">Easy</div>
                </div>
              </div>
              <div className="flex gap-6 justify-center">
                <span className="text-white/90 text-sm">🎯 Accuracy: <strong className="text-white">{accuracy}%</strong></span>
                <span className="text-white/90 text-sm">🔥 Best streak: <strong className="text-white">{bestStreak}</strong></span>
              </div>
            </div>
          )}

          <div className="animate-fade-up animate-delay-400 mt-8 flex flex-col gap-2.5">
            <button onClick={() => { setCurrentIndex(0); setCompleted(false); setSessionStats({ hard:0, okay:0, easy:0 }); setEasyStreak(0); setBestStreak(0); setIsFlipped(false); }}
              className="w-full rounded-xl bg-white py-3 text-sm font-bold text-violet-700 transition-colors hover:bg-white/90">
              Practice Again
            </button>
            <button onClick={() => router.push(`/deck/${params.id}`)}
              className="w-full rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5">
              Back to Deck
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <div className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => router.push(`/deck/${params.id}`)} className="flex items-center gap-1.5 text-sm transition-colors active:scale-95" style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Exit
          </button>
          <span className="rounded-full px-3.5 py-1 text-xs font-bold tabular-nums" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3 pb-2 sm:px-6" style={{ background: "var(--surface)" }}>
        <div className="mx-auto h-2 w-full max-w-2xl overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div className="h-full rounded-full bg-violet-600 transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Float text */}
      {floatText && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-50 flex justify-center">
          <span className="animate-float-text text-3xl font-bold" style={{ color: "var(--text)" }}>{floatText}</span>
        </div>
      )}

      {/* Milestone */}
      {showMilestone && (
        <div className="fixed inset-x-0 top-24 z-50 flex justify-center animate-fade-up">
          <span className="rounded-full bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow-lg">{showMilestone}</span>
        </div>
      )}

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6">
        <div className={`w-full ${cardAnim}`} key={currentCard.id}>
          <Flashcard question={currentCard.question} answer={currentCard.answer} isFlipped={isFlipped} onFlip={() => !isFlipped && setIsFlipped(true)} />
        </div>

        {/* Explain */}
        {isFlipped && (
          <div className="mt-5 w-full max-w-[640px] animate-fade-in">
            {!explanationMap[currentCard.id] ? (
              <button onClick={handleExplain} disabled={isExplaining}
                className="mx-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                {isExplaining ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Thinking...</>
                ) : "✨ Explain More"}
              </button>
            ) : (
              <div className="rounded-xl p-5 animate-fade-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8b5cf6" }}>AI Explanation</span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{explanationMap[currentCard.id]}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons — exact spec */}
      <div className={`border-t transition-all duration-300 ${isFlipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <p className="mb-3 text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>How well did you know this?</p>
          <div className="grid grid-cols-3 gap-3">
            {/* Hard */}
            <button onClick={() => handleRate("hard")} disabled={isSubmitting}
              className="flex flex-col items-center gap-0.5 rounded-xl border py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <span className="text-lg">😤</span>Hard
              <span className="text-[10px] font-normal opacity-60">See again soon</span>
            </button>
            {/* Okay */}
            <button onClick={() => handleRate("okay")} disabled={isSubmitting}
              className="flex flex-col items-center gap-0.5 rounded-xl border py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
              <span className="text-lg">😌</span>Okay
              <span className="text-[10px] font-normal opacity-60">Normal schedule</span>
            </button>
            {/* Easy */}
            <button onClick={() => handleRate("easy")} disabled={isSubmitting}
              className="flex flex-col items-center gap-0.5 rounded-xl border py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)", color: "#22c55e" }}>
              <span className="text-lg">🎯</span>Easy
              <span className="text-[10px] font-normal opacity-60">See you later</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
