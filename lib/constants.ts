export const APP_NAME = "FlashCard Engine";
export const APP_DESCRIPTION = "Turn any PDF into a learning machine";

export const MAX_CARDS_PER_SESSION = 50;
export const MAX_REGENERATIONS = 10;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MCQ_COUNT = 20;
export const FLASHCARD_COUNT = 50;

export const DIFFICULTY_LABELS = {
  new: "New",
  learning: "Learning",
  mastered: "Mastered",
} as const;

export const DIFFICULTY_COLORS = {
  new: "#6b7280",
  learning: "#f59e0b",
  mastered: "#22c55e",
} as const;

export const SM2_MIN_EASE = 1.3;
export const SM2_MAX_EASE = 4.0;
export const SM2_DEFAULT_EASE = 2.5;

export const SUPABASE_TABLES = {
  DECKS: "decks",
  CARDS: "cards",
  MCQS: "mcqs",
  SESSIONS: "sessions",
  QUIZ_SESSIONS: "quiz_sessions",
  DECK_HISTORY: "deck_history",
} as const;
