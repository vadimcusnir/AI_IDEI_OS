/**
 * MobileBottomNav — 4 tabs + More sheet.
 * More sheet mirrors AppSidebar sections exactly. Single source of truth.
 */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier } from "@/hooks/useUserTier";
import {
  Home, BookOpen, Sparkles, Brain, Network, Store,
  Coins, Clock, Trophy, Shield, Cpu, Activity, BarChart3,
  Database, Menu, LogOut, Workflow, Gem, Plug, Zap, GraduationCap,
  User, Settings, Bell, Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

const BAR_ITEMS = [
  { path: "/home", icon: Home, labelKey: "command_center" },
  { path: "/pipeline", icon: Workflow, labelKey: "pipeline" },
  { path: "/library", icon: BookOpen, labelKey: "library" },
  { path: "/services", icon: Sparkles, labelKey: "services" },
];

interface MenuItem { path: string; icon: React.ElementType; labelKey: string; adminOnly?: boolean; operatorOnly?: boolean }
interface MenuSection { key: string; labelKey: string; items: MenuItem[]; adminOnly?: boolean; operatorOnly?: boolean }

// ═══ MIRROR OF AppSidebar SECTIONS — keep in sync ═══
const MENU_SECTIONS: MenuSection[] = [
  {
    key: "core", labelKey: "core", items: [
      { path: "/home", icon: Home, labelKey: "command_center" },
      { path: "/pipeline", icon: Workflow, labelKey: "pipeline" },
      { path: "/services", icon: Sparkles, labelKey: "services" },
      { path: "/library", icon: BookOpen, labelKey: "library" },
      { path: "/jobs", icon: Clock, labelKey: "jobs", operatorOnly: true },
    ],
  },
  {
    key: "economy", labelKey: "economy", items: [
      { path: "/credits", icon: Coins, labelKey: "credits" },
      { path: "/marketplace", icon: Store, labelKey: "marketplace" },
      { path: "/purchases", icon: Clock, labelKey: "purchases", operatorOnly: true },
    ],
  },
  {
    key: "intelligence", labelKey: "intelligence", operatorOnly: true, items: [
      { path: "/neurons", icon: Brain, labelKey: "neurons" },
      { path: "/intelligence", icon: Network, labelKey: "knowledge_graph" },
      { path: "/my-analytics", icon: BarChart3, labelKey: "my_analytics" },
    ],
  },
  {
    key: "tools", labelKey: "tools", items: [
      { path: "/deliverables", icon: Database, labelKey: "deliverables" },
      { path: "/learning", icon: GraduationCap, labelKey: "learning" },
      { path: "/gamification", icon: Trophy, labelKey: "progress" },
      { path: "/workspace", icon: Database, labelKey: "workspace", operatorOnly: true },
      { path: "/personal-os", icon: Cpu, labelKey: "personal_os", operatorOnly: true },
      { path: "/augmentation", icon: Zap, labelKey: "augmentation", operatorOnly: true },
      { path: "/vip", icon: Gem, labelKey: "vip_program", operatorOnly: true },
      { path: "/integrations", icon: Plug, labelKey: "integrations", operatorOnly: true },
    ],
  },
  {
    key: "admin", labelKey: "admin", adminOnly: true, items: [
      { path: "/admin", icon: Shield, labelKey: "admin_dashboard", adminOnly: true },
      { path: "/admin/control-center", icon: Activity, labelKey: "control_center", adminOnly: true },
      { path: "/admin/cost-engine", icon: Coins, labelKey: "cost_engine", adminOnly: true },
      { path: "/admin/kernel", icon: Cpu, labelKey: "kernel", adminOnly: true },
      { path: "/runtime", icon: Activity, labelKey: "runtime", adminOnly: true },
      { path: "/analytics", icon: BarChart3, labelKey: "analytics", adminOnly: true },
      { path: "/services-catalog", icon: Database, labelKey: "catalog", adminOnly: true },
    ],
  },
];

const MODE_KEY = "ai-idei-sidebar-mode";

export function MobileBottomNav() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { t } = useTranslation(["common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { tier } = useUserTier();

  // Read operator mode from localStorage (same key as AppSidebar)
  const isOperator = (() => {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === "operator") return true;
      if (stored === "user") return false;
      return isAdmin; // default: admin=operator, user=user
    } catch { return false; }
  })();

  if (!user) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNav = (path: string) => { navigate(path); setMenuOpen(false); };

  const tierLabel = tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE";
  const tierColor = tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/60";
  const creditPercent = Math.min((balance / 10000) * 100, 100);

  return (
    <>
      {/* Bottom bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-border/50 bg-background/95 backdrop-blur-lg",
        "pb-[env(safe-area-inset-bottom,0px)]",
      )}>
        <div className="flex items-stretch justify-around h-14 px-1">
          {BAR_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] relative",
                  "transition-colors active:scale-95",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className={cn("text-micro", active ? "font-bold" : "font-medium")}>{label}</span>
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />}
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] text-muted-foreground active:scale-95"
          >
            <Menu className="h-5 w-5" />
            <span className="text-micro font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Full navigation sheet — mirrors AppSidebar */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-3 border-b border-border/30">
            <SheetTitle className="text-base font-bold text-left">
              AI-<span className="text-primary">IDEI</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {MENU_SECTIONS.map((section) => {
              if (section.adminOnly && !isAdmin) return null;
              if (section.operatorOnly && !isOperator) return null;

              const items = section.items.filter(i => {
                if (i.adminOnly && !isAdmin) return false;
                if (i.operatorOnly && !isOperator) return false;
                return true;
              });
              if (!items.length) return null;

              return (
                <div key={section.key}>
                  <p className="text-nano font-bold uppercase tracking-[0.15em] text-muted-foreground/50 px-4 pt-4 pb-1.5">
                    {section.label}
                  </p>
                  {items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2.5 text-sm min-h-[44px] transition-colors",
                          active
                            ? "text-primary bg-primary/8 font-medium border-l-2 border-primary"
                            : "text-foreground hover:bg-muted/50 border-l-2 border-transparent"
                        )}
                      >
                        <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer: credit bar + user actions */}
          <div className="border-t border-border/30 p-3 space-y-1">
            {/* Credit bar */}
            <button
              onClick={() => handleNav("/credits")}
              className="w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn("text-nano font-bold uppercase tracking-wider", tierColor)}>
                  {tierLabel}
                </span>
                <span className="text-micro font-mono tabular-nums text-muted-foreground">
                  {balanceLoading ? "…" : balance.toLocaleString()}N
                </span>
              </div>
              <Progress value={creditPercent} className="h-1 bg-muted/60" />
            </button>

            {/* Mode indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-left">
              <Terminal className={cn("h-3.5 w-3.5", isOperator ? "text-primary" : "text-muted-foreground/40")} />
              <span className="text-micro font-mono tracking-wide text-muted-foreground">
                {isOperator ? "OPERATOR" : "USER"} MODE
              </span>
            </div>

            <button onClick={() => handleNav("/profile")} className="flex items-center gap-3 w-full py-2.5 px-3 text-sm hover:bg-muted/50 rounded-lg min-h-[44px]">
              <User className="h-4 w-4 text-muted-foreground" /> Profile
            </button>
            <button onClick={() => handleNav("/notifications")} className="flex items-center gap-3 w-full py-2.5 px-3 text-sm hover:bg-muted/50 rounded-lg min-h-[44px]">
              <Bell className="h-4 w-4 text-muted-foreground" /> Notifications
            </button>
            <button onClick={() => handleNav("/workspace")} className="flex items-center gap-3 w-full py-2.5 px-3 text-sm hover:bg-muted/50 rounded-lg min-h-[44px]">
              <Settings className="h-4 w-4 text-muted-foreground" /> Settings
            </button>
            <button
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full py-2.5 px-3 text-sm text-destructive hover:bg-destructive/10 rounded-lg min-h-[44px]"
            >
              <LogOut className="h-4 w-4" /> {t("common:sign_out")}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
