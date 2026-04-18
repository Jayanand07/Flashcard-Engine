"use client";
import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface DeckCardProps {
  deck: {
    id: string; name: string; card_count: number; created_at: string;
    stats?: { mastered: number; learning: number; newCards: number };
    dueToday?: number;
  };
  onDeleted: () => void;
}

function Ring({ mastered, total }: { mastered: number; total: number }) {
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const size = 64; const stroke = 5; const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          stroke="url(#ring-grad)" className="transition-all duration-700" />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color: "var(--text)" }}>{pct}%</span>
    </div>
  );
}

export default function DeckCard({ deck, onDeleted }: DeckCardProps) {
  const [deleting, setDeleting] = useState(false);
  const stats = deck.stats || { mastered: 0, learning: 0, newCards: deck.card_count };
  const due = deck.dueToday ?? 0;
  const date = new Date(deck.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleDelete = async () => {
    if (!confirm("Delete this deck?")) return;
    setDeleting(true);
    const { error } = await supabase.from("decks").delete().eq("id", deck.id);
    if (!error) onDeleted(); else { alert("Failed"); setDeleting(false); }
  };

  let badge = { text: "📚 Never studied", color: "var(--text-muted)", bg: "var(--surface-2)" };
  if (stats.mastered > 0 || stats.learning > 0) {
    badge = due > 0
      ? { text: `🔴 ${due} due today`, color: "var(--danger)", bg: "rgba(239,68,68,0.08)" }
      : { text: "✅ All caught up!", color: "var(--success)", bg: "rgba(34,197,94,0.08)" };
  }

  return (
    <div className="group relative flex flex-col rounded-[20px] p-6 transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-br from-white to-gray-50/50 dark:from-[#1a1a24] dark:to-[#16161e]"
      style={{ border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(124,106,247,0.2)"; e.currentTarget.style.borderColor = "#a78bfa"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "var(--border)"; }}>

      {/* Delete */}
      <button onClick={handleDelete} disabled={deleting}
        className="absolute right-4 top-4 rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100"
        style={{ color: "var(--danger)" }}
        onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>

      {/* Top row */}
      <div className="flex items-start justify-between gap-4 pr-6">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold tracking-tight" style={{ color: "var(--text)" }}>{deck.name}</h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{deck.card_count} cards · {date}</p>
        </div>
        <Ring mastered={stats.mastered} total={deck.card_count} />
      </div>

      {/* Badge */}
      <span className="mt-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{ color: badge.color, background: badge.bg }}>
        {badge.text}
      </span>

      {/* Stats */}
      <div className="mt-3 flex gap-3 text-xs font-medium">
        <span style={{ color: "var(--success)" }}>{stats.mastered} mastered</span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span style={{ color: "var(--warning)" }}>{stats.learning} learning</span>
        <span style={{ color: "var(--text-muted)" }}>·</span>
        <span style={{ color: "var(--text-muted)" }}>{stats.newCards} new</span>
      </div>

      {/* Actions */}
      <Link href={`/practice/${deck.id}`}
        className="mt-5 flex items-center justify-center rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700">
        Start Practice{due > 0 ? ` (${due} due)` : ""}
      </Link>
      <Link href={`/deck/${deck.id}`} className="mt-2 block text-center text-xs font-medium transition-colors" style={{ color: "var(--text-muted)" }}>
        View all cards →
      </Link>
    </div>
  );
}
