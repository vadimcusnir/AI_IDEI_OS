import { useState, useEffect, useRef } from "react";

interface ScrollDirectionResult {
  direction: "up" | "down";
  isAtTop: boolean;
  hasScrolled: boolean;
}

export function useScrollDirection(threshold = 8): ScrollDirectionResult {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [isAtTop, setIsAtTop] = useState(true);
  const [hasScrolled, setHasScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setIsAtTop(y < 10);
      setHasScrolled(y > 0);

      const diff = y - lastY.current;
      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 ? "down" : "up");
        lastY.current = y;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return { direction, isAtTop, hasScrolled };
}
