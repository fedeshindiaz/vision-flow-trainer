import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(id);
  }, [delayMs, value]);

  return debouncedValue;
}
