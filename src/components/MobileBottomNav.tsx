import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  Home, Brain, Upload, Menu,
  Sparkles, Rocket, BarChart3, Network,
  Store, Bot, Layers,
  Coins, Bell, FileText, ScrollText,
  User, LogOut, Eye,
  Terminal, Wallet, Trophy, Zap,
  Crown, TrendingUp, Shield, Database,
  DollarSign, PenTool, MessageCircle,
  Package, BookOpen, Wrench, Plug, FolderOpen,
  Cpu, Lock, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

/* Bottom bar: 4 core actions + hamburger */
const BAR_ITEMS = [
  { path: "/home", icon: Home, labelKey: "cockpit" },
  { path: "/services", icon: Sparkles, labelKey: "services" },
  { path: "/marketplace", icon: Store, labelKey: "marketplace" },
  { path: "/jobs", icon: Rocket, labelKey: "jobs" },
];

/* Command Center menu structure */
interface MenuSection {
  label: string;
  labelKey: string;
  icon: React.ElementType;
  zone?: string;
  items: { path: string; icon: React.ElementType; labelKey: string; adminOnly?: boolean }[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    label: "Execute",
    labelKey: "execute_section",
    icon: Zap,
    items: [
      { path: "/home", icon: Home, labelKey: "cockpit" },
      { path: "/services", icon: Sparkles, labelKey: "services" },
      { path: "/extractor", icon: Upload, labelKey: "extractor" },
      { path: "/home", icon: Terminal, labelKey: "command_center" },
      { path: "/jobs", icon: Rocket, labelKey: "jobs" },
    ],
  },
  {
    label: "Systems",
    labelKey: "systems_section",
    icon: Package,
    zone: "CORE",
    items: [
      { path: "/pipeline", icon: Layers, labelKey: "pipeline" },
      { path: "/master-agent", icon: Bot, labelKey: "master_agent" },
      { path: "/prompt-forge", icon: PenTool, labelKey: "prompt_forge" },
      { path: "/headline-generator", icon: Zap, labelKey: "headline_generator" },
    ],
  },
  {
    label: "Marketplace",
    labelKey: "marketplace_section",
    icon: Store,
    items: [
      { path: "/marketplace", icon: Store, labelKey: "marketplace" },
      { path: "/marketplace/drafts", icon: FileText, labelKey: "marketplace_drafts" },
      { path: "/marketplace/earnings", icon: DollarSign, labelKey: "marketplace_earnings" },
    ],
  },
  {
    label: "Intelligence",
    labelKey: "intelligence_section",
    icon: Brain,
    zone: "EXPANSION",
    items: [
      { path: "/intelligence", icon: Network, labelKey: "intelligence" },
      { path: "/topics", icon: Eye, labelKey: "topics" },
      { path: "/cognitive-units", icon: Database, labelKey: "cognitive_units" },
    ],
  },
  {
    label: "Creator",
    labelKey: "creator_section",
    icon: Crown,
    items: [
      { path: "/neurons", icon: Brain, labelKey: "neurons" },
      { path: "/library", icon: BookOpen, labelKey: "library" },
      { path: "/capitalization", icon: TrendingUp, labelKey: "capitalization" },
      { path: "/notebooks", icon: FileText, labelKey: "notebooks" },
    ],
  },
  {
    label: "Account",
    labelKey: "account_section",
    icon: User,
    items: [
      { path: "/profile", icon: User, labelKey: "profile" },
      { path: "/credits", icon: Coins, labelKey: "credits" },
      { path: "/wallet", icon: Wallet, labelKey: "wallet" },
      { path: "/notifications", icon: Bell, labelKey: "notifications" },
      { path: "/gamification", icon: Trophy, labelKey: "gamification" },
    ],
  },
  {
    label: "Learn",
    labelKey: "learn_section",
    icon: BookOpen,
    items: [
      { path: "/docs", icon: FileText, labelKey: "docs" },
      { path: "/changelog", icon: ScrollText, labelKey: "changelog" },
      { path: "/feedback", icon: MessageCircle, labelKey: "feedback" },
    ],
  },
  {
    label: "Control",
    labelKey: "control_section",
    icon: Shield,
    zone: "CONTROL",
    items: [
      { path: "/admin", icon: Shield, labelKey: "admin", adminOnly: true },
      { path: "/admin/kernel", icon: Cpu, labelKey: "kernel", adminOnly: true },
      { path: "/runtime", icon: Activity, labelKey: "runtime", adminOnly: true },
      { path: "/analytics", icon: BarChart3, labelKey: "analytics", adminOnly: true },
    ],
  },
  {
    label: "Infra",
    labelKey: "infra_section",
    icon: Wrench,
    items: [
      { path: "/services-catalog", icon: Database, labelKey: "services_catalog", adminOnly: true },
      { path: "/data-pipeline", icon: Layers, labelKey: "data_pipeline", adminOnly: true },
      { path: "/integrations", icon: Plug, labelKey: "integrations" },
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

  let lastZone: string | undefined;

  return (
    <>
      {/* Fixed bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
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
            <span className="text-[9px] font-medium leading-none">{t("common:more")}</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Command Center menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle className="text-base font-bold">AI-IDEI</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-0.5 pb-20">
            {MENU_SECTIONS.map((section) => {
              const visibleItems = section.items.filter(
                (item) => !item.adminOnly || isAdmin
              );
              if (visibleItems.length === 0) return null;
              const SectionIcon = section.icon;

              // Zone label
              let zoneLabel: React.ReactNode = null;
              if (section.zone && section.zone !== lastZone) {
                lastZone = section.zone;
                zoneLabel = (
                  <div className="px-4 pt-4 pb-0.5">
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                      {section.zone}
                    </span>
                  </div>
                );
              }

              return (
                <div key={section.labelKey}>
                  {zoneLabel}
                  <div className="flex items-center gap-1.5 px-4 pt-3 pb-1">
                    <SectionIcon className="h-3 w-3 text-muted-foreground/70" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t(`navigation:${section.labelKey}`)}
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
                        <span>{t(`navigation:${item.labelKey}`)}</span>
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
                className="flex items-center gap-3 w-full py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-lg px-2 transition-colors"
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
