"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Deck } from "@/lib/types";
import { SUPABASE_TABLES, DIFFICULTY_COLORS } from "@/lib/constants";

interface DeckCardProps {
  deck: Deck;
  onDeleted: () => void;
}

const Ring = React.memo(({ mastered, total }: { mastered: number; total: number }) => {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const size = 60; 
  const stroke = 5; 
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black" style={{ color: "var(--text-primary)" }}>{pct}%</span>
    </div>
  );
});

Ring.displayName = "Ring";

const DeckCard = ({ deck, onDeleted }: DeckCardProps) => {
  const [deleting, setDeleting] = useState(false);
  const stats = deck.stats || { mastered: 0, learning: 0, newCards: deck.card_count };
  const due = deck.due_today ?? 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this deck?")) return;
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from(SUPABASE_TABLES.DECKS).delete().eq("id", deck.id);
      if (error) throw error;
      onDeleted();
    } catch (err) {
      console.error("[DeckCard/handleDelete]", err);
      alert("Failed to delete deck");
      setDeleting(false);
    }
  };

  const getLastStudied = (dateStr?: string | null) => {
    if (!dateStr) return 'New';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffHours < 24) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  const isDue = due > 0;

  return (
    <div className="linear-card group h-full">
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(90deg, #7c6af7, #a855f7)" }} />

      <div className="flex flex-col p-6 h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{deck.name}</h3>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              <span>{deck.card_count} cards</span>
              <span>•</span>
              <span>{getLastStudied(deck.last_studied)}</span>
            </div>
          </div>
          <Ring mastered={stats.mastered} total={deck.card_count} />
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center gap-2">
           {isDue ? (
             <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" 
               style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)" }}>
               <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
               {due} Due Today
             </span>
           ) : (
             <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider" 
               style={{ background: "rgba(34,197,94,0.1)", color: "var(--success)" }}>
               ✓ All caught up
             </span>
           )}
        </div>

        {/* Small Breakdown */}
        <div className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{stats.mastered}</span>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: DIFFICULTY_COLORS.mastered }}>Mastered</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{stats.learning}</span>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: DIFFICULTY_COLORS.learning }}>Learning</span>
            </div>
          </div>

          <button onClick={handleDelete} disabled={deleting}
            className="rounded-lg p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-6 grid grid-cols-2 gap-3">
          <Link href={`/practice/${deck.id}`}
            className="flex h-11 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ backgroundColor: "var(--accent)" }}>
            Practice
          </Link>
          <Link href={`/quiz/${deck.id}`}
            className="flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition-all hover:bg-surface-2 active:scale-[0.97]"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            Quiz
          </Link>
        </div>
        
        <Link href={`/deck/${deck.id}`} className="mt-3 text-center text-[11px] font-bold text-gray-400 transition-colors hover:text-accent">
          Manage deck cards →
        </Link>
      </div>
    </div>
  );
};

export default React.memo(DeckCard);
