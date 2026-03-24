/**
 * useAbandonmentDetector — Detects when users start configuring a service
 * but don't execute. Re-engages with contextual prompts.
 */
import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";

interface AbandonmentConfig {
  /** Seconds of inactivity before showing re-engagement */
  timeoutSeconds?: number;
  /** Minimum input length to consider "started" */
  minInputLength?: number;
  /** Service name for contextual messaging */
  serviceName?: string;
}

export function useAbandonmentDetector({
  timeoutSeconds = 45,
  minInputLength = 20,
  serviceName,
}: AbandonmentConfig = {}) {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(false);

  const markStarted = useCallback((inputLength: number) => {
    if (inputLength >= minInputLength && !hasStarted) {
      setHasStarted(true);
    }
  }, [minInputLength, hasStarted]);

  const markCompleted = useCallback(() => {
    setHasCompleted(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetActivity = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (hasCompleted || shownRef.current || !hasStarted) return;

    timerRef.current = setTimeout(() => {
      if (!shownRef.current && !hasCompleted) {
        shownRef.current = true;
        const name = serviceName ? `"${serviceName}"` : "your content";
        toast.info(
          `Still working on ${name}? Hit Execute to generate your outputs.`,
          {
            duration: 8000,
            action: {
              label: "Continue",
              onClick: () => {
                // Focus the execute button if possible
                const btn = document.querySelector<HTMLButtonElement>('[data-execute-btn]');
                btn?.scrollIntoView({ behavior: "smooth", block: "center" });
                btn?.focus();
              },
            },
          }
        );
      }
    }, timeoutSeconds * 1000);
  }, [hasStarted, hasCompleted, timeoutSeconds, serviceName]);

  // Reset timer on user activity
  useEffect(() => {
    if (!hasStarted || hasCompleted) return;

    resetActivity();

    const onActivity = () => resetActivity();
    document.addEventListener("keydown", onActivity, { passive: true });
    document.addEventListener("click", onActivity, { passive: true });

    return () => {
      document.removeEventListener("keydown", onActivity);
      document.removeEventListener("click", onActivity);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasStarted, hasCompleted, resetActivity]);

  return { markStarted, markCompleted, hasStarted };
}
