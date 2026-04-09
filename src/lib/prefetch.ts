/**
 * Route prefetch — preloads critical route chunks on idle.
 * Call once after initial render to warm the cache.
 */
export function prefetchCriticalRoutes() {
  if (typeof window === "undefined") return;

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
