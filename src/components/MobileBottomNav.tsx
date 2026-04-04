/**
 * MobileBottomNav — 4 tabs + More sheet.
 * Aligned 1:1 with sidebar sections. Zero redundancy.
 */
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  Home, BookOpen, Sparkles, Brain, Network, Store,
  Coins, Clock, Trophy, Shield, Cpu, Activity, BarChart3,
  Database, Menu, LogOut, Workflow, Gem, Plug,
  User, Settings, Bell, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const BAR_ITEMS = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/pipeline", icon: Workflow, label: "Pipeline" },
  { path: "/library", icon: BookOpen, label: "Library" },
  { path: "/services", icon: Sparkles, label: "Services" },
];

interface MenuItem { path: string; icon: React.ElementType; label: string; adminOnly?: boolean }
interface MenuSection { key: string; label: string; items: MenuItem[]; adminOnly?: boolean }

const MENU_SECTIONS: MenuSection[] = [
  {
    key: "core", label: "CORE", items: [
      { path: "/home", icon: Home, label: "Command Center" },
      { path: "/pipeline", icon: Workflow, label: "Pipeline" },
      { path: "/library", icon: BookOpen, label: "Library" },
      { path: "/jobs", icon: Clock, label: "Jobs" },
    ],
  },
  {
    key: "economy", label: "ECONOMY", items: [
      { path: "/credits", icon: Coins, label: "Credits" },
    ],
  },
  {
    key: "intelligence", label: "INTELLIGENCE", items: [
      { path: "/neurons", icon: Brain, label: "Neurons" },
      { path: "/intelligence", icon: Network, label: "Knowledge Graph" },
    ],
  },
  {
    key: "expansion", label: "EXPANSION", items: [
      { path: "/services", icon: Sparkles, label: "Services" },
      { path: "/marketplace", icon: Store, label: "Marketplace" },
      { path: "/gamification", icon: Trophy, label: "Progress" },
      { path: "/vip", icon: Gem, label: "VIP Program" },
      { path: "/integrations", icon: Plug, label: "Integrations" },
    ],
  },
  {
    key: "admin", label: "ADMIN", adminOnly: true, items: [
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
  const { t } = useTranslation(["common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleNav = (path: string) => { navigate(path); setMenuOpen(false); };

  return (
    <>
      {/* Bottom bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-border/50 bg-background/95 backdrop-blur-lg",
        "pb-[env(safe-area-inset-bottom,0px)]",
        location.pathname === "/home" && "translate-y-full pointer-events-none"
      )}>
        <div className="flex items-stretch justify-around h-14 px-1">
          {BAR_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px]",
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

      {/* Full navigation sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
          <SheetHeader className="p-4 pb-3 border-b border-border/30">
            <SheetTitle className="text-sm font-bold text-left">Navigation</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {MENU_SECTIONS.map((section) => {
              if (section.adminOnly && !isAdmin) return null;
              const items = section.items.filter(i => !i.adminOnly || isAdmin);
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

          {/* Footer: user actions */}
          <div className="border-t border-border/30 p-3 space-y-0.5">
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
