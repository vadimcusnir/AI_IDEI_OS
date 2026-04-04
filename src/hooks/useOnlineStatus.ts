/**
 * useOnlineStatus — Reactive hook for navigator.onLine status.
 * Returns { isOnline, wasOffline } for UI gating.
 */
import { useState, useEffect, useCallback } from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };
    const goOnline = () => setIsOnline(true);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const resetWasOffline = useCallback(() => setWasOffline(false), []);

  return { isOnline, wasOffline, resetWasOffline };
}
