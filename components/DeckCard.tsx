"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface DeckCardProps {
  deck: {
    id: string;
    name: string;
    card_count: number;
    created_at: string;
    stats?: { mastered: number; learning: number; newCards: number };
    dueToday?: number;
  };
  onDeleted: () => void;
}

function CircularProgress({ mastered, learning, total }: { mastered: number; learning: number; total: number }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  const mp = total > 0 ? mastered / total : 0;
  const lp = total > 0 ? learning / total : 0;
  const pct = Math.round((mp + lp * 0.5) * 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--warning)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - (mp + lp))} strokeLinecap="round"
          className="transition-all duration-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--success)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - mp)} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color: "var(--text-primary)" }}>{pct}%</span>
    </div>
  );
}

export default function DeckCard({ deck, onDeleted }: DeckCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const stats = deck.stats || { mastered: 0, learning: 0, newCards: deck.card_count };
  const due = deck.dueToday ?? 0;

  const formattedDate = new Date(deck.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });

  const handleDelete = async () => {
    if (confirm("Delete this deck? This cannot be undone.")) {
      setIsDeleting(true);
      const { error } = await supabase.from("decks").delete().eq("id", deck.id);
      if (!error) onDeleted();
      else { alert("Failed to delete deck"); setIsDeleting(false); }
    }
  };

  // Smart label
  let statusLabel = "";
  let statusColor = "";
  if (deck.card_count > 0 && stats.mastered === 0 && stats.learning === 0) {
    statusLabel = "🆕 Never studied";
    statusColor = "var(--text-secondary)";
  } else if (due > 0) {
    statusLabel = `🔥 ${due} due today`;
    statusColor = "var(--warning)";
  } else {
    statusLabel = "✅ All caught up!";
    statusColor = "var(--success)";
  }

  return (
    <div className="card-surface group relative flex flex-col p-5">
      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute right-3 top-3 rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10"
        style={{ color: "var(--danger)" }}
        aria-label="Delete deck"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 truncate text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {deck.name}
          </h3>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {deck.card_count} cards · {formattedDate}
          </p>
        </div>
        <CircularProgress mastered={stats.mastered} learning={stats.learning} total={deck.card_count} />
      </div>

      {/* Status label */}
      <p className="mt-3 text-xs font-medium" style={{ color: statusColor }}>
        {statusLabel}
      </p>

      {/* Stats row */}
      <div className="mt-3 flex gap-4 text-xs font-semibold">
        <span className="text-emerald-500">{stats.mastered} mastered</span>
        <span className="text-amber-400">{stats.learning} learning</span>
        <span style={{ color: "var(--text-secondary)" }}>{stats.newCards} new</span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2">
        <Link
          href={`/practice/${deck.id}`}
          className="btn-accent flex items-center justify-center gap-2 py-2.5 text-center text-sm"
        >
          Practice{due > 0 ? ` (${due} due)` : ""}
        </Link>
        <Link
          href={`/deck/${deck.id}`}
          className="text-center text-xs font-medium transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          View all cards →
        </Link>
      </div>
    </div>
  );
}
