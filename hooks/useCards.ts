import { useState, useEffect, useCallback } from "react";
import { Card } from "@/lib/types";

export function useCards(deck_id: string, dueOnly: boolean = false) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!deck_id) return;
    try {
      setLoading(true);
      setError(null);
      const url = `/api/cards?deck_id=${deck_id}${dueOnly ? "&due_only=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch cards");
      }
      const data = await res.json();
      setCards(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, [deck_id, dueOnly]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return { cards, loading, error, refetch: fetchCards, setCards };
}
