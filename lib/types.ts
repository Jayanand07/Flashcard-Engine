export interface Deck {
  id: string;
  name: string;
  card_count: number;
  created_at: string;
  last_studied: string | null;
  regenerate_count: number;
  user_id?: string;
  due_today?: number; // Computed field
  stats?: {
    mastered: number;
    learning: number;
    newCards: number;
  };
}

export interface Card {
  id: string;
  deck_id: string;
  question: string;
  answer: string;
  difficulty: "new" | "learning" | "mastered";
  next_review: string;
  interval: number;
  ease_factor: number;
  created_at: string;
  user_id?: string;
}

export interface MCQ {
  id: string;
  deck_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  user_id?: string;
}

export interface Session {
  id: string;
  deck_id: string;
  deck_name: string;
  cards_reviewed: number;
  easy_count: number;
  okay_count: number;
  hard_count: number;
  accuracy: number;
  completed_at: string;
  user_id?: string;
}

export interface QuizSession {
  id: string;
  deck_id: string;
  deck_name: string;
  score: number;
  total_questions: number;
  accuracy: number;
  completed_at: string;
  user_id?: string;
}

export interface DeckHistory {
  id: string;
  deck_id: string;
  generation_number: number;
  cards: Card[];
  saved_at: string;
}
