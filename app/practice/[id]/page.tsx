"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Flashcard from "@/components/Flashcard";

interface Card {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  difficulty: string;
  interval: number;
  ease_factor: number;
}

export default function PracticePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardAnim, setCardAnim] = useState<"enter" | "exit" | "shake" | "idle">("idle");

  const [explanationMap, setExplanationMap] = useState<Record<string, string>>({});
  const [isExplaining, setIsExplaining] = useState(false);

  const [sessionStats, setSessionStats] = useState({ hard: 0, okay: 0, easy: 0 });

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch(`/api/cards?deck_id=${params.id}&due_only=true`);
        if (!res.ok) throw new Error("Failed to fetch cards");
        const data = await res.json();
        setCards(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
        setTimeout(() => setCardAnim("enter"), 100);
      }
    };
    fetchCards();
  }, [params.id]);

  const handleRate = useCallback(async (rating: "hard" | "okay" | "easy") => {
    if (isSubmitting || cards.length === 0) return;
    setIsSubmitting(true);

    const currentCard = cards[currentIndex];
    setSessionStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

    try {
      const res = await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: currentCard.id,
          rating,
          current_interval: currentCard.interval,
          current_ease_factor: currentCard.ease_factor,
          current_difficulty: currentCard.difficulty,
        }),
      });

      if (!res.ok) throw new Error("Failed to save rating");

      if (rating === "hard") {
        setCardAnim("shake");
        await new Promise((r) => setTimeout(r, 350));
      }

      setCardAnim("exit");
      setIsFlipped(false);
      await new Promise((r) => setTimeout(r, 250));

      setCurrentIndex((prev) => prev + 1);
      setIsSubmitting(false);
      setCardAnim("enter");
    } catch (err) {
      alert("Error saving rating. Please try again.");
      setIsSubmitting(false);
      setCardAnim("idle");
    }
  }, [isSubmitting, cards, currentIndex]);

  const handleExplain = async () => {
    const currentCard = cards[currentIndex];
    if (explanationMap[currentCard.id]) return;

    setIsExplaining(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentCard.question,
          answer: currentCard.answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to explain");

      setExplanationMap((prev) => ({
        ...prev,
        [currentCard.id]: data.explanation,
      }));
    } catch (err) {
      alert("Failed to load explanation. Please try again.");
    } finally {
      setIsExplaining(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-stone-50">
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
            <div className="skeleton-shimmer h-4 w-12 rounded" />
            <div className="skeleton-shimmer h-4 w-16 rounded" />
          </div>
        </div>
        <div className="mx-auto mt-6 h-1 w-full max-w-2xl skeleton-shimmer rounded-full" />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            <div className="skeleton-shimmer h-[340px] sm:h-[380px] w-full rounded-2xl" />
          </div>
        </div>
        <div className="border-t border-gray-200 bg-white px-6 py-5">
          <div className="mx-auto grid max-w-2xl grid-cols-3 gap-3">
            <div className="skeleton-shimmer h-14 rounded-xl" />
            <div className="skeleton-shimmer h-14 rounded-xl" />
            <div className="skeleton-shimmer h-14 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center animate-fade-up">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="mb-5 text-sm text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary w-full rounded-xl py-3 text-sm"
          >
            Try Again
          </button>
          <Link
            href={`/deck/${params.id}`}
            className="mt-4 block text-xs text-gray-400 hover:text-gray-900 transition"
          >
            ← Back to deck
          </Link>
        </div>
      </div>
    );
  }

  // ── Session Complete ──
  if (cards.length === 0 || currentIndex >= cards.length) {
    const total = sessionStats.hard + sessionStats.okay + sessionStats.easy;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <div className="animate-bounce-in mb-6 text-6xl">🎉</div>
          <h2 className="animate-fade-up animate-delay-100 text-2xl font-semibold tracking-tight text-gray-900">
            Session complete!
          </h2>
          <p className="animate-fade-up animate-delay-200 mt-2 text-sm text-gray-500 leading-relaxed">
            Great work — your brain just got stronger 💪
          </p>

          {total > 0 && (
            <div className="animate-fade-up animate-delay-300 mt-8 grid grid-cols-3 gap-3 rounded-xl border border-gray-100 bg-gray-50 p-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-500">{sessionStats.hard}</div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">Hard</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{sessionStats.okay}</div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">Okay</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">{sessionStats.easy}</div>
                <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">Easy</div>
              </div>
            </div>
          )}

          <div className="animate-fade-up animate-delay-400 mt-8 space-y-3">
            <button
              onClick={() => router.push(`/deck/${params.id}`)}
              className="btn-primary w-full rounded-xl py-3.5 text-sm"
            >
              Return to deck
            </button>
            <button
              onClick={() => router.push("/")}
              className="btn-secondary w-full rounded-xl py-3 text-sm"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  const animClass =
    cardAnim === "enter" ? "animate-card-enter" :
    cardAnim === "exit" ? "animate-card-exit" :
    cardAnim === "shake" ? "animate-shake" : "";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* ── Top bar ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3.5">
          <button
            onClick={() => router.push(`/deck/${params.id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900 active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Exit
          </button>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium tabular-nums text-gray-600">
            {currentIndex + 1} of {cards.length}
          </span>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="bg-white pb-4 pt-3 px-6">
        <div className="mx-auto h-1.5 w-full max-w-2xl overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Card area (vertically centered) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:px-6">
        <div className={`w-full max-w-2xl ${animClass}`} key={currentCard.id}>
          <Flashcard
            question={currentCard.question}
            answer={currentCard.answer}
            isFlipped={isFlipped}
            onFlip={() => !isFlipped && setIsFlipped(true)}
          />
        </div>

        {/* ── Explain More ── */}
        {isFlipped && (
          <div className="mt-5 w-full max-w-2xl px-1 animate-fade-in">
            {!explanationMap[currentCard.id] ? (
              <button
                onClick={handleExplain}
                disabled={isExplaining}
                className="mx-auto flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-500 shadow-sm transition hover:border-gray-300 hover:text-gray-900 active:scale-95 disabled:opacity-50"
              >
                {isExplaining ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Thinking...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Explain this answer
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm animate-fade-up">
                <span className="mb-2 block text-[10px] font-medium uppercase tracking-widest text-amber-600">
                  AI Explanation
                </span>
                <p className="text-sm leading-relaxed text-gray-600">
                  {explanationMap[currentCard.id]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Rating buttons (fixed bottom section) ── */}
      <div
        className={`border-t border-gray-200 bg-white transition-all duration-300 ${
          isFlipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
          <p className="mb-3 text-center text-xs font-medium text-gray-400">
            How well did you know this?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate("hard")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
            >
              Hard
              <span className="text-[10px] font-normal text-gray-400">Again soon</span>
            </button>
            <button
              onClick={() => handleRate("okay")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 transition-all hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 active:scale-95 disabled:opacity-50"
            >
              Okay
              <span className="text-[10px] font-normal text-gray-400">Normal</span>
            </button>
            <button
              onClick={() => handleRate("easy")}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-gray-200 bg-white py-4 text-sm font-semibold text-gray-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 disabled:opacity-50"
            >
              Easy
              <span className="text-[10px] font-normal text-gray-400">Got it</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
