import { useState, useEffect } from 'react';

/**
 * Hook for debouncing fast-changing values (such as search inputs).
 * Prevents expensive re-filtering and unnecessary renders on every keystroke.
 * Based on frontend-patterns.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
