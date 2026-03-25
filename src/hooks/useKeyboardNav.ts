import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts for platform navigation.
 * Alt+H = Home, Alt+E = Extractor, Alt+S = Services, Alt+L = Library, Alt+C = Credits
 * Escape = close any open modal/drawer
 */
export function useKeyboardNav() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "h": e.preventDefault(); navigate("/home"); break;
          case "e": e.preventDefault(); navigate("/extractor"); break;
          case "s": e.preventDefault(); navigate("/services"); break;
          case "l": e.preventDefault(); navigate("/library"); break;
          case "c": e.preventDefault(); navigate("/credits"); break;
          case "n": e.preventDefault(); navigate("/neurons"); break;
          case "i": e.preventDefault(); navigate("/intelligence"); break;
        }
      }

      // "/" to focus search (common pattern)
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const searchInput = document.querySelector<HTMLInputElement>("[data-search-input]");
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate]);
}
