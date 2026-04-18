import React from "react";
import { DIFFICULTY_COLORS } from "@/lib/constants";

interface ProgressBarProps {
  mastered: number;
  learning: number;
  newCards: number;
  total: number;
  height?: string;
  showLegend?: boolean;
}

const ProgressBar = ({
  mastered,
  learning,
  newCards,
  total,
  height = "h-2",
  showLegend = true,
}: ProgressBarProps) => {
  if (total === 0) return null;

  const mp = (mastered / total) * 100;
  const lp = (learning / total) * 100;
  const np = (newCards / total) * 100;

  return (
    <div className="w-full">
      <div className={`flex ${height} w-full overflow-hidden rounded-full`} style={{ background: "var(--surface-2)" }}>
        <div style={{ width: `${mp}%`, backgroundColor: DIFFICULTY_COLORS.mastered }} className="transition-all duration-700" />
        <div style={{ width: `${lp}%`, backgroundColor: DIFFICULTY_COLORS.learning }} className="transition-all duration-700" />
        <div style={{ width: `${np}%` }} className="transition-all duration-700" />
      </div>
      {showLegend && (
        <div className="mt-2.5 flex items-center gap-5 text-xs" style={{ color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS.mastered }} />
            {mastered} Mastered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS.learning }} />
            {learning} Learning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: DIFFICULTY_COLORS.new }} />
            {newCards} New
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(ProgressBar);
