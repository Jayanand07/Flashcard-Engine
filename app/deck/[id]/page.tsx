"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getTodayString } from "@/lib/sm2";
import ProgressBar from "@/components/ProgressBar";

interface Deck {
  id: string;
  name: string;
  card_count: number;
  created_at: string;
}

interface Card {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  difficulty: string;
  next_review: string;
  created_at: string;
}

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
    const fetchDeckAndCards = async () => {
      setLoading(true);

      const { data: deckData, error: deckError } = await supabase
        .from("decks")
        .select("*")
        .eq("id", params.id)
        .single();

      if (deckError || !deckData) {
        setFetchError("Deck not found");
        setLoading(false);
        return;
      }

      setDeck(deckData);

      const { data: cardsData, error: cardsError } = await supabase
        .from("cards")
        .select("*")
        .eq("deck_id", params.id)
        .order("created_at", { ascending: true });

      if (cardsError) {
        console.error("Error fetching cards", cardsError);
      } else {
        setCards(cardsData || []);
      }

      setLoading(false);
    };

    fetchDeckAndCards();
  }, [params.id]);

  const handleDelete = async () => {
    if (!deck) return;
    if (confirm("Delete this deck? This cannot be undone.")) {
      setIsDeleting(true);
      const { error } = await supabase
        .from("decks")
        .delete()
        .eq("id", deck.id);
      if (!error) {
        router.push("/");
      } else {
        alert("Failed to delete deck");
        setIsDeleting(false);
      }
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <div className="skeleton-shimmer h-4 w-20 rounded" />
          </div>
        </nav>
        <div className="mx-auto max-w-5xl px-6 pt-10">
          <div className="skeleton-shimmer h-8 w-64 rounded-lg mb-3" />
          <div className="skeleton-shimmer h-4 w-40 rounded mb-8" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found ──
  if (fetchError || !deck) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
        <div className="text-center animate-fade-up">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Deck not found</h2>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-900 transition">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const today = getTodayString();
  const mastered = cards.filter((c) => c.difficulty === "mastered").length;
  const learning = cards.filter((c) => c.difficulty === "learning").length;
  const newCards = cards.filter((c) => c.difficulty === "new").length;
  const dueToday = cards.filter((c) => c.next_review <= today).length;

  const filteredCards = cards.filter((c) =>
    c.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formattedDate = new Date(deck.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Navbar ── */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
          <button
            onClick={() => router.push(`/practice/${deck.id}`)}
            disabled={dueToday === 0}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition active:scale-95 ${
              dueToday === 0
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "btn-primary"
            }`}
          >
            Practice {dueToday > 0 && `(${dueToday})`}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6">
        {/* ── Header ── */}
        <div className="pt-10 pb-8 animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {deck.name}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Created {formattedDate} · {deck.card_count} cards
          </p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete deck"}
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="border-t border-gray-200 pt-8 animate-fade-up animate-delay-100">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-widest text-gray-400">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs text-gray-400">Total</span>
              <p className="mt-1 text-xl font-semibold text-gray-900">{cards.length}</p>
            </div>
            <div className={`rounded-xl border border-gray-200 bg-white p-4 ${dueToday > 0 ? "border-amber-200" : ""}`}>
              <span className="text-xs text-gray-400">Due today</span>
              <p className={`mt-1 text-xl font-semibold ${dueToday > 0 ? "text-amber-600" : "text-gray-900"}`}>{dueToday}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs text-gray-400">Mastered</span>
              <p className="mt-1 text-xl font-semibold text-emerald-600">{mastered}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs text-gray-400">Learning</span>
              <p className="mt-1 text-xl font-semibold text-amber-500">{learning}</p>
            </div>
          </div>

          {cards.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
              <span className="mb-3 block text-xs text-gray-400">Progress</span>
              <ProgressBar
                mastered={mastered}
                learning={learning}
                newCards={newCards}
                total={cards.length}
              />
            </div>
          )}
        </div>

        {/* ── Cards List ── */}
        <div className="mt-12 border-t border-gray-200 pt-8 animate-fade-up animate-delay-200">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Flashcards
              <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                {cards.length}
              </span>
            </h2>
          </div>

          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-6 w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
          />

          {filteredCards.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">
              {cards.length === 0 ? "No cards in this deck." : "No cards match your search."}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCards.map((card) => {
                let accentColor = "border-l-gray-200";
                let badgeClass = "bg-gray-100 text-gray-500";
                let badgeText = "New";

                if (card.difficulty === "mastered") {
                  accentColor = "border-l-emerald-400";
                  badgeClass = "bg-emerald-50 text-emerald-600";
                  badgeText = "Mastered";
                } else if (card.difficulty === "learning") {
                  accentColor = "border-l-amber-400";
                  badgeClass = "bg-amber-50 text-amber-600";
                  badgeText = "Learning";
                }

                const isExpanded = expandedCard === card.id;

                return (
                  <div
                    key={card.id}
                    className={`rounded-lg border border-gray-200 border-l-[3px] bg-white p-4 transition-shadow hover:shadow-sm ${accentColor}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
                        {badgeText}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {card.next_review}
                      </span>
                    </div>

                    <h3 className="mb-2 text-sm font-medium text-gray-900 leading-relaxed">
                      {card.question}
                    </h3>

                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : card.id)}
                      className="text-xs text-gray-400 transition hover:text-gray-900"
                    >
                      {isExpanded ? "Hide answer" : "Show answer"}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-600 animate-fade-in">
                        {card.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="mt-24 border-t border-gray-200 py-8">
          <p className="text-xs text-gray-400">
            Built with Gemini AI · SM-2 Spaced Repetition · Next.js
          </p>
        </footer>
      </main>
    </div>
  );
}
