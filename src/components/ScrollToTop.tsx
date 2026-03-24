import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls the main content area to top on route change */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Try the main content container first, fallback to window
    const main = document.getElementById("main-content");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname]);

  return null;
}
