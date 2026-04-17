import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProgressBar from "./ProgressBar";

interface DeckCardProps {
  deck: {
    id: string;
    name: string;
    card_count: number;
    created_at: string;
    stats?: {
      mastered: number;
      learning: number;
      newCards: number;
    };
  };
  onDeleted: () => void;
}

export default function DeckCard({ deck, onDeleted }: DeckCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formattedDate = new Date(deck.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleDelete = async () => {
    if (confirm("Delete this deck? This cannot be undone.")) {
      setIsDeleting(true);
      const { error } = await supabase.from("decks").delete().eq("id", deck.id);
      if (!error) {
        onDeleted();
      } else {
        alert("Failed to delete deck");
        setIsDeleting(false);
      }
    }
  };

  const stats = deck.stats || {
    mastered: 0,
    learning: 0,
    newCards: deck.card_count,
  };

  return (
    <div className="group relative flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 transition-shadow duration-150 hover:shadow-md">
      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-3 top-3 rounded-md p-1.5 text-gray-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-50"
        aria-label="Delete Deck"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>

      {/* Title */}
      <h3 className="mb-1 line-clamp-2 pr-6 text-sm font-semibold text-gray-900">
        {deck.name}
      </h3>

      {/* Meta */}
      <p className="mb-4 text-xs text-gray-400">
        {formattedDate} · {deck.card_count} cards
      </p>

      {/* Progress */}
      <div className="flex-grow">
        <ProgressBar
          mastered={stats.mastered}
          learning={stats.learning}
          newCards={stats.newCards}
          total={deck.card_count}
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-2">
        <Link
          href={`/practice/${deck.id}`}
          className="btn-primary flex-1 rounded-lg py-2 text-center text-xs"
        >
          Practice
        </Link>
        <Link
          href={`/deck/${deck.id}`}
          className="btn-secondary flex-1 rounded-lg py-2 text-center text-xs"
        >
          View Cards
        </Link>
      </div>
    </div>
  );
}
