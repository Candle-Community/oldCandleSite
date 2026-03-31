"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiPollingResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiPolling<T>(path: string, intervalMs = 30000): UseApiPollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/launchbot${path}`);
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, intervalMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData, intervalMs]);

  return { data, loading, error };
}
