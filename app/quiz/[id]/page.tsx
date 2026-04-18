"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import { useMCQs } from "@/hooks/useMCQs";
import { useDecks } from "@/hooks/useDecks";

interface QuizResult {
  question: string;
  user_answer: number;
  correct_answer: number;
  explanation: string;
  is_correct: boolean;
}

const ScoreRing = ({ accuracy }: { accuracy: number }) => {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - accuracy/100);
  const color = accuracy >= 80 ? "#22c55e" : accuracy >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-black">{accuracy}%</span>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Accuracy</span>
      </div>
    </div>
  );
};

export default function QuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const deckId = params.id;
  const { mcqs, loading: mcqsLoading, error: mcqsError, refetch: fetchMCQs } = useMCQs(deckId);
  const { decks } = useDecks();
  const deck = useMemo(() => decks.find(d => d.id === deckId), [decks, deckId]);
  const deckName = deck?.name || "Quiz";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(() => {
        // Just checking session
    });
  }, [supabase]);

  const handleOptionSelect = useCallback((index: number) => {
    if (showFeedback || !mcqs[currentIndex]) return;
    setSelectedOption(index);
    setShowFeedback(true);
    
    const isCorrect = index === mcqs[currentIndex].correct_index;
    if (isCorrect) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
    
    setResults(prev => [...prev, {
      question: mcqs[currentIndex].question,
      user_answer: index,
      correct_answer: mcqs[currentIndex].correct_index,
      explanation: mcqs[currentIndex].explanation,
      is_correct: isCorrect
    }]);
  }, [mcqs, currentIndex, showFeedback]);

  const nextQuestion = useCallback(async () => {
    if (currentIndex + 1 < mcqs.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setShowCompletion(true);
      const finalScore = results.filter(r => r.is_correct).length;
      const total = mcqs.length;
      const accuracyValue = total > 0 ? Math.round((finalScore / total) * 100) : 0;
      
      try {
        await fetch("/api/quiz-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deck_id: deckId,
            deck_name: deckName,
            score: finalScore,
            total_questions: total,
            accuracy: accuracyValue
          })
        });
        router.refresh();
      } catch {
        // Silently fail or handle error if needed
      }
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  }, [currentIndex, mcqs, results, deckId, deckName, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!showFeedback && !showCompletion) {
        if (e.key === '1' && mcqs[currentIndex]?.options.length >= 1) handleOptionSelect(0);
        if (e.key === '2' && mcqs[currentIndex]?.options.length >= 2) handleOptionSelect(1);
        if (e.key === '3' && mcqs[currentIndex]?.options.length >= 3) handleOptionSelect(2);
        if (e.key === '4' && mcqs[currentIndex]?.options.length >= 4) handleOptionSelect(3);
      } else if (showFeedback && !showCompletion) {
        if (e.code === 'Space' || e.key === 'Enter') {
          e.preventDefault();
          nextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showFeedback, showCompletion, currentIndex, mcqs, handleOptionSelect, nextQuestion]);

  if (mcqsLoading) return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <div className="mx-auto mt-12 w-full max-w-3xl px-6">
        <Skeleton h="8px" r="999px" className="mb-12" />
        <Skeleton h="280px" r="32px" className="mb-8" />
        <div className="grid gap-4">
           {[1,2,3,4].map(i => <Skeleton key={i} h="64px" r="20px" />)}
        </div>
      </div>
    </div>
  );

  if (mcqsError) return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "var(--bg)" }}>
       <Navbar />
       <div className="mx-auto mt-20 text-center">
          <p className="font-bold text-danger">Failed to load quiz.</p>
          <button onClick={() => fetchMCQs()} className="mt-4 rounded-xl bg-accent px-6 py-2 text-sm font-bold text-white">Retry</button>
       </div>
    </div>
  );

  if (showCompletion) {
    const total = mcqs.length;
    const finalScore = results.filter(r => r.is_correct).length;
    const accuracy = total > 0 ? Math.round((finalScore / total) * 100) : 0;
    const feedbackText = accuracy >= 80 ? { text: "Excellent! 🏆", color: "#22c55e" } : 
                         accuracy >= 50 ? { text: "Good job! 👍", color: "#f59e0b" } : 
                         { text: "Keep at it! 💪", color: "#ef4444" };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#7c6af7] to-[#a855f7] text-white">
        <Navbar />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="flex flex-col items-center text-center">
            <ScoreRing accuracy={accuracy} />
            <h2 className="mt-8 text-4xl font-black">{finalScore} / {total}</h2>
            <p className="mt-2 text-xl font-bold" style={{ color: feedbackText.color }}>{feedbackText.text}</p>
            
            <div className="mt-12 flex w-full max-w-md gap-4">
              <button onClick={() => window.location.reload()} className="flex-1 rounded-2xl bg-white py-4 text-sm font-black text-accent transition-all hover:scale-[1.02] active:scale-[0.98]">
                Try Again
              </button>
              <button onClick={() => router.push("/")} className="flex-1 rounded-2xl bg-white/10 py-4 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/20">
                Dashboard
              </button>
            </div>
          </div>

          <div className="mt-20">
            <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em] opacity-60">Review Your Answers</h3>
            <div className="grid gap-3">
              {results.map((res, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                  <button onClick={() => setExpandedResult(expandedResult === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left">
                    <div className="flex items-center gap-4">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white ${res.is_correct ? "bg-green-500" : "bg-red-500"}`}>
                        {res.is_correct ? "✓" : "✕"}
                      </span>
                      <span className="text-sm font-bold line-clamp-1">{res.question}</span>
                    </div>
                    <span className="text-xs opacity-40">{expandedResult === i ? "↑" : "↓"}</span>
                  </button>
                  {expandedResult === i && (
                    <div className="border-t border-white/10 px-5 pb-6 pt-4 animate-fade-in">
                      <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-3">Explanation</p>
                      <p className="text-sm leading-relaxed opacity-80">{res.explanation}</p>
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

  const progressValue = mcqs.length > 0 ? ((currentIndex + (showFeedback ? 1 : 0)) / mcqs.length) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-grid-pattern" style={{ backgroundColor: "var(--bg)" }}>
      {/* Progress Bar Top */}
      <div className="border-b bg-surface/50 backdrop-blur-md sticky top-0 z-40" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-4xl items-center gap-8 px-6 py-4">
           <button onClick={() => router.push("/")} className="shrink-0 text-[11px] font-black uppercase tracking-widest text-secondary hover:text-primary">Exit</button>
           <div className="relative flex-1">
              <div className="h-2 w-full rounded-full bg-surface-2">
                 <div className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                   style={{ width: `${progressValue}%`, background: "linear-gradient(90deg, #7c6af7, #a855f7)" }} />
              </div>
              <span className="absolute -top-6 right-0 text-[10px] font-black text-accent">{Math.round(progressValue)}% Complete</span>
           </div>
           <span className="shrink-0 text-[11px] font-black tabular-nums text-primary">{currentIndex + 1} / {mcqs.length}</span>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-12">
        {mcqs.length > 0 ? (
          <div className="w-full animate-fade-up" key={currentIndex}>
            {/* Question Card */}
            <div className="mb-12 text-center">
              <span className="inline-flex rounded-full bg-accent/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent mb-6">Question {currentIndex + 1}</span>
              <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl" style={{ color: "var(--text-primary)" }}>{mcqs[currentIndex].question}</h2>
            </div>

            {/* Options */}
            <div className="grid gap-3 w-full">
              {mcqs[currentIndex].options.map((opt, i) => {
                 const isSelected = selectedOption === i;
                 const isCorrectFlag = i === mcqs[currentIndex].correct_index;
                 const statusValue = showFeedback 
                    ? (isCorrectFlag ? "correct" : (isSelected ? "wrong" : "idle"))
                    : "idle";
                 
                 return (
                   <button key={i} disabled={showFeedback} onClick={() => handleOptionSelect(i)}
                     className={`group relative flex h-[64px] w-full items-center gap-4 rounded-2xl border-2 px-6 text-left transition-all ${statusValue === 'idle' ? 'hover:translate-x-1 hover:border-accent active:scale-[0.99]' : ''}`}
                     style={{
                        backgroundColor: statusValue === 'correct' ? '#dcfce7' : statusValue === 'wrong' ? '#fee2e2' : 'var(--surface)',
                        borderColor: statusValue === 'correct' ? '#22c55e' : statusValue === 'wrong' ? '#ef4444' : 'var(--border)',
                        color: statusValue === 'idle' ? 'var(--text-primary)' : '#0a0a0f'
                     }}>
                     <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black transition-colors ${isSelected ? 'bg-accent border-accent text-white' : 'border-gray-200 group-hover:border-accent group-hover:text-accent'}`}>
                        {String.fromCharCode(65 + i)}
                     </span>
                     <span className="flex-1 text-sm font-bold">{opt}</span>
                     {statusValue === 'correct' && <span className="text-green-600 font-bold">Correct!</span>}
                     {statusValue === 'wrong' && <span className="text-red-600 font-bold">Wrong</span>}
                   </button>
                 );
              })}
            </div>

            {/* Feedback & Next */}
            {showFeedback && (
              <div className="mt-10 animate-fade-up">
                <div className="rounded-3xl border-2 bg-surface p-6 shadow-xl" 
                  style={{ borderColor: selectedOption === mcqs[currentIndex].correct_index ? '#22c55e33' : '#ef444433' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Analysis</p>
                  <p className="text-sm font-medium leading-relaxed text-secondary">{mcqs[currentIndex].explanation}</p>
                </div>
                <button onClick={nextQuestion} className="mt-8 h-16 w-full rounded-2xl bg-accent text-sm font-black text-white shadow-xl shadow-accent/20 transition-all hover:scale-[1.01] active:scale-[0.98]">
                   {currentIndex + 1 === mcqs.length ? "Finish Quiz" : "Next Question →"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-6 font-bold text-secondary">No quiz data found.</p>
            <button onClick={() => router.push("/")} className="rounded-xl bg-accent px-8 py-3 text-sm font-black text-white">Go Home</button>
          </div>
        )}
      </main>
    </div>
  );
}
