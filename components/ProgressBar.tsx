import React from "react";

interface ProgressBarProps {
  mastered: number;
  learning: number;
  newCards: number;
  total: number;
}

export default function ProgressBar({
  mastered,
  learning,
  newCards,
  total,
}: ProgressBarProps) {
  if (total === 0) return null;

  const masteredPercent = (mastered / total) * 100;
  const learningPercent = (learning / total) * 100;
  const newPercent = (newCards / total) * 100;

  return (
    <div className="w-full">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          style={{ width: `${masteredPercent}%` }}
          className="bg-emerald-500 transition-all duration-500"
        />
        <div
          style={{ width: `${learningPercent}%` }}
          className="bg-amber-400 transition-all duration-500"
        />
        <div
          style={{ width: `${newPercent}%` }}
          className="bg-gray-200 transition-all duration-500"
        />
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
        <div className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {mastered}
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
          {learning}
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-200" />
          {newCards}
        </div>
      </div>
    </div>
  );
}
