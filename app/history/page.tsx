"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

interface Session {
  id: string;
  deck_name: string;
  cards_reviewed: number;
  easy_count: number;
  okay_count: number;
  hard_count: number;
  accuracy: number;
  completed_at: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sessions");
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-grid-pattern" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6">
        <header className="mb-10 animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Study History</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Your past practice sessions and performance</p>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No sessions yet. Start practicing to see your history here.</p>
            <Link href="/" className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, i) => {
              const date = new Date(session.completed_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              
              const accuracyColor = session.accuracy >= 80 ? "var(--success)" : session.accuracy >= 50 ? "var(--warning)" : "var(--danger)";
              const accuracyBg = session.accuracy >= 80 ? "rgba(34,197,94,0.08)" : session.accuracy >= 50 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";

              return (
                <div 
                  key={session.id} 
                  className="animate-fade-up rounded-2xl border p-5 transition-all hover:-translate-y-0.5" 
                  style={{ background: "var(--surface)", borderColor: "var(--border)", animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.deck_name}</h3>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: accuracyColor, background: accuracyBg }}>
                        {session.accuracy}% Accuracy
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--text-secondary)" }}>Reviewed</span>
                      <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.cards_reviewed}</span>
                    </div>
                    
                    <div className="h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
                    
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--danger)" }}>Hard</span>
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.hard_count}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--warning)" }}>Okay</span>
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.okay_count}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--success)" }}>Easy</span>
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.easy_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
