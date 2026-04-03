/**
 * Auth redirect utilities — preserves user intent across auth flows.
 * 
 * Usage:
 *   navigate(buildAuthUrl("/services?tab=sell"))
 *   navigate(buildAuthUrl(location.pathname + location.search))
 * 
 * After login, Auth.tsx reads the redirect target and returns the user.
 */

const REDIRECT_KEY = "ai_idei_auth_redirect";

/** Build /auth URL with redirect query param */
export function buildAuthUrl(returnTo: string, mode?: "login" | "signup"): string {
  const params = new URLSearchParams();
  if (returnTo && returnTo !== "/" && returnTo !== "/auth") {
    params.set("redirect", returnTo);
  }
  if (mode) params.set("mode", mode);
  const qs = params.toString();
  return `/auth${qs ? `?${qs}` : ""}`;
}

/** Store redirect target in sessionStorage (backup for OAuth/email flows) */
export function storeRedirect(path: string) {
  if (path && path !== "/" && path !== "/auth" && !path.startsWith("/auth?")) {
    try {
      sessionStorage.setItem(REDIRECT_KEY, path);
    } catch {}
  }
}

/** Read and clear stored redirect target */
export function consumeRedirect(): string | null {
  try {
    const stored = sessionStorage.getItem(REDIRECT_KEY);
    if (stored) {
      sessionStorage.removeItem(REDIRECT_KEY);
      return stored;
    }
  } catch {}
  return null;
}

/** Get the best redirect target from multiple sources */
export function getRedirectTarget(
  searchParams: URLSearchParams,
  locationState: any
): string | null {
  // Priority 1: explicit ?redirect= param
  const fromParam = searchParams.get("redirect");
  if (fromParam && fromParam !== "/auth") return fromParam;
  
  // Priority 2: router state (from ProtectedRoute)
  const fromState = locationState?.from?.pathname;
  if (fromState && fromState !== "/auth") {
    const search = locationState?.from?.search || "";
    const hash = locationState?.from?.hash || "";
    return fromState + search + hash;
  }
  
  // Priority 3: sessionStorage (OAuth/email callback)
  const fromStorage = consumeRedirect();
  if (fromStorage) return fromStorage;
  
  return null;
}
