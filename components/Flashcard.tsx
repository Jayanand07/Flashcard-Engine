import React from "react";

interface FlashcardProps {
  question: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({
  question,
  answer,
  isFlipped,
  onFlip,
}: FlashcardProps) {
  return (
    <div
      className="mx-auto w-full max-w-2xl cursor-pointer select-none"
      style={{ perspective: "1200px" }}
      onClick={onFlip}
    >
      {/*
        The outer wrapper sets the explicit height so the absolute-positioned
        front/back faces have a reference. This is the root cause of the
        "both sides visible" bug — without explicit height, inset-0 collapses.
      */}
      <div
        className="relative h-[340px] w-full sm:h-[380px]"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front (Question) ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm sm:px-12"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <span className="absolute left-5 top-5 text-[10px] font-medium uppercase tracking-[0.15em] text-gray-300">
            Question
          </span>

          <p className="max-h-[220px] overflow-y-auto text-center text-lg font-semibold leading-relaxed text-gray-900 sm:text-xl md:text-2xl">
            {question}
          </p>

          <span className="absolute bottom-5 flex items-center gap-1.5 text-xs text-gray-300">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
            </svg>
            Tap to flip
          </span>
        </div>

        {/* ── Back (Answer) ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-8 py-10 shadow-sm sm:px-12"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="absolute left-5 top-5 text-[10px] font-medium uppercase tracking-[0.15em] text-amber-600">
            Answer
          </span>

          <p className="max-h-[240px] overflow-y-auto text-center text-base leading-relaxed text-gray-700 sm:text-lg md:text-xl">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
