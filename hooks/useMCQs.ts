import { useState, useEffect, useCallback } from "react";
import { MCQ } from "@/lib/types";

export function useMCQs(deck_id: string) {
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMCQs = useCallback(async () => {
    if (!deck_id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/mcq?deck_id=${deck_id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch MCQs");
      }
      const data = await res.json();
      setMcqs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load MCQs");
    } finally {
      setLoading(false);
    }
  }, [deck_id]);

  useEffect(() => {
    fetchMCQs();
  }, [fetchMCQs]);

  return { mcqs, loading, error, refetch: fetchMCQs, setMcqs };
}
