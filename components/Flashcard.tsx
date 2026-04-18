import React from "react";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ question, answer, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="mx-auto w-full cursor-pointer select-none"
      style={{ perspective: "1200px", maxWidth: "600px", minWidth: "300px" }}
      onClick={onFlip}
    >
      <div
        className="relative w-full"
        style={{
          height: "420px",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front: Question ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl px-8 py-10 sm:px-12"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <span
            className="absolute left-6 top-6 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--text-secondary)" }}
          >
            Question
          </span>

          <p
            className="max-h-[280px] overflow-y-auto text-center text-xl font-bold leading-relaxed sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            {question}
          </p>

          <span
            className="absolute bottom-6 flex items-center gap-1.5 text-xs animate-subtle-pulse"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            tap to reveal answer
          </span>
        </div>

        {/* ── Back: Answer ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl px-8 py-10 sm:px-12"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <span
            className="absolute left-6 top-6 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--accent)" }}
          >
            Answer
          </span>

          <p
            className="max-h-[300px] overflow-y-auto text-center text-lg leading-relaxed sm:text-xl"
            style={{ color: "var(--text-primary)" }}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
