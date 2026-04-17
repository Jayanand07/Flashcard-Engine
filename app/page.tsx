"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import DeckCard from "@/components/DeckCard";
import UploadModal from "@/components/UploadModal";

interface Deck {
  id: string;
  name: string;
  card_count: number;
  created_at: string;
  stats?: {
    mastered: number;
    learning: number;
    newCards: number;
  };
}

export default function Dashboard() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDecks = async () => {
    setLoading(true);

    const { data: decksData, error: decksError } = await supabase
      .from("decks")
      .select("*")
      .order("created_at", { ascending: false });

    if (decksError) {
      console.error("Error fetching decks:", decksError);
      setLoading(false);
      return;
    }

    if (!decksData || decksData.length === 0) {
      setDecks([]);
      setLoading(false);
      return;
    }

    const { data: cardsData, error: cardsError } = await supabase
      .from("cards")
      .select("deck_id, difficulty");

    if (!cardsError && cardsData) {
      const statsMap: Record<
        string,
        { mastered: number; learning: number; newCards: number }
      > = {};

      cardsData.forEach((card) => {
        if (!statsMap[card.deck_id]) {
          statsMap[card.deck_id] = { mastered: 0, learning: 0, newCards: 0 };
        }
        if (card.difficulty === "mastered") statsMap[card.deck_id].mastered++;
        else if (card.difficulty === "learning")
          statsMap[card.deck_id].learning++;
        else statsMap[card.deck_id].newCards++;
      });

      const processedDecks = decksData.map((deck) => ({
        ...deck,
        stats: statsMap[deck.id] || {
          mastered: 0,
          learning: 0,
          newCards: deck.card_count,
        },
      }));

      setDecks(processedDecks);
    } else {
      setDecks(decksData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const filteredDecks = decks.filter((deck) =>
    deck.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚡</span>
            <span className="text-sm font-semibold tracking-tight text-gray-900">
              FlashCard Engine
            </span>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary rounded-lg px-4 py-2 text-sm"
          >
            Upload PDF
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6">
        {/* ── Hero (only when no decks) ── */}
        {decks.length === 0 && !loading && (
          <>
            <section className="pb-0 pt-24 animate-fade-up">
              <div className="max-w-2xl">
                <h1 className="text-5xl font-semibold tracking-tight text-gray-900 leading-[1.1]">
                  Transform your PDFs
                  <br />
                  into flashcards
                </h1>
                <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-lg">
                  Upload study material and let AI generate optimized flashcards.
                  Master them with spaced repetition.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="btn-primary mt-8 rounded-lg px-6 py-3 text-sm"
                >
                  Get started — upload a PDF
                </button>
              </div>
            </section>

            {/* ── How it works ── */}
            <section className="mt-24 border-t border-gray-200 pt-16 animate-fade-up animate-delay-200">
              <h2 className="mb-8 text-xs font-medium uppercase tracking-widest text-gray-400">
                How it works
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[
                  {
                    step: "01",
                    title: "Upload PDF",
                    text: "Drop any notes or textbook — we extract the content instantly.",
                  },
                  {
                    step: "02",
                    title: "AI generates cards",
                    text: "Gemini AI creates 15 high-quality flashcards from your material.",
                  },
                  {
                    step: "03",
                    title: "Practice with SM-2",
                    text: "Spaced repetition schedules reviews so you remember long-term.",
                  },
                ].map((item) => (
                  <div key={item.step} className="py-2">
                    <span className="text-xs font-medium text-gray-400">
                      {item.step}
                    </span>
                    <h3 className="mt-2 text-base font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Search ── */}
        {(decks.length > 0 || searchQuery.length > 0) && (
          <div className="pt-8 pb-2 animate-fade-up">
            <input
              type="text"
              placeholder="Search decks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-300 focus:ring-1 focus:ring-gray-200"
            />
          </div>
        )}

        {/* ── Section label ── */}
        {decks.length > 0 && !loading && (
          <div className="mt-6 mb-4 animate-fade-up animate-delay-100">
            <h2 className="text-xs font-medium uppercase tracking-widest text-gray-400">
              Your decks
            </h2>
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="skeleton-shimmer h-4 rounded w-3/4 mb-3" />
                <div className="skeleton-shimmer h-3 rounded w-1/2 mb-4" />
                <div className="skeleton-shimmer h-2 rounded w-full mb-6" />
                <div className="flex gap-3">
                  <div className="skeleton-shimmer h-9 flex-1 rounded-lg" />
                  <div className="skeleton-shimmer h-9 flex-1 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : decks.length === 0 ? (
          /* Empty state is handled by hero */
          null
        ) : filteredDecks.length === 0 ? (
          <div className="mt-16 text-center animate-fade-in">
            <p className="text-sm text-gray-500">
              No decks match &quot;{searchQuery}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDecks.map((deck, idx) => (
              <div
                key={deck.id}
                className={`animate-fade-up ${idx < 6 ? `animate-delay-${Math.min(idx + 1, 5) * 100}` : ''}`}
              >
                <DeckCard deck={deck} onDeleted={fetchDecks} />
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-24 border-t border-gray-200 py-8">
          <p className="text-xs text-gray-400">
            Built with Gemini AI · SM-2 Spaced Repetition · Next.js
          </p>
        </footer>
      </main>

      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(deckId) => {
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}
