import { ReactNode, useEffect, useRef, lazy, Suspense, memo } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useTranslation } from "react-i18next";
import { useDailyActivity } from "@/hooks/useDailyActivity";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { prefetchUIControls } from "@/hooks/useUIControl";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Lazy-load non-critical components
const LowBalanceBanner = lazy(() => import("@/components/credits/LowBalanceBanner").then(m => ({ default: m.LowBalanceBanner })));
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
  /** If true, the content uses full viewport height (no footer, no scroll header). E.g. NeuronEditor */
  fullHeight?: boolean;
}

export function AppLayout({ children, fullHeight = false }: AppLayoutProps) {
  const { direction, isAtTop } = useScrollDirection();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  usePageTracking();
  useDailyActivity();

  // Prefetch UI control registry once on mount
  const prefetched = useRef(false);
  useEffect(() => {
    if (!prefetched.current) {
      prefetched.current = true;
      prefetchUIControls();
    }
  }, []);

  const currentLang = LANG_OPTIONS.find(l => l.code === i18n.language) || LANG_OPTIONS[0];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile-first scroll-aware header */}
          <header
            className={cn(
              "sticky top-0 z-40 h-[var(--header-height)] flex items-center border-b border-border bg-background/90 backdrop-blur-md px-3 gap-2 transition-transform duration-200",
              "md:translate-y-0",
              direction === "down" && !isAtTop
                ? "-translate-y-full md:translate-y-0"
                : "translate-y-0"
            )}
          >
            <SidebarTrigger />
            <AppBreadcrumbs />
            <div className="flex-1" />
            <Suspense fallback={null}><GlobalSearch /></Suspense>
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
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={cn("gap-2 text-xs", i18n.language === lang.code && "bg-accent")}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            {user && <Suspense fallback={null}><NotificationBell /></Suspense>}
            {user && <Suspense fallback={null}><UserMenu /></Suspense>}
          </header>

          {user && (
            <div className="border-b border-border px-3 py-1.5 bg-card/50">
              <Suspense fallback={null}><PipelineIndicatorCompact /></Suspense>
            </div>
          )}

          <Suspense fallback={null}><LowBalanceBanner /></Suspense>

          {fullHeight ? (
            <main className="flex-1 flex flex-col min-h-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          ) : (
            <>
              <main className="flex-1 flex flex-col pb-16 md:pb-0">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <Suspense fallback={null}><Footer /></Suspense>
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
