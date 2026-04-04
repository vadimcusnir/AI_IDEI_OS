/**
 * MobileBottomNav — Mobile-first bottom navigation bar.
 * 5 tabs: Home, Pipeline, Services, Library, More (hamburger)
 * Hamburger opens full navigation sheet.
 * Respects safe-area-inset-bottom for notched devices.
 */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import {
  Home, BookOpen, Sparkles,
  Brain, Network, Store,
  Coins, Clock, Trophy, Wallet,
  Shield, Cpu, Activity, BarChart3, Database,
  Menu, LogOut, Workflow, Gem, Plug, X,
  User, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

/* ── Bottom bar: 4 core actions + hamburger ── */
const BAR_ITEMS = [
  { path: "/home", icon: Home, labelKey: "cockpit" },
  { path: "/pipeline", icon: Workflow, labelKey: "pipeline" },
  { path: "/services", icon: Sparkles, labelKey: "services" },
  { path: "/library", icon: BookOpen, labelKey: "library" },
];

/* ── Menu structure ── */
interface MenuSection {
  key: string;
  label: string;
  icon: React.ElementType;
  items: { path: string; icon: React.ElementType; label: string; adminOnly?: boolean }[];
  adminOnly?: boolean;
}

const MENU_SECTIONS: MenuSection[] = [
  {
    key: "core",
    label: "CORE",
    icon: Home,
    items: [
      { path: "/home", icon: Home, label: "Command Center" },
      { path: "/pipeline", icon: Workflow, label: "Pipeline" },
    ],
  },
  {
    key: "work",
    label: "WORK",
    icon: BookOpen,
    items: [
      { path: "/library", icon: BookOpen, label: "Library" },
      { path: "/jobs", icon: Clock, label: "Jobs" },
      { path: "/credits", icon: Coins, label: "Credits" },
      { path: "/wallet", icon: Wallet, label: "Wallet" },
    ],
  },
  {
    key: "discover",
    label: "DISCOVER",
    icon: Sparkles,
    items: [
      { path: "/services", icon: Sparkles, label: "Services" },
      { path: "/neurons", icon: Brain, label: "Neurons" },
      { path: "/intelligence", icon: Network, label: "Knowledge Graph" },
      { path: "/marketplace", icon: Store, label: "Marketplace" },
      { path: "/gamification", icon: Trophy, label: "Progress" },
      { path: "/vip", icon: Gem, label: "VIP Program" },
      { path: "/integrations", icon: Plug, label: "Integrations" },
    ],
  },
  {
    key: "admin",
    label: "ADMIN",
    icon: Shield,
    adminOnly: true,
    items: [
      { path: "/admin", icon: Shield, label: "Dashboard", adminOnly: true },
      { path: "/admin/kernel", icon: Cpu, label: "Kernel", adminOnly: true },
      { path: "/runtime", icon: Activity, label: "Runtime", adminOnly: true },
      { path: "/analytics", icon: BarChart3, label: "Analytics", adminOnly: true },
      { path: "/services-catalog", icon: Database, label: "Catalog", adminOnly: true },
    ],
  },
];

export function MobileBottomNav() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { balance } = useCreditBalance();
  const { tier } = useUserTier();
  const { t } = useTranslation(["navigation", "common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNav = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const initials = (user.email || "U").slice(0, 2).toUpperCase();
  const tierLabel = tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE";
  const tierColor = tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/60";
  const creditPercent = Math.min((balance / 10000) * 100, 100);

  return (
    <>
      {/* ── Fixed bottom bar ── */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-border/50 bg-background/95 backdrop-blur-lg",
        "pb-[env(safe-area-inset-bottom,0px)]",
        "transition-transform duration-200",
        location.pathname === "/home" && "translate-y-full pointer-events-none"
      )}>
        <div className="flex items-stretch justify-around h-14 px-1">
          {BAR_ITEMS.map(({ path, icon: Icon, labelKey }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px]",
                  "transition-colors duration-150 active:scale-95",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className={cn(
                  "text-[10px] leading-none",
                  active ? "font-bold" : "font-medium"
                )}>
                  {t(`navigation:${labelKey}`)}
                </span>
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px]",
              "transition-colors duration-150 active:scale-95",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{t("common:more")}</span>
          </button>
        </div>
      </nav>

      {/* ── Full navigation sheet ── */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
          {/* Sheet header — user identity */}
          <SheetHeader className="p-4 pb-3 border-b border-border/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(
                  "text-sm font-semibold",
                  tier === "vip" ? "bg-tier-vip/15 text-tier-vip"
                    : tier === "pro" ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-sm font-semibold truncate text-left">
                  {user.email?.split("@")[0]}
                </SheetTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", tierColor)}>
                    {tierLabel}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">·</span>
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                    {balance.toLocaleString()}N
                  </span>
                </div>
              </div>
            </div>
            {/* Credit progress */}
            <Progress value={creditPercent} className="h-1 mt-2 bg-muted/40" />
          </SheetHeader>

          {/* Navigation sections */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col pb-4">
              {MENU_SECTIONS.map((section) => {
                if (section.adminOnly && !isAdmin) return null;

                const visibleItems = section.items.filter(
                  (item) => !item.adminOnly || isAdmin
                );
                if (visibleItems.length === 0) return null;

                const SectionIcon = section.icon;

                return (
                  <div key={section.key}>
                    <div className="flex items-center gap-1.5 px-4 pt-4 pb-1.5">
                      <SectionIcon className="h-3 w-3 text-muted-foreground/40" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                        {section.label}
                      </p>
                    </div>
                    {visibleItems.map((item) => {
                      const active = isActive(item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNav(item.path)}
                          className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors min-h-[44px]",
                            active
                              ? "text-primary bg-primary/8 font-medium border-l-2 border-primary"
                              : "text-foreground hover:bg-muted/50 border-l-2 border-transparent"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                          <span className="flex-1 text-left">{item.label}</span>
                          {active && <ChevronRight className="h-3.5 w-3.5 text-primary/50" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sheet footer — Profile + Sign out */}
          <div className="border-t border-border/30 p-3 space-y-1">
            <button
              onClick={() => handleNav("/profile")}
              className="flex items-center gap-3 w-full py-2.5 px-3 text-sm hover:bg-muted/50 rounded-lg transition-colors min-h-[44px]"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full py-2.5 px-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("common:sign_out")}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
