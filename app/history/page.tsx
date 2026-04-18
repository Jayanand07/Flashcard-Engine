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

interface QuizSession {
  id: string;
  deck_id: string;
  deck_name: string;
  score: number;
  total_questions: number;
  accuracy: number;
  completed_at: string;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"practice" | "quiz">("practice");

  useEffect(() => {
    (async () => {
      try {
        const [practiceRes, quizRes] = await Promise.all([
          fetch("/api/sessions"),
          fetch("/api/quiz-sessions")
        ]);
        
        if (practiceRes.ok) setSessions(await practiceRes.json());
        if (quizRes.ok) setQuizSessions(await quizRes.json());
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
        <header className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Study History</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Track your progress across practice sessions and quizzes</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 rounded-2xl w-fit animate-fade-up" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <button 
            onClick={() => setActiveTab("practice")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "practice" ? "shadow-sm" : ""}`}
            style={{ 
              background: activeTab === "practice" ? "var(--surface)" : "transparent",
              color: activeTab === "practice" ? "var(--accent)" : "var(--text-secondary)"
            }}
          >
            Practice Sessions
          </button>
          <button 
            onClick={() => setActiveTab("quiz")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "quiz" ? "shadow-sm" : ""}`}
            style={{ 
              background: activeTab === "quiz" ? "var(--surface)" : "transparent",
              color: activeTab === "quiz" ? "var(--accent)" : "var(--text-secondary)"
            }}
          >
            Quiz Sessions
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : activeTab === "practice" ? (
          /* Practice Sessions List */
          sessions.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No practice sessions yet.</p>
              <Link href="/" className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>
                Start Practicing
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session, i) => {
                const date = new Date(session.completed_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                });
                const accuracyColor = session.accuracy >= 80 ? "var(--success)" : session.accuracy >= 50 ? "var(--warning)" : "var(--danger)";
                const accuracyBg = session.accuracy >= 80 ? "rgba(34,197,94,0.08)" : session.accuracy >= 50 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
                return (
                  <div key={session.id} className="animate-fade-up rounded-2xl border p-5 transition-all hover:-translate-y-0.5" 
                    style={{ background: "var(--surface)", borderColor: "var(--border)", animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.deck_name}</h3>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{date}</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: accuracyColor, background: accuracyBg }}>
                        {session.accuracy}% Accuracy
                      </span>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--text-secondary)" }}>Reviewed</span>
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.cards_reviewed}</span>
                      </div>
                      <div className="h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
                      <div className="flex gap-4">
                        {["Hard", "Okay", "Easy"].map((label, idx) => {
                          const count = idx === 0 ? session.hard_count : idx === 1 ? session.okay_count : session.easy_count;
                          const color = idx === 0 ? "var(--danger)" : idx === 1 ? "var(--warning)" : "var(--success)";
                          return (
                            <div key={label} className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>{label}</span>
                              <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Quiz Sessions List */
          quizSessions.length === 0 ? (
            <div className="rounded-2xl border p-12 text-center animate-fade-up" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No quiz sessions yet.</p>
              <Link href="/" className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-colors" style={{ backgroundColor: "var(--accent)" }}>
                Take a Quiz
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {quizSessions.map((session, i) => {
                const date = new Date(session.completed_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                });
                const accuracyColor = session.accuracy >= 80 ? "var(--success)" : session.accuracy >= 50 ? "var(--warning)" : "var(--danger)";
                const accuracyBg = session.accuracy >= 80 ? "rgba(34,197,94,0.08)" : session.accuracy >= 50 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
                return (
                  <div key={session.id} className="animate-fade-up rounded-2xl border p-5 transition-all hover:-translate-y-0.5" 
                    style={{ background: "var(--surface)", borderColor: "var(--border)", animationDelay: `${i * 50}ms` }}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.deck_name}</h3>
                        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{date}</p>
                      </div>
                      <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ color: accuracyColor, background: accuracyBg }}>
                        {session.accuracy}% Accuracy
                      </span>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--text-secondary)" }}>Score</span>
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{session.score} / {session.total_questions}</span>
                      </div>
                      <div className="h-8 w-px" style={{ backgroundColor: "var(--border)" }} />
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--accent)" }}>Status</span>
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{session.accuracy >= 50 ? "Passed" : "Needs Review"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
}
