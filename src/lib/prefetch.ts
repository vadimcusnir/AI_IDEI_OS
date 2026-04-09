/**
 * Route prefetch — preloads critical route chunks on idle.
 * Only prefetches app routes when user is authenticated (on app pages).
 * Landing visitors get no unnecessary prefetch.
 */
export function prefetchCriticalRoutes() {
  if (typeof window === "undefined") return;

  const isLanding = window.location.pathname === "/" || /^\/(en|ro|ru)\/?$/.test(window.location.pathname);
  
  // On landing page, don't prefetch app routes — user hasn't authed yet
  if (isLanding) return;

  const routes = [
    () => import("@/pages/Home"),
    () => import("@/pages/Index"),
    () => import("@/pages/Library"),
    () => import("@/pages/Services"),
    () => import("@/pages/Pipeline"),
  ];

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => {
      routes.forEach(r => r().catch(() => {}));
    }, { timeout: 5000 });
  } else {
    setTimeout(() => {
      routes.forEach(r => r().catch(() => {}));
    }, 3000);
  }
}
