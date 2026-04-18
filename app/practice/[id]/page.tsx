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
  const deckId = params.id;
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
  const [hardCount, setHardCount] = useState(0);
  const [okayCount, setOkayCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [newMasteredCount, setNewMasteredCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("");
  const [resetting, setResetting] = useState(false);
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionStart] = useState(Date.now());
  const [streak, setStreak] = useState(0);
  const [showStreakBurst, setShowStreakBurst] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cards?deck_id=${deckId}&due_only=true`);
      if (!res.ok) throw new Error("Failed to fetch cards");
      const data = await res.json();
      setCards(data);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong"); }
    finally { setLoading(false); }
  }, [deckId]);

  useEffect(() => {
    fetchCards();
    // Fetch deck name for session save
    (async () => {
      try {
        const deckRes = await fetch(`/api/decks/${deckId}`);
        const deckData = await deckRes.json();
        const dName = deckData.deck?.name || "Unknown Deck";
        setDeckName(dName);
        localStorage.setItem('lastDeckId', deckId);
        localStorage.setItem('lastDeckName', dName);
      } catch (err) {
        console.error("Failed to fetch deck name:", err);
      }
    })();
  }, [deckId, fetchCards]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") { e.preventDefault(); if (!isFlipped && !showCompletion) handleFlip(); }
      if (isFlipped && !isSubmitting && !showCompletion) {
        if (e.key === "1") handleRate("hard");
        if (e.key === "2") handleRate("okay");
        if (e.key === "3") handleRate("easy");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFlipped, isSubmitting, showCompletion]);

  const playFlipSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  };

  const playRatingSound = (rating: 'easy'|'okay'|'hard') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      const freqs = { easy: [600, 900], okay: [500, 600], hard: [400, 200] };
      oscillator.frequency.setValueAtTime(freqs[rating][0], audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(freqs[rating][1], audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
  };

  const handleFlip = () => {
    setIsFlipped(true);
    playFlipSound();
  };

  const showFloat = (t: string) => {
    setFloatText(t);
    if (floatTimer.current) clearTimeout(floatTimer.current);
    floatTimer.current = setTimeout(() => setFloatText(null), 1000);
  };

  const saveSession = async (stats: { hard: number; okay: number; easy: number }) => {
    const total = stats.hard + stats.okay + stats.easy;
    if (total === 0) return;
    const accuracy = Math.round(((stats.easy + stats.okay) / total) * 100);
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck_id: deckId, deck_name: deckName || "Unknown Deck",
          cards_reviewed: total, easy_count: stats.easy, okay_count: stats.okay, hard_count: stats.hard, accuracy,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to save session:", err);
    }
  };

  const handleRate = useCallback(async (rating: "hard" | "okay" | "easy") => {
    if (isSubmitting || cards.length === 0 || showCompletion) return;
    setIsSubmitting(true);
    const card = cards[currentIndex];

    const newHard = rating === "hard" ? hardCount + 1 : hardCount;
    const newOkay = rating === "okay" ? okayCount + 1 : okayCount;
    const newEasy = rating === "easy" ? easyCount + 1 : easyCount;
    
    playRatingSound(rating);

    if (rating === "hard" || rating === "okay") {
      if (rating === "hard") { setHardCount(newHard); showFloat("😤 Keep going!"); }
      else { setOkayCount(newOkay); showFloat("😌 Good!"); }
      setCurrentStreak(0);
      setStreak(0);
    } else {
      setEasyCount(newEasy);
      const ns = currentStreak + 1; setCurrentStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
      showFloat("🎯 Easy!");
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak >= 3) {
        setShowStreakBurst(true);
        setTimeout(() => setShowStreakBurst(false), 1500);
      }
    }

    try {
      const res = await fetch("/api/cards", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_id: card.id, rating, current_interval: card.interval, current_ease_factor: card.ease_factor, current_difficulty: card.difficulty }),
      });
      if (!res.ok) throw new Error("Failed");
      
      const updatedCard = await res.json();
      if ((card.difficulty === "new" || card.difficulty === "learning") && updatedCard.difficulty === "mastered") {
        setNewMasteredCount(prev => prev + 1);
      }

      if (rating === "hard") { setCardAnim("animate-shake"); await new Promise(r => setTimeout(r, 400)); }
      setCardAnim(rating === "easy" ? "animate-card-exit-left" : "animate-card-exit-fade");
      setIsFlipped(false);
      await new Promise(r => setTimeout(r, 350));

      const next = currentIndex + 1;
      setCurrentIndex(next);
      setIsSubmitting(false);
      setCardAnim("animate-card-enter-right");

      if (next === 10) {
        setShowMilestone("🔥 10 cards done! Keep going!"); setTimeout(() => setShowMilestone(null), 2000);
      } else if (next === 25) {
        setShowMilestone("⚡ Halfway there! You're crushing it!"); setTimeout(() => setShowMilestone(null), 2000);
      } else if (next === 40) {
        setShowMilestone("🎯 Almost done! 10 cards left!"); setTimeout(() => setShowMilestone(null), 2000);
      }

      if (next >= cards.length) {
        setShowCompletion(true);
        await saveSession({ hard: newHard, okay: newOkay, easy: newEasy });
        setTimeout(() => confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } }), 300);
      }
    } catch { alert("Error saving."); setIsSubmitting(false); setCardAnim(""); }
  }, [isSubmitting, cards, currentIndex, hardCount, okayCount, easyCount, currentStreak, bestStreak, showCompletion, deckId, deckName]);

  const handlePracticeAgain = async () => {
    setResetting(true);
    try {
      // Reset SM-2 values for all cards in this deck
      await fetch(`/api/regenerate/${deckId}`, { method: "POST" });
    } catch {}
    // Reset all local state
    setCurrentIndex(0);
    setIsFlipped(false);
    setHardCount(0);
    setOkayCount(0);
    setEasyCount(0);
    setBestStreak(0);
    setCurrentStreak(0);
    setNewMasteredCount(0);
    setShowCompletion(false);
    setCardAnim("");
    setExplanationMap({});
    // Re-fetch cards
    await fetchCards();
    setResetting(false);
  };

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

  if (loading) return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <div className="border-b px-6 py-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-2xl justify-between"><div className="skeleton-shimmer h-4 w-12 rounded" /><div className="skeleton-shimmer h-4 w-16 rounded" /></div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6"><div className="w-full max-w-[680px] skeleton-shimmer rounded-2xl" style={{ minHeight: 500 }} /></div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-sm rounded-2xl p-8 text-center animate-fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="mb-4 text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        <button onClick={() => window.location.reload()} className="w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: "var(--accent)" }}>Try Again</button>
      </div>
    </div>
  );

  // Completion
  if (cards.length === 0 || showCompletion) {
    const total = hardCount + okayCount + easyCount;
    const accuracy = total > 0 ? Math.round(((easyCount + okayCount) / total) * 100) : 0;
    
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    return (
      <div className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #4c1d95, #7c3aed, #6d28d9)", backgroundSize: "200% 200%", animation: "gradient-shift 6s ease infinite" }}>
        <div className="w-full max-w-md rounded-2xl p-10 text-center" style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="animate-bounce-in mb-4 text-6xl">🎉</div>
          <h2 className="animate-fade-up animate-delay-100 text-3xl font-bold tracking-tight text-white">Session Complete!</h2>
          <p className="animate-fade-up animate-delay-200 mt-2 text-sm text-white/60">Your brain just got stronger</p>
          
          <div className="animate-fade-up animate-delay-200 mt-4 rounded-xl py-3 px-4 shadow-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <p className="text-sm font-bold text-white">📊 This session: <span className="text-green-300">{newMasteredCount}</span> new cards mastered</p>
          </div>

          {total > 0 && (
            <div className="animate-fade-up animate-delay-300 mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-2xl font-bold text-white">{hardCount}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wide">Hard</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-2xl font-bold text-white">{okayCount}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wide">Okay</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="text-2xl font-bold text-white">{easyCount}</div>
                  <div className="text-xs text-white/70 uppercase tracking-wide">Easy</div>
                </div>
              </div>
              <div className="flex gap-6 justify-center">
                <span className="text-white/90 text-sm">🎯 Accuracy: <strong className="text-white">{accuracy}%</strong></span>
                <span className="text-white/90 text-sm">⏱️ Time: <strong className="text-white">{timeStr}</strong></span>
                <span className="text-white/90 text-sm">🔥 Best streak: <strong className="text-white">{bestStreak}</strong></span>
              </div>
            </div>
          )}

          <div className="animate-fade-up animate-delay-400 mt-8 flex flex-col gap-2.5">
            <button onClick={handlePracticeAgain} disabled={resetting}
              className="w-full rounded-xl bg-white py-3 text-sm font-bold text-violet-700 transition-colors hover:bg-white/90 disabled:opacity-60">
              {resetting ? "Resetting cards..." : "Practice Again"}
            </button>
            <button onClick={() => router.push(`/deck/${deckId}`)}
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
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Ambient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(124,106,247,0.12)", animationDuration: "5s" }}/>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(168,85,247,0.12)", animationDuration: "7s", animationDelay: "2s" }}/>
      </div>

      {/* Top bar */}
      <div className="relative border-b" style={{ background: "var(--surface)", borderColor: "var(--border)", zIndex: 10 }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => router.push(`/deck/${deckId}`)} className="flex items-center gap-1.5 text-sm transition-colors active:scale-95" style={{ color: "var(--text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Exit
          </button>
          <span key={currentIndex} className="rounded-full px-3.5 py-1 text-xs font-bold tabular-nums inline-block" style={{ background: "var(--surface-2)", color: "var(--text-primary)", animation: 'scale-pop 0.3s ease' }}>
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="relative px-4 pt-3 pb-2 sm:px-6" style={{ background: "var(--surface)", zIndex: 10 }}>
        <div className="mx-auto h-2 w-full max-w-2xl overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%`, background: "var(--accent)" }} />
        </div>
        {/* Keyboard hint */}
        <p className="mt-2 text-center text-[10px] font-medium" style={{ color: "var(--text-secondary)" }}>
          Space to flip · 1/2/3 to rate
        </p>
      </div>

      {/* Float text */}
      {floatText && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 flex justify-center" style={{ zIndex: 50 }}>
          <span className="animate-float-text text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{floatText}</span>
        </div>
      )}

      {/* Milestone */}
      {showMilestone && (
        <div className="fixed inset-x-0 top-24 flex justify-center animate-slide-down" style={{ zIndex: 50 }}>
          <span className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg" style={{ background: "var(--accent)" }}>{showMilestone}</span>
        </div>
      )}

      {/* Streak Burst */}
      {showStreakBurst && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '48px', fontWeight: 'bold', color: '#f59e0b',
          textShadow: '0 0 40px rgba(245,158,11,0.8)', animation: 'float-up 1.5s ease forwards',
          pointerEvents: 'none', zIndex: 100
        }}>
          🔥 {streak} streak!
        </div>
      )}

      {/* Card area */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6" style={{ zIndex: 10 }}>
        <div className={`w-full ${cardAnim}`} key={currentCard.id}>
          <Flashcard question={currentCard.question} answer={currentCard.answer} isFlipped={isFlipped} onFlip={() => !isFlipped && handleFlip()} />
        </div>

        {isFlipped && (
          <div className="mt-5 w-full max-w-[680px] animate-fade-in">
            {!explanationMap[currentCard.id] ? (
              <button onClick={handleExplain} disabled={isExplaining}
                className="mx-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                {isExplaining ? "Thinking..." : "✨ Explain More"}
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
      <div className={`relative border-t transition-all duration-300 ${isFlipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"}`}
        style={{ background: "var(--surface)", borderColor: "var(--border)", zIndex: 10 }}>
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <p className="mb-3 text-center text-xs font-medium" style={{ color: "var(--text-secondary)" }}>How well did you know this?</p>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleRate("hard")} disabled={isSubmitting}
              className="flex flex-col items-center gap-0.5 rounded-xl border py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
              <span className="text-lg">😤</span>Hard<span className="text-[10px] font-normal opacity-60">See again soon</span>
            </button>
            <button onClick={() => handleRate("okay")} disabled={isSubmitting}
              className="flex flex-col items-center gap-0.5 rounded-xl border py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)", color: "#f59e0b" }}>
              <span className="text-lg">😌</span>Okay<span className="text-[10px] font-normal opacity-60">Normal schedule</span>
            </button>
            <button onClick={() => handleRate("easy")} disabled={isSubmitting}
              className="flex flex-col items-center gap-0.5 rounded-xl border py-4 text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)", color: "#22c55e" }}>
              <span className="text-lg">🎯</span>Easy<span className="text-[10px] font-normal opacity-60">See you later</span>
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '0.05em' }}>
            SPACE to flip · 1 Hard · 2 Okay · 3 Easy
          </div>
        </div>
      </div>
    </div>
  );
}
