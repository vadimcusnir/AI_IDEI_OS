/**
 * APP LAYOUT — Canonical Shell (Mobile-First)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Mobile: Top bar (trigger + page title) + content + bottom nav
 * Desktop: Sidebar | Top bar (trigger + breadcrumbs + pipeline) | content
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

// Lazy-load non-critical components
const LowBalanceBanner = lazy(() => import("@/components/credits/LowBalanceBanner").then(m => ({ default: m.LowBalanceBanner })));
const BehaviorOverlay = lazy(() => import("@/components/behavior/BehaviorOverlay").then(m => ({ default: m.BehaviorOverlay })));
const CompactPipeline = lazy(() => import("@/components/PipelineIndicator").then(m => ({ default: m.CompactPipelineIndicator })));
const Footer = lazy(() => import("@/components/global/Footer").then(m => ({ default: m.Footer })));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav").then(m => ({ default: m.MobileBottomNav })));
const ContextualFeedbackPrompt = lazy(() => import("@/components/feedback/ContextualFeedbackPrompt").then(m => ({ default: m.ContextualFeedbackPrompt })));
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Skip to content
        </a>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* ═══ TOP BAR — Mobile-first: trigger + page title on mobile, breadcrumbs on desktop ═══ */}
          <div className="shrink-0 h-12 md:h-10 flex items-center gap-2 border-b border-border/30 bg-background/80 backdrop-blur-md px-2 md:px-3">
            <SidebarTrigger
              aria-label="Toggle sidebar"
              className="h-10 w-10 min-h-[44px] min-w-[44px] md:h-8 md:w-8 md:min-h-0 md:min-w-0"
            />
            {/* Mobile: show current page title */}
            <div className="flex-1 min-w-0 md:hidden">
              <MobilePageTitle />
            </div>
            {/* Desktop: breadcrumbs */}
            <div className="hidden md:flex items-center flex-1 min-w-0">
              <AppBreadcrumbs />
            </div>
            {user && (
              <div className="hidden md:flex items-center ml-auto">
                <Suspense fallback={null}>
                  <CompactPipeline />
                </Suspense>
              </div>
            )}
          </div>

          <div className="shrink-0">
            <Suspense fallback={<div className="h-8"><Skeleton className="h-8 w-full" /></div>}><LowBalanceBanner /></Suspense>
            <Suspense fallback={null}><BehaviorOverlay /></Suspense>
          </div>

          {fullHeight ? (
            <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ErrorBoundary><div className="flex-1 flex flex-col min-h-0">{children}</div></ErrorBoundary>
            </main>
          ) : (
            <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
              <ErrorBoundary><PageTransition>{children}</PageTransition></ErrorBoundary>
              <Suspense fallback={<div className="py-8"><Skeleton className="h-4 w-32 mx-auto" /></div>}><Footer /></Suspense>
            </main>
          )}
        </div>
      </div>
      <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border md:hidden"><Skeleton className="h-full w-full" /></div>}><MobileBottomNav /></Suspense>
      <Suspense fallback={null}>
        <ContextualFeedbackPrompt />
        <GamificationToasts />
      </Suspense>
    </SidebarProvider>
  );
}
