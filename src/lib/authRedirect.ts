/**
 * Auth redirect utilities — preserves user intent across auth flows.
 * 
 * Handles: email login, signup, Google OAuth, email verification callbacks.
 * Stores redirect with TTL to prevent stale redirects from old sessions.
 */

const REDIRECT_KEY = "ai_idei_auth_redirect";
const REDIRECT_TS_KEY = "ai_idei_auth_redirect_ts";
/** Max age for stored redirect: 30 minutes */
const MAX_REDIRECT_AGE_MS = 30 * 60 * 1000;

/** Routes that should never be redirect targets */
const BLOCKED_TARGETS = ["/auth", "/reset-password"];

function isValidTarget(path: string): boolean {
  if (!path || path === "/") return false;
  return !BLOCKED_TARGETS.some(b => path === b || path.startsWith(b + "?"));
}

/** Build /auth URL with redirect query param */
export function buildAuthUrl(returnTo: string, mode?: "login" | "signup"): string {
  const params = new URLSearchParams();
  if (isValidTarget(returnTo)) {
    params.set("redirect", returnTo);
  }
  if (mode) params.set("mode", mode);
  const qs = params.toString();
  return `/auth${qs ? `?${qs}` : ""}`;
}

/** Store redirect target in sessionStorage (backup for OAuth/email flows) */
export function storeRedirect(path: string) {
  if (!isValidTarget(path)) return;
  try {
    sessionStorage.setItem(REDIRECT_KEY, path);
    sessionStorage.setItem(REDIRECT_TS_KEY, String(Date.now()));
  } catch {}
}

/** Read and clear stored redirect target (single-use) */
export function consumeRedirect(): string | null {
  try {
    const stored = sessionStorage.getItem(REDIRECT_KEY);
    const ts = sessionStorage.getItem(REDIRECT_TS_KEY);
    // Always clear regardless
    sessionStorage.removeItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_TS_KEY);
    if (!stored) return null;
    // Check TTL — reject stale redirects
    if (ts && Date.now() - Number(ts) > MAX_REDIRECT_AGE_MS) return null;
    if (!isValidTarget(stored)) return null;
    return stored;
  } catch {}
  return null;
}

/** Clear stored redirect (e.g. on logout) */
export function clearRedirect() {
  try {
    sessionStorage.removeItem(REDIRECT_KEY);
    sessionStorage.removeItem(REDIRECT_TS_KEY);
  } catch {}
}

/** Get the best redirect target from multiple sources */
export function getRedirectTarget(
  searchParams: URLSearchParams,
  locationState: any
): string | null {
  // Priority 1: explicit ?redirect= param
  const fromParam = searchParams.get("redirect");
  if (fromParam && isValidTarget(fromParam)) return fromParam;
  
  // Priority 2: router state (from ProtectedRoute)
  const fromState = locationState?.from?.pathname;
  if (fromState && isValidTarget(fromState)) {
    const search = locationState?.from?.search || "";
    const hash = locationState?.from?.hash || "";
    return fromState + search + hash;
  }
  
  // Priority 3: sessionStorage (OAuth/email callback)
  const fromStorage = consumeRedirect();
  if (fromStorage) return fromStorage;
  
  return null;
}
