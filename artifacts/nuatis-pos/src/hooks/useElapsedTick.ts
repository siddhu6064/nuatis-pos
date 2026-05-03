import { useState, useEffect, useRef } from "react";

/**
 * useElapsedTick — returns an incrementing counter that ticks once per second
 * while `active` is true. When `active` is false the interval is cleared and
 * the counter stops (and is reset to 0 so re-activation starts fresh).
 *
 * This is the ONLY setInterval in the codebase. Interval cleanup on unmount
 * and on transition to zero-active-sessions is mandatory.
 *
 * Usage: use the returned tick value as a render dependency in cart-line
 * components to drive live elapsed-time displays.
 */
export function useElapsedTick(active: boolean): number {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      // Start interval when there are active sessions
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
    } else {
      // Clear interval when no active sessions remain
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTick(0);
    }

    return () => {
      // Cleanup on unmount or when active changes
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active]);

  return tick;
}
