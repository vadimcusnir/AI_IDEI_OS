import { ReactNode, useEffect, useRef, lazy, Suspense, memo } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useLocale } from "@/hooks/useLocale";
import { useDailyActivity } from "@/hooks/useDailyActivity";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { prefetchUIControls } from "@/hooks/useUIControl";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import { ThemeToggle } from "@/components/ThemeToggle";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";

// Lazy-load non-critical components
const LowBalanceBanner = lazy(() => import("@/components/credits/LowBalanceBanner").then(m => ({ default: m.LowBalanceBanner })));
const BehaviorOverlay = lazy(() => import("@/components/behavior/BehaviorOverlay").then(m => ({ default: m.BehaviorOverlay })));
const CompactPipeline = lazy(() => import("@/components/PipelineIndicator").then(m => ({ default: m.CompactPipelineIndicator })));
const GlobalSearch = lazy(() => import("@/components/GlobalSearch").then(m => ({ default: m.GlobalSearch })));
const NotificationBell = lazy(() => import("@/components/NotificationBell").then(m => ({ default: m.NotificationBell })));
const UserMenu = lazy(() => import("@/components/UserMenu").then(m => ({ default: m.UserMenu })));
const Footer = lazy(() => import("@/components/global/Footer").then(m => ({ default: m.Footer })));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav").then(m => ({ default: m.MobileBottomNav })));
const ContextualFeedbackPrompt = lazy(() => import("@/components/feedback/ContextualFeedbackPrompt").then(m => ({ default: m.ContextualFeedbackPrompt })));
const GamificationToasts = lazy(() => import("@/components/gamification/GamificationToasts").then(m => ({ default: m.GamificationToasts })));

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

interface AppLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export function AppLayout({ children, fullHeight = false }: AppLayoutProps) {
  const { currentLanguage, changeLanguage } = useLocale();
  const { user } = useAuth();
  usePageTracking();
  useDailyActivity();

  const prefetched = useRef(false);
  useEffect(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      prefetchUIControls();
    }
  }, []);

  const currentLang = LANG_OPTIONS.find(l => l.code === currentLanguage) || LANG_OPTIONS[0];

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
          {/* ═══ HEADER: 3-zone control panel ═══ */}
          <header
            className="shrink-0 z-40 h-[var(--header-height)] flex items-center border-b border-border/40 bg-background/95 backdrop-blur-sm px-3 sm:px-4"
          >
            {/* ─── LEFT: Identity ─── */}
            <div className="flex items-center gap-2 shrink-0">
              <SidebarTrigger />
              <Link to="/home" className="flex items-center gap-1.5 group" title="Home">
                <div className="h-6 w-6 rounded-lg bg-[hsl(var(--gold-oxide)/0.08)] flex items-center justify-center group-hover:bg-[hsl(var(--gold-oxide)/0.12)] transition-colors">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-bold tracking-tight hidden sm:inline text-foreground">
                  {"\n"}
                </span>
              </Link>
              {/* Breadcrumbs (hidden on /home) */}
              <div className="hidden md:block ml-1">
                <AppBreadcrumbs />
              </div>
            </div>

            {/* ─── CENTER: Spacer ─── */}
            <div className="flex-1 min-w-0" />

            {/* ─── RIGHT: Controls ─── */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Search */}
              <Suspense fallback={null}><GlobalSearch /></Suspense>

              {/* System group */}
              <div className="flex items-center border-l border-border/30 pl-1 ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Language">
                      <span className="text-sm leading-none">{currentLang.flag}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px]">
                    {LANG_OPTIONS.map(lang => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code as any)}
                        className={cn("gap-2 text-xs", currentLanguage === lang.code && "bg-accent")}
                      >
                        <span>{lang.flag}</span>
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <ThemeToggle />
              </div>

              {/* User group */}
              <div className="flex items-center border-l border-border/30 pl-1 ml-1">
                {user && <Suspense fallback={null}><NotificationBell /></Suspense>}
                {user && <Suspense fallback={null}><UserMenu /></Suspense>}
              </div>
            </div>
          </header>

          {/* ═══ PIPELINE CONTEXT BAR — below header, visible only when active ═══ */}
          {user && (
            <div className="hidden md:flex items-center justify-center border-b border-border/30 bg-muted/20 py-1.5 px-4 shrink-0">
              <Suspense fallback={null}>
                <CompactPipeline />
              </Suspense>
            </div>
          )}

          <div className="shrink-0">
            <Suspense fallback={null}><LowBalanceBanner /></Suspense>
            <Suspense fallback={null}><BehaviorOverlay /></Suspense>
          </div>

          {fullHeight ? (
            <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ErrorBoundary><PageTransition>{children}</PageTransition></ErrorBoundary>
            </main>
          ) : (
            <>
              <main id="main-content" className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
                <ErrorBoundary><PageTransition>{children}</PageTransition></ErrorBoundary>
                <Suspense fallback={null}><Footer /></Suspense>
              </main>
            </>
          )}
        </div>
      </div>
      <Suspense fallback={null}><MobileBottomNav /></Suspense>
      
      <Suspense fallback={null}>
        <ContextualFeedbackPrompt />
        <GamificationToasts />
      </Suspense>
    </SidebarProvider>
  );
}
