import { useEffect, useState } from 'react';
import { getCurrentDateKey } from './time';

/** Current time, re-rendered every `intervalMs`. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Local yyyy-MM-dd that flips when midnight passes, without re-rendering every tick. */
export function useDayKey(): string {
  const [key, setKey] = useState(getCurrentDateKey);
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = getCurrentDateKey();
      setKey((prev) => (prev === next ? prev : next));
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);
  return key;
}
