"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import DeckCard from "@/components/DeckCard";
import UploadModal from "@/components/UploadModal";
import Skeleton from "@/components/ui/Skeleton";
import { useDecks } from "@/hooks/useDecks";
import { APP_DESCRIPTION } from "@/lib/constants";

export default function Dashboard() {
  const { 
    decks, 
    loading, 
    error, 
    totalDueCount, 
    mostDueDeck, 
    refetch 
  } = useDecks();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState('recent');
  const router = useRouter();

  // Stats for the grid
  const stats = useMemo(() => {
    const totalCards = decks.reduce((a, d) => a + (d.card_count || 0), 0);
    const totalMastered = decks.reduce((a, d) => a + (d.stats?.mastered ?? 0), 0);
    return [
      { label: "Decks", value: decks.length, color: "#7c6af7" },
      { label: "Mastered", value: totalMastered, color: "#22c55e" },
      { label: "Due Today", value: totalDueCount, color: "#f59e0b" },
      { label: "Total Cards", value: totalCards, color: "#3b82f6" },
    ];
  }, [decks, totalDueCount]);

  const filteredAndSortedDecks = useMemo(() => {
    const filtered = decks.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        if (!a.last_studied && !b.last_studied) return 0;
        if (!a.last_studied) return 1;
        if (!b.last_studied) return -1;
        return new Date(b.last_studied).getTime() - new Date(a.last_studied).getTime();
      });
    } else if (sortBy === 'due') {
      filtered.sort((a, b) => (b.due_today ?? 0) - (a.due_today ?? 0));
    } else if (sortBy === 'alpha') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return filtered;
  }, [decks, searchQuery, sortBy]);

  const handlePracticeMostDue = useCallback(() => {
    if (mostDueDeck) {
      router.push(`/practice/${mostDueDeck.id}`);
    }
  }, [mostDueDeck, router]);

  const isEmpty = decks.length === 0;

  return (
    <div className="min-h-screen bg-grid-pattern" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar onUploadClick={() => setShowUploadModal(true)} />

      {/* Floating orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-40 -left-40 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(124,106,247,0.1)", animationDuration: "5s" }}/>
        <div className="absolute -bottom-40 -right-40 w-48 h-48 sm:w-96 sm:h-96 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(168,85,247,0.1)", animationDuration: "7s", animationDelay: "2s" }}/>
      </div>

      <main className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6" style={{ zIndex: 10 }}>
        {error ? (
          <div className="flex justify-center pt-20">
             <div className="w-full max-w-md rounded-2xl border bg-surface p-8 text-center" style={{ border: "1px solid var(--danger)" }}>
                <p className="text-sm font-bold text-danger">{error}</p>
                <button onClick={() => refetch()} className="mt-4 rounded-xl bg-accent px-6 py-2 text-sm font-bold text-white">Retry</button>
             </div>
          </div>
        ) : loading && isEmpty ? (
          <div className="pt-20">
            <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <Skeleton w="140px" h="32px" className="mb-3" />
                <Skeleton w="280px" h="18px" />
              </div>
              <div className="flex gap-2">
                <Skeleton w="120px" h="44px" r="12px" />
                <Skeleton w="120px" h="44px" r="12px" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1,2,3,4].map(i => <Skeleton key={i} h="100px" r="24px" />)}
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3,6].map(i => <Skeleton key={i} h="320px" r="24px" />)}
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 text-center sm:py-32">
            {/* Animated Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-bold text-accent">
               <span className="h-2 w-2 rounded-full bg-accent animate-pulse-slow" />
               Powered by Gemini 1.5 Flash + SM-2 Algorithm
            </div>

            {/* Title */}
            <h1 className="mb-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-primary sm:text-7xl lg:text-8xl">
              Turn any PDF into <br/>
              <span className="bg-gradient-to-br from-[#7c6af7] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
                a learning machine
              </span>
            </h1>

            {/* Description */}
            <p className="mb-12 max-w-lg text-lg font-medium leading-relaxed text-secondary sm:text-xl">
              Upload study material. AI generates 50 smart flashcards. <br className="hidden sm:block"/>
              Spaced repetition makes them stick forever.
            </p>

            {/* Feature Pills */}
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              {['🧠 AI Generated', '📊 SM-2 Algorithm', '🎯 MCQ Quiz Mode', '🔄 10x Regeneration', '📈 Progress Tracking'].map(pill => (
                <span key={pill} className="rounded-full border bg-surface-2 px-4 py-2 text-xs font-bold tracking-tight text-secondary">
                  {pill}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
               onClick={() => setShowUploadModal(true)}
               className="rounded-2xl bg-gradient-to-br from-[#7c6af7] to-[#a855f7] px-10 py-5 text-lg font-black text-white shadow-2xl shadow-accent/40 transition-all hover:-translate-y-1 hover:shadow-accent/60 active:scale-95"
            >
               Generate Flashcards from PDF →
            </button>
          </div>
        ) : (
          <div className="pt-8 sm:pt-16">
            {/* Greeting */}
            <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-primary sm:text-5xl">Dashboard</h1>
                <p className="mt-2 text-sm font-semibold text-secondary opacity-70 uppercase tracking-widest">{APP_DESCRIPTION}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex overflow-hidden rounded-xl border bg-surface" style={{ borderColor: 'var(--border)' }}>
                  <input 
                     placeholder="Search decks..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="bg-transparent px-4 py-2 text-sm outline-none w-[180px] sm:w-[240px]"
                  />
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border bg-surface px-4 py-2 text-sm font-bold outline-none ring-accent transition-all focus:ring-2"
                  style={{ borderColor: 'var(--border)' }}>
                  <option value="recent">Recent</option>
                  <option value="due">Due Count</option>
                  <option value="alpha">A-Z</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="stat-card-shimmer flex flex-col rounded-2xl border bg-surface p-6 shadow-sm transition-transform hover:-translate-y-0.5">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                   <span className="mt-1 text-3xl font-black tabular-nums" style={{ color: "var(--text-primary)" }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Special Banner if cards are due */}
            {totalDueCount > 0 && (
              <div className="mb-12 flex flex-col items-center justify-between gap-6 rounded-[24px] border border-orange-200 bg-orange-50/50 p-6 sm:flex-row sm:p-8 dark:border-orange-900/30 dark:bg-orange-950/20">
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-3xl dark:bg-orange-900/40">⏳</div>
                  <div>
                    <h3 className="text-xl font-black text-primary">You have {totalDueCount} cards due today!</h3>
                    <p className="mt-1 text-sm font-medium text-secondary">Keep your learning streak alive in <strong className="text-primary">{mostDueDeck?.name}</strong>.</p>
                  </div>
                </div>
                <button onClick={handlePracticeMostDue}
                  className="w-full shrink-0 rounded-2xl bg-orange-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-orange-600/20 transition-all hover:-translate-y-1 hover:shadow-orange-600/30 active:scale-95 sm:w-auto">
                  Practice Now →
                </button>
              </div>
            )}

            {/* Decks Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedDecks.map((deck) => (
                <div className="animate-fade-up" key={deck.id}>
                  <DeckCard deck={deck} onDeleted={refetch} />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showUploadModal && (
        <UploadModal 
          isOpen={showUploadModal} 
          onClose={() => setShowUploadModal(false)} 
          onSuccess={() => { setShowUploadModal(false); refetch(); }} 
        />
      )}
    </div>
  );
}
