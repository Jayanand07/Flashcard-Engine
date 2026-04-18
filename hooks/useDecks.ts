import { useState, useEffect, useCallback, useMemo } from "react";
import { Deck } from "@/lib/types";

export function useDecks(): {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalDueCount: number;
  decksWithDue: number;
  mostDueDeck: Deck | null;
} {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/decks");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch decks");
      }
      const data = await res.json();
      setDecks(data.decks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load decks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const stats = useMemo(() => {
    let totalDueCount = 0;
    let decksWithDue = 0;
    let mostDueDeck: Deck | null = null;
    let maxDue = -1;

    decks.forEach(deck => {
      const due = deck.due_today || 0;
      totalDueCount += due;
      if (due > 0) {
        decksWithDue++;
        if (due > maxDue) {
          maxDue = due;
          mostDueDeck = deck;
        }
      }
    });

    return { totalDueCount, decksWithDue, mostDueDeck };
  }, [decks]);

  return { 
    decks, 
    loading, 
    error, 
    refetch: fetchDecks,
    totalDueCount: stats.totalDueCount,
    decksWithDue: stats.decksWithDue,
    mostDueDeck: stats.mostDueDeck
  };
}
