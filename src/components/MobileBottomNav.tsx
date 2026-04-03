import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  Home, Upload, BookOpen, Sparkles, User,
  Brain, Network, Database, Layers,
  Trophy, TrendingUp, Store,
  Wallet, Coins, BarChart3,
  Settings, Code, Shield, Lock,
  Crown, Rocket, Menu,
  Cpu, Activity, Clock, Zap, LogOut, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

/* ── Bottom bar: 4 core actions + hamburger ── */
const BAR_ITEMS = [
  { path: "/home", icon: Home, labelKey: "cockpit" },
  { path: "/services", icon: Sparkles, labelKey: "services" },
  { path: "/marketplace", icon: Store, labelKey: "marketplace" },
  { path: "/jobs", icon: Rocket, labelKey: "jobs" },
];

/* ── Menu structure — mirrors AppSidebar SYSTEM_MAP exactly ── */
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
      { path: "/extractor", icon: Upload, label: "Extractor" },
      { path: "/library", icon: BookOpen, label: "Library" },
      { path: "/jobs", icon: Clock, label: "Jobs" },
    ],
  },
  {
    key: "intelligence",
    label: "INTELLIGENCE",
    icon: Brain,
    items: [
      { path: "/neurons", icon: Brain, label: "Neurons" },
      { path: "/intelligence", icon: Network, label: "Knowledge Graph" },
      { path: "/data-pipeline", icon: Database, label: "Data Pipeline" },
    ],
  },
  {
    key: "production",
    label: "PRODUCTION",
    icon: Sparkles,
    items: [
      { path: "/services", icon: Sparkles, label: "Services" },
      { path: "/programs", icon: Crown, label: "Programs" },
      { path: "/pipeline", icon: Layers, label: "Pipelines" },
      { path: "/master-agent", icon: Zap, label: "Master Agent" },
    ],
  },
  {
    key: "growth",
    label: "GROWTH",
    icon: Trophy,
    items: [
      { path: "/gamification", icon: Trophy, label: "Progress" },
      { path: "/community", icon: TrendingUp, label: "Leaderboard" },
      { path: "/marketplace", icon: Store, label: "Marketplace" },
    ],
  },
  {
    key: "economy",
    label: "ECONOMY",
    icon: Wallet,
    items: [
      { path: "/credits", icon: Coins, label: "Wallet" },
      { path: "/pricing", icon: Wallet, label: "Pricing" },
      { path: "/wallet", icon: BarChart3, label: "Usage" },
    ],
  },
  {
    key: "control",
    label: "CONTROL",
    icon: Settings,
    items: [
      { path: "/profile", icon: User, label: "Profile" },
      { path: "/workspace", icon: Settings, label: "Workspace" },
      { path: "/docs", icon: Code, label: "API & Docs" },
      { path: "/data-privacy", icon: Shield, label: "Data Privacy" },
    ],
  },
  {
    key: "elite",
    label: "ELITE",
    icon: Crown,
    items: [
      { path: "/vip", icon: Crown, label: "VIP Dashboard" },
      { path: "/cusnir-os", icon: Lock, label: "Cusnir_OS" },
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

  return (
    <>
      {/* Fixed bottom bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom transition-transform duration-200",
        location.pathname === "/home" && "translate-y-full pointer-events-none"
      )}>
        <div className="flex items-center justify-around h-16 px-1">
          {BAR_ITEMS.map(({ path, icon: Icon, labelKey }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[56px] min-h-[44px]",
                  active
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-all", active && "stroke-[2.5]")} />
                <span className={cn("text-[10px] leading-none transition-all", active ? "font-bold" : "font-medium")}>
                  {t(`navigation:${labelKey}`)}
                </span>
                {active && (
                  <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[56px] min-h-[44px]",
              menuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{t("common:more")}</span>
          </button>
        </div>
      </nav>

      {/* Slide-out menu — mirrors sidebar structure */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-base font-bold">AI-IDEI</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-0.5 pb-20">
            {MENU_SECTIONS.map((section) => {
              if (section.adminOnly && !isAdmin) return null;

              const visibleItems = section.items.filter(
                (item) => !item.adminOnly || isAdmin
              );
              if (visibleItems.length === 0) return null;

              const SectionIcon = section.icon;

              return (
                <div key={section.key}>
                  <div className="flex items-center gap-1.5 px-4 pt-4 pb-1">
                    <SectionIcon className="h-3 w-3 text-muted-foreground/50" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
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
                          "flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors min-h-[44px]",
                          active
                            ? "text-primary bg-primary/10 font-medium"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Sign out */}
            <div className="border-t border-border mt-2 pt-2 px-4">
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full py-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors min-h-[44px]"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("common:sign_out")}</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
