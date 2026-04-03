/**
 * CC-V04: Adoption Routing Tracker
 * Monitors if users leave /home for parallel routes,
 * helping measure Command Center adoption as single entry point.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackAdoptionExit } from "@/lib/commandCenterTelemetry";

const TRACKED_EXITS: Record<string, string> = {
  "/services": "services",
  "/library": "library",
  "/intelligence": "intelligence",
  "/extractor": "extractor",
  "/neurons": "neurons",
  "/episodes": "episodes",
  "/assets": "assets",
  "/jobs": "jobs",
  "/marketplace": "marketplace",
  "/pricing": "pricing",
};

/**
 * Place this hook in the app shell (e.g., Layout).
 * It tracks when users navigate away from /home to other routes.
 */
export function useAdoptionTracker() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const prev = prevPath.current;
    const current = location.pathname;
    prevPath.current = current;

    // Only track if leaving /home
    if (prev !== "/home") return;
    if (current === "/home") return;

    // Find matching tracked exit
    const matchedKey = Object.keys(TRACKED_EXITS).find(k => current.startsWith(k));
    if (matchedKey) {
      trackAdoptionExit(TRACKED_EXITS[matchedKey]);
    } else {
      trackAdoptionExit(current);
    }
  }, [location.pathname]);
}
