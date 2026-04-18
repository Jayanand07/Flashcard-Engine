"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import confetti from "canvas-confetti";

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

interface QuizResult {
  question: string;
  user_answer: number;
  correct_answer: number;
  explanation: string;
  is_correct: boolean;
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const deckId = params.id;
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [expandedResult, setExpandedResult] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [mcqRes, deckRes] = await Promise.all([
          fetch(`/api/mcq?deck_id=${deckId}`),
          (await import("@/lib/supabase")).supabase.from("decks").select("name").eq("id", deckId).single()
        ]);
        
        if (mcqRes.ok) {
          const data = await mcqRes.json();
          setMcqs(data);
        }
        if (deckRes.data) setDeckName(deckRes.data.name);
      } catch (err) {
        console.error("Failed to fetch quiz data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [deckId]);

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    
    const isCorrect = index === mcqs[currentIndex].correct_index;
    if (isCorrect) setScore(s => s + 1);
    
    setResults(prev => [...prev, {
      question: mcqs[currentIndex].question,
      user_answer: index,
      correct_answer: mcqs[currentIndex].correct_index,
      explanation: mcqs[currentIndex].explanation,
      is_correct: isCorrect
    }]);
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 < mcqs.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setShowCompletion(true);
      // Save stats to DB
      const accuracy = Math.round(((score + (selectedOption === mcqs[currentIndex].correct_index ? 1 : 0)) / mcqs.length) * 100);
      try {
        await fetch("/api/quiz-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deck_id: deckId,
            deck_name: deckName,
            score: score + (selectedOption === mcqs[currentIndex].correct_index ? 1 : 0),
            total_questions: mcqs.length,
            accuracy: accuracy
          })
        });
      } catch (err) {
        console.error("Failed to save quiz session:", err);
      }
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <div className="mx-auto mt-20 w-full max-w-2xl px-6">
        <div className="skeleton-shimmer h-4 w-24 rounded mb-6" />
        <div className="skeleton-shimmer h-12 w-full rounded-xl mb-10" />
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-shimmer h-16 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  if (mcqs.length === 0) return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-center">
        <p style={{ color: "var(--text-secondary)" }}>No quiz available for this deck.</p>
        <Link href={`/deck/${deckId}`} className="mt-4 inline-block text-sm font-bold" style={{ color: "var(--accent)" }}>← Back to Deck</Link>
      </div>
    </div>
  );

  if (showCompletion) {
    const accuracy = Math.round((score / mcqs.length) * 100);
    const feedback = accuracy >= 80 ? { text: "Excellent! 🏆", color: "var(--success)" } : 
                     accuracy >= 50 ? { text: "Good job! 👍", color: "var(--warning)" } : 
                     { text: "Keep practicing! 💪", color: "var(--danger)" };

    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: "var(--bg)" }}>
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 pt-12 animate-fade-up">
          <div className="rounded-[32px] p-10 text-center relative overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: feedback.color }} />
            <h2 className="text-4xl font-black mb-2" style={{ color: "var(--text-primary)" }}>{score} / {mcqs.length}</h2>
            <p className="text-xl font-bold mb-6" style={{ color: feedback.color }}>{feedback.text}</p>
            <div className="flex justify-center gap-8 text-sm mb-8">
              <div>
                <p style={{ color: "var(--text-secondary)" }}>Accuracy</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{accuracy}%</p>
              </div>
              <div>
                <p style={{ color: "var(--text-secondary)" }}>Questions</p>
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{mcqs.length}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => window.location.reload()} className="flex-1 rounded-xl py-3.5 text-sm font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>Try Again</button>
              <button onClick={() => router.push(`/deck/${deckId}`)} className="flex-1 rounded-xl py-3.5 text-sm font-bold" style={{ background: "var(--surface-2)", color: "var(--text-primary)" }}>Back to Deck</button>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6" style={{ color: "var(--text-secondary)" }}>Review Your Answers</h3>
            <div className="space-y-4">
              {results.map((res, i) => (
                <div key={i} className="rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <button 
                    onClick={() => setExpandedResult(expandedResult === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${res.is_correct ? "bg-green-500" : "bg-red-500"}`}>
                        {res.is_correct ? "✓" : "✕"}
                      </span>
                      <span className="text-sm font-semibold line-clamp-1" style={{ color: "var(--text-primary)" }}>{res.question}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{expandedResult === i ? "↑" : "↓"}</span>
                  </button>
                  {expandedResult === i && (
                    <div className="px-5 pb-6 animate-fade-in border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <p className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>{res.question}</p>
                      <div className="space-y-3 mb-4">
                        <div className={`rounded-xl p-3 text-sm border ${res.user_answer === res.correct_answer ? "bg-green-50 dark:bg-green-900/10 border-green-200" : "bg-red-50 dark:bg-red-900/10 border-red-200"}`}>
                          <span className="font-bold mr-2">Your answer:</span> {mcqs[i].options[res.user_answer]}
                        </div>
                        {!res.is_correct && (
                          <div className="rounded-xl p-3 text-sm bg-green-50 dark:bg-green-900/10 border border-green-200">
                             <span className="font-bold mr-2">Correct answer:</span> {mcqs[i].options[res.correct_answer]}
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}>
                        <strong className="block mb-1 text-primary" style={{ color: "var(--text-primary)" }}>💡 Explanation:</strong>
                        {res.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const progress = ((currentIndex + 1) / mcqs.length) * 100;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      {/* Top bar */}
      <div className="border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(`/deck/${deckId}`)} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>Exit
          </button>
          <div className="flex-1 px-8">
            <div className="h-1.5 w-full rounded-full" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--accent)" }} />
            </div>
          </div>
          <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>Q {currentIndex + 1} / {mcqs.length}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-full animate-fade-up" key={currentIndex}>
          <div className="text-center mb-10">
            <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4" style={{ background: "var(--surface-2)", color: "var(--accent)" }}>Question {currentIndex + 1}</span>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{currentMCQ.question}</h2>
          </div>

          <div className="grid gap-3 w-full">
            {currentMCQ.options.map((option, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = i === currentMCQ.correct_index;
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={i}
                  disabled={showFeedback}
                  onClick={() => handleOptionSelect(i)}
                  className={`w-full flex items-center gap-4 rounded-2xl p-5 text-left text-sm font-medium border transition-all ${!showFeedback ? "hover:scale-[1.01] hover:border-violet-400" : ""}`}
                  style={{
                    background: showCorrect ? "#dcfce7" : showWrong ? "#fee2e2" : "var(--surface)",
                    borderColor: showCorrect ? "#22c55e" : showWrong ? "#ef4444" : "var(--border)",
                    color: (showCorrect || showWrong) ? "#0a0a0f" : "var(--text-primary)"
                  }}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold border transition-colors ${isSelected ? "bg-violet-600 text-white border-violet-600" : "border-gray-200"}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showCorrect && <span className="text-green-600 font-bold">✓ Correct!</span>}
                  {showWrong && <span className="text-red-600 font-bold">✕ Wrong</span>}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className="mt-8 animate-fade-up">
              <div className={`rounded-2xl p-6 border ${selectedOption === currentMCQ.correct_index ? "border-green-200 bg-green-50 dark:bg-green-900/10" : "border-red-200 bg-red-50 dark:bg-red-900/10"}`}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: selectedOption === currentMCQ.correct_index ? "#166534" : "#991b1b" }}>💡 Explanation</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{currentMCQ.explanation}</p>
              </div>
              <button onClick={nextQuestion} className="mt-6 w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]" style={{ backgroundColor: "var(--accent)" }}>
                {currentIndex + 1 === mcqs.length ? "Finish Quiz" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
