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
      className="mx-auto w-full max-w-2xl cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={onFlip}
    >
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "260px",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-8"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="absolute left-5 top-5 text-[10px] font-medium uppercase tracking-widest text-gray-300">
            Question
          </span>
          <h2 className="text-center text-xl font-semibold leading-relaxed text-gray-900 md:text-2xl">
            {question}
          </h2>
          <span className="absolute bottom-5 text-xs text-gray-300">
            Tap to reveal
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-8"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <span className="absolute left-5 top-5 text-[10px] font-medium uppercase tracking-widest text-gray-400">
            Answer
          </span>
          <p className="text-center text-lg leading-relaxed text-gray-700 md:text-xl">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
