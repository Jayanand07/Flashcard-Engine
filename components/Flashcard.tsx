import React from "react";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ question, answer, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div className="mx-auto w-full cursor-pointer select-none" style={{ perspective: "1200px", maxWidth: "640px" }} onClick={onFlip}>
      <div className="relative w-full" style={{
        minHeight: "460px",
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
      }}>
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl px-10 py-12 sm:px-14 transition-shadow duration-500"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 0 60px rgba(124,106,247,0.15), 0 8px 40px rgba(0,0,0,0.08)" }}>
          <span className="absolute left-6 top-6 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#8b5cf6" }}>Question</span>
          <p className="max-h-[300px] overflow-y-auto text-center text-xl font-semibold leading-relaxed sm:text-2xl" style={{ color: "var(--text)" }}>{question}</p>
          <span className="absolute bottom-6 text-xs animate-subtle-pulse" style={{ color: "var(--text-muted)" }}>tap anywhere to flip</span>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl px-10 py-12 sm:px-14 transition-shadow duration-500"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 0 60px rgba(124,106,247,0.15), 0 8px 40px rgba(0,0,0,0.08)" }}>
          <span className="absolute left-6 top-6 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#22c55e" }}>Answer</span>
          <p className="max-h-[320px] overflow-y-auto text-center text-lg leading-relaxed" style={{ color: "var(--text)" }}>{answer}</p>
        </div>
      </div>
    </div>
  );
}
