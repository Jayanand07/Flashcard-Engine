export type Rating = "hard" | "okay" | "easy";

export interface CardSM2 {
  interval: number;
  ease_factor: number;
  difficulty: string;
}

export interface SM2Result {
  interval: number;
  ease_factor: number;
  difficulty: string;
  next_review: string;
}

export function getTodayString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateSM2(card: CardSM2, rating: Rating): SM2Result {
  let new_interval = card.interval;
  let new_ease = card.ease_factor;

  if (rating === "easy") {
    new_interval = Math.round(card.interval * card.ease_factor);
    new_ease = Math.min(card.ease_factor + 0.1, 4.0);
  } else if (rating === "okay") {
    new_interval = Math.round(card.interval * card.ease_factor);
    // new_ease remains unchanged
  } else if (rating === "hard") {
    new_interval = 1;
    new_ease = Math.max(card.ease_factor - 0.2, 1.3);
  }

  let difficulty = "new";
  if (new_interval >= 14) {
    difficulty = "mastered";
  } else if (new_interval >= 3) {
    difficulty = "learning";
  }

  // Calculate next_review date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + new_interval);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, "0");
  const day = String(nextDate.getDate()).padStart(2, "0");
  const next_review = `${year}-${month}-${day}`;

  return {
    interval: new_interval,
    ease_factor: new_ease,
    difficulty,
    next_review,
  };
}
