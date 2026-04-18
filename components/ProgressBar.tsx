import React from "react";

interface ProgressBarProps {
  mastered: number;
  learning: number;
  newCards: number;
  total: number;
  height?: string;
  showLegend?: boolean;
}

export default function ProgressBar({
  mastered,
  learning,
  newCards,
  total,
  height = "h-2",
  showLegend = true,
}: ProgressBarProps) {
  if (total === 0) return null;

  const mp = (mastered / total) * 100;
  const lp = (learning / total) * 100;
  const np = (newCards / total) * 100;

  return (
    <div className="w-full">
      <div className={`flex ${height} w-full overflow-hidden rounded-full`} style={{ background: "var(--surface-2)" }}>
        <div style={{ width: `${mp}%` }} className="bg-emerald-500 transition-all duration-700" />
        <div style={{ width: `${lp}%` }} className="bg-amber-400 transition-all duration-700" />
        <div style={{ width: `${np}%` }} className="transition-all duration-700" />
      </div>
      {showLegend && (
        <div className="mt-2.5 flex items-center gap-5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            {mastered} Mastered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            {learning} Learning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--border)" }} />
            {newCards} New
          </span>
        </div>
      )}
    </div>
  );
}
