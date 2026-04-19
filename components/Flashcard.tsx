"use client";

import React from "react";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

const Flashcard = ({ question, answer, isFlipped, onFlip }: FlashcardProps) => {
  return (
    <div className="mx-auto w-full cursor-pointer select-none" style={{ perspective: "1200px", maxWidth: "680px" }} onClick={onFlip}>
      <div className="relative w-full" style={{
        minHeight: "480px",
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[24px] px-10 py-12 sm:px-14 transition-all duration-500"
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden", 
            background: "var(--surface)", 
            border: "1px solid var(--border)", 
            boxShadow: "0 0 0 1px var(--border), 0 40px 80px rgba(0,0,0,0.1), 0 0 60px rgba(124,106,247,0.08)" 
          }}>
          <span className="absolute left-8 top-8 text-[11px] font-black uppercase tracking-[0.2em] text-accent" style={{ color: "var(--accent)" }}>Question</span>
          <p className="max-h-[340px] overflow-y-auto text-center text-2xl font-bold leading-snug tracking-tight sm:text-3xl" style={{ color: "var(--text-primary)" }}>{question}</p>
          <div className="absolute bottom-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 animate-subtle-pulse">
            <span>Tap to flip</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[24px] px-10 py-12 sm:px-14 transition-all duration-500"
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden", 
            transform: "rotateY(180deg)", 
            background: "var(--surface)", 
            border: "1px solid var(--border)", 
            boxShadow: "0 0 0 1px var(--border), 0 40px 80px rgba(0,0,0,0.1), 0 0 60px rgba(124,106,247,0.08)" 
          }}>
          <span className="absolute left-8 top-8 text-[11px] font-black uppercase tracking-[0.2em] text-success" style={{ color: "var(--success)" }}>Answer</span>
          <p className="max-h-[360px] overflow-y-auto text-center text-lg font-medium leading-relaxed sm:text-xl" style={{ color: "var(--text-primary)" }}>{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Flashcard);
