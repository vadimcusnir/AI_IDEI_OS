/**
 * AppLayout — Single OS Shell.
 * Header = minimal control (trigger + breadcrumbs)
 * Sidebar = navigation kernel
 * Main = execution surface
 * Footer = system/meta (non-fullHeight pages only)
 */
import { ReactNode, useEffect, useRef, lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/motion/PageTransition";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useDailyActivity } from "@/hooks/useDailyActivity";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { prefetchUIControls } from "@/hooks/useUIControl";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { useAdoptionTracker } from "@/hooks/useAdoptionTracker";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import { MobilePageTitle } from "@/components/MobilePageTitle";

const LowBalanceBanner = lazy(() => import("@/components/credits/LowBalanceBanner").then(m => ({ default: m.LowBalanceBanner })));
const BehaviorOverlay = lazy(() => import("@/components/behavior/BehaviorOverlay").then(m => ({ default: m.BehaviorOverlay })));
const Footer = lazy(() => import("@/components/global/Footer").then(m => ({ default: m.Footer })));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav").then(m => ({ default: m.MobileBottomNav })));
const GamificationToasts = lazy(() => import("@/components/gamification/GamificationToasts").then(m => ({ default: m.GamificationToasts })));

interface AppLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export function AppLayout({ children, fullHeight = false }: AppLayoutProps) {
  const { user } = useAuth();
  usePageTracking();
  useDailyActivity();
  useKeyboardNav();
  useAdoptionTracker();

  const prefetched = useRef(false);
  useEffect(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      prefetchUIControls();
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="h-svh flex w-full overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* ═══ HEADER — Minimal control bar ═══ */}
          <div className="shrink-0 h-12 flex items-center gap-2 border-b border-border/30 bg-background/80 backdrop-blur-md px-2 md:px-3">
            <SidebarTrigger
              aria-label="Toggle sidebar"
              className="h-9 w-9 min-h-[44px] min-w-[44px] md:h-8 md:w-8 md:min-h-0 md:min-w-0"
            />
            {/* Mobile: page title */}
            <div className="flex-1 min-w-0 md:hidden">
              <MobilePageTitle />
            </div>
            {/* Desktop: breadcrumbs only */}
            <div className="hidden md:flex items-center flex-1 min-w-0">
              <AppBreadcrumbs />
            </div>
          </div>

          {/* Banners */}
          <div className="shrink-0">
            <Suspense fallback={null}><LowBalanceBanner /></Suspense>
            <Suspense fallback={null}><BehaviorOverlay /></Suspense>
          </div>

          {/* ═══ MAIN — Execution surface ═══ */}
          {fullHeight ? (
            <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ErrorBoundary><div className="flex-1 flex flex-col min-h-0">{children}</div></ErrorBoundary>
            </main>
          ) : (
            <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
              <ErrorBoundary><PageTransition>{children}</PageTransition></ErrorBoundary>
              <Suspense fallback={null}><Footer /></Suspense>
            </main>
          )}
        </div>
      </div>
      <Suspense fallback={null}><MobileBottomNav /></Suspense>
      <Suspense fallback={null}><GamificationToasts /></Suspense>
    </SidebarProvider>
  );
}
