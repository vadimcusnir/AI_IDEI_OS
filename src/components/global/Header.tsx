/**
 * CANONICAL GLOBAL HEADER — components/global/Header.tsx
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Single source of truth for all authenticated app pages.
 * No page may define its own <header> — only this component.
 *
 * Structure: BrandZone | Center (spacer/presence) | ActionsZone
 * Tokens:    --header-height, --background, --border, --foreground
 * Behavior:  Desktop: always visible. Mobile: hide on scroll-down, show on scroll-up.
 */

import { lazy, Suspense, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/hooks/useLocale";
import { useScrollDirection } from "@/hooks/useScrollDirection";

// Lazy-load non-critical header widgets
const GlobalSearch = lazy(() => import("@/components/GlobalSearch").then(m => ({ default: m.GlobalSearch })));
const NotificationBell = lazy(() => import("@/components/NotificationBell").then(m => ({ default: m.NotificationBell })));
const UserMenu = lazy(() => import("@/components/UserMenu").then(m => ({ default: m.UserMenu })));
const PresenceBar = lazy(() => import("@/components/collaboration/PresenceBar").then(m => ({ default: m.PresenceBar })));

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

/* ─── Sub-zones ─── */

function BrandZone() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Link
        to="/home"
        className="flex items-center gap-1.5 group min-h-[44px] min-w-[44px] items-center"
        aria-label="AI-IDEI Home"
      >
        <div className="h-6 w-6 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors">
          <Brain className="h-3.5 w-3.5 text-[hsl(var(--gold-oxide))]" />
        </div>
        <span className="text-sm font-bold tracking-tight hidden sm:inline text-foreground">
          AI-IDEI
        </span>
      </Link>
      <div className="hidden md:block ml-1">
        <AppBreadcrumbs />
      </div>
    </div>
  );
}

function ActionsZone() {
  const { user } = useAuth();
  const { currentLanguage, changeLanguage } = useLocale();
  const currentLang = LANG_OPTIONS.find(l => l.code === currentLanguage) || LANG_OPTIONS[0];

  return (
    <div className="flex items-center gap-1 shrink-0">
      {/* Search */}
      <Suspense fallback={null}><GlobalSearch /></Suspense>

      {/* System group */}
      <div className="flex items-center border-l border-border/30 pl-1 ml-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 min-h-[44px] min-w-[44px]" aria-label="Change language">
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
  );
}

/* ─── Main Header ─── */

export function Header() {
  const { user } = useAuth();
  const { direction, isAtTop } = useScrollDirection();

  return (
    <header
      role="banner"
      aria-label="Main navigation"
      className={cn(
        "shrink-0 z-40 h-[var(--header-height)] flex items-center",
        "border-b border-border/40 bg-background/95 backdrop-blur-sm",
        "px-3 sm:px-4",
        // Mobile: hide on scroll down, show on scroll up
        "transition-transform duration-200 md:translate-y-0",
        direction === "down" && !isAtTop
          ? "-translate-y-full md:translate-y-0"
          : "translate-y-0"
      )}
    >
      {/* ─── LEFT: Brand ─── */}
      <BrandZone />

      {/* ─── CENTER: Presence + Spacer ─── */}
      <div className="flex-1 min-w-0 flex items-center justify-center">
        {user && <Suspense fallback={null}><PresenceBar /></Suspense>}
      </div>

      {/* ─── RIGHT: Actions ─── */}
      <ActionsZone />
    </header>
  );
}
