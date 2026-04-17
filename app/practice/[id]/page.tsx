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
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-2xl space-y-4">
          <div className="skeleton-shimmer h-1.5 rounded-full w-full" />
          <div className="skeleton-shimmer h-[260px] rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            <div className="skeleton-shimmer h-14 rounded-lg" />
            <div className="skeleton-shimmer h-14 rounded-lg" />
            <div className="skeleton-shimmer h-14 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 text-center animate-fade-up">
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary rounded-lg px-5 py-2.5 text-sm"
          >
            Try Again
          </button>
          <Link
            href={`/deck/${params.id}`}
            className="mt-3 block text-xs text-gray-400 hover:text-gray-900 transition"
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-4">
        <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-10 text-center">
          <div className="animate-bounce-in mb-5 text-5xl">🎉</div>
          <h2 className="animate-fade-up animate-delay-100 text-xl font-semibold tracking-tight text-gray-900">
            Session complete
          </h2>
          <p className="animate-fade-up animate-delay-200 mt-2 text-sm text-gray-500">
            Great work — your brain just got stronger.
          </p>

          {total > 0 && (
            <div className="animate-fade-up animate-delay-300 mt-6 grid grid-cols-3 gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-rose-500">{sessionStats.hard}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Hard</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-amber-500">{sessionStats.okay}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Okay</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-emerald-500">{sessionStats.easy}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Easy</div>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push(`/deck/${params.id}`)}
            className="btn-primary animate-fade-up animate-delay-400 mt-6 w-full rounded-lg py-3 text-sm"
          >
            Return to deck
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = (currentIndex / cards.length) * 100;

  const animClass =
    cardAnim === "enter" ? "animate-card-enter" :
    cardAnim === "exit" ? "animate-card-exit" :
    cardAnim === "shake" ? "animate-shake" : "";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* ── Top bar ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(`/deck/${params.id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900 active:scale-95"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Exit
          </button>
          <span className="text-sm tabular-nums text-gray-400">
            <span className="font-semibold text-gray-900">{currentIndex + 1}</span> / {cards.length}
          </span>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="mx-auto mt-6 h-1 w-full max-w-2xl overflow-hidden rounded-full bg-gray-200 px-6">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* ── Card Area (centered vertically) ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className={animClass} key={currentCard.id}>
          <Flashcard
            question={currentCard.question}
            answer={currentCard.answer}
            isFlipped={isFlipped}
            onFlip={() => !isFlipped && setIsFlipped(true)}
          />
        </div>

        {/* Explain */}
        {isFlipped && (
          <div className="mt-5 w-full max-w-2xl animate-fade-in">
            {!explanationMap[currentCard.id] ? (
              <button
                onClick={handleExplain}
                disabled={isExplaining}
                className="mx-auto flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900 active:scale-95 disabled:opacity-50"
              >
                {isExplaining ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Thinking...
                  </>
                ) : (
                  "Explain more →"
                )}
              </button>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-5 text-left animate-fade-up">
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

      {/* ── Rating buttons (fixed bottom) ── */}
      <div
        className={`border-t border-gray-200 bg-white transition-all duration-300 ${
          isFlipped ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <div className="mx-auto max-w-2xl px-6 py-5">
          <p className="mb-3 text-center text-xs text-gray-400">
            How well did you know this?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate("hard")}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-50"
            >
              Hard
            </button>
            <button
              onClick={() => handleRate("okay")}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 active:scale-95 disabled:opacity-50"
            >
              Okay
            </button>
            <button
              onClick={() => handleRate("easy")}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 disabled:opacity-50"
            >
              Easy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
