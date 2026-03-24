import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier, type UserTier } from "@/hooks/useUserTier";
import { Logo } from "@/components/shared/Logo";
import {
  Brain, Shield, Sparkles, Coins,
  LogOut, Home, User, ScrollText,
  BarChart3, Bell, BookOpen, Network,
  FileText, Bot, Store, Layers,
  Lock, ChevronRight, GraduationCap, Terminal,
  Wallet, Trophy, Activity,
  Zap, Plug, Database, Crown,
  Rocket, Code, FolderOpen,
  Package, TrendingUp, Eye, Cpu, Wrench,
  DollarSign, PenTool, MessageCircle, Upload,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StreakWidget } from "@/components/gamification/StreakWidget";
import { XPProgressBar } from "@/components/gamification/XPProgressBar";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ControlledNavItem } from "@/components/ControlledNavItem";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  controlId?: string;
  minTier?: UserTier;
  highlight?: boolean;
}

interface NavSection {
  labelKey: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
  minTier?: UserTier;
  authOnly?: boolean;
  adminOnly?: boolean;
}

/*
 * SINGLE SIDEBAR — CENTRALIZED CONTROL
 * Sections: PRIMARY → OPERATIONS → SYSTEM → EXPANSION → USER
 * Max 5 items per section. Icons-only when collapsed.
 */

const PUBLIC_SECTIONS: NavSection[] = [
  {
    labelKey: "explore_section",
    icon: Eye,
    defaultOpen: true,
    items: [
      { labelKey: "marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { labelKey: "community", to: "/community", icon: MessageCircle, controlId: "nav.community" },
      { labelKey: "library", to: "/library", icon: BookOpen, controlId: "nav.library" },
    ],
  },
  {
    labelKey: "learn_section",
    icon: GraduationCap,
    items: [
      { labelKey: "docs", to: "/docs", icon: FileText, controlId: "nav.docs" },
      { labelKey: "changelog", to: "/changelog", icon: ScrollText, controlId: "nav.changelog" },
    ],
  },
];

const AUTH_SECTIONS: NavSection[] = [
  // ═══ PRIMARY — Home + Execute ═══
  {
    labelKey: "execute_section",
    icon: Zap,
    defaultOpen: true,
    authOnly: true,
    items: [
      { labelKey: "cockpit", to: "/home", icon: Home, controlId: "nav.home", highlight: true },
      { labelKey: "services", to: "/services", icon: Sparkles, controlId: "nav.services" },
    ],
  },

  // ═══ OPERATIONS — Generate, Extract, Jobs ═══
  {
    labelKey: "operations_section",
    icon: Rocket,
    authOnly: true,
    items: [
      { labelKey: "extractor", to: "/extractor", icon: Upload, controlId: "nav.extractor" },
      { labelKey: "jobs", to: "/jobs", icon: Rocket, controlId: "nav.jobs" },
      { labelKey: "pipeline", to: "/pipeline", icon: Layers, controlId: "nav.pipeline" },
    ],
  },

  // ═══ SYSTEM — Marketplace, Library ═══
  {
    labelKey: "systems_section",
    icon: Package,
    authOnly: true,
    items: [
      { labelKey: "marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { labelKey: "master_agent", to: "/master-agent", icon: Bot, controlId: "nav.master-agent" },
      { labelKey: "prompt_forge", to: "/prompt-forge", icon: PenTool, controlId: "nav.prompt-forge", minTier: "pro" as UserTier },
    ],
  },

  // ═══ EXPANSION — Intelligence, Creator ═══
  {
    labelKey: "intelligence_section",
    icon: Brain,
    authOnly: true,
    minTier: "pro" as UserTier,
    items: [
      { labelKey: "intelligence", to: "/intelligence", icon: Network, controlId: "nav.intelligence" },
      { labelKey: "neurons", to: "/neurons", icon: Brain, controlId: "nav.neurons" },
      { labelKey: "library", to: "/library", icon: BookOpen, controlId: "nav.library" },
      { labelKey: "capitalization", to: "/capitalization", icon: TrendingUp, controlId: "nav.capitalization" },
    ],
  },

  // ═══ USER — Account ═══
  {
    labelKey: "account_section",
    icon: User,
    authOnly: true,
    items: [
      { labelKey: "profile", to: "/profile", icon: User, controlId: "nav.profile" },
      { labelKey: "credits", to: "/credits", icon: Coins, controlId: "nav.credits" },
      { labelKey: "notifications", to: "/notifications", icon: Bell, controlId: "nav.notifications" },
    ],
  },
];

const CONTROL_SECTION: NavSection = {
  labelKey: "control_section",
  icon: Shield,
  items: [
    { labelKey: "admin", to: "/admin", icon: Shield, adminOnly: true },
    { labelKey: "kernel", to: "/admin/kernel", icon: Cpu, adminOnly: true },
    { labelKey: "runtime", to: "/runtime", icon: Activity, adminOnly: true },
    { labelKey: "analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
    { labelKey: "security", to: "/security", icon: Shield, adminOnly: true },
  ],
};

const INFRA_SECTION: NavSection = {
  labelKey: "infra_section",
  icon: Wrench,
  items: [
    { labelKey: "services_catalog", to: "/services-catalog", icon: Database, adminOnly: true },
    { labelKey: "data_pipeline", to: "/data-pipeline", icon: Layers, adminOnly: true },
    { labelKey: "integrations", to: "/integrations", icon: Plug, controlId: "nav.integrations" },
  ],
};

export function AppSidebar() {
  const { t } = useTranslation(["navigation", "common"]);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { tier } = useUserTier();

  const TIER_ORDER: Record<UserTier, number> = { free: 0, authenticated: 1, pro: 2, vip: 3 };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const sectionHasActive = (section: NavSection) =>
    section.items.some((item) => isActive(item.to));

  const isItemVisible = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.minTier && TIER_ORDER[tier] < TIER_ORDER[item.minTier]) return false;
    return true;
  };

  const resolvedSections = (() => {
    if (!user) return PUBLIC_SECTIONS;
    const sections = [...AUTH_SECTIONS];
    if (isAdmin) {
      sections.push(CONTROL_SECTION);
      sections.push(INFRA_SECTION);
    }
    return sections;
  })();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <button onClick={() => navigate(user ? "/home" : "/")} className="flex items-center gap-2.5 px-1 py-1">
          <Logo size="h-7 w-7" className="shrink-0" loading="eager" />
          {!collapsed && <span className="text-sm font-bold tracking-tight">AI-IDEI</span>}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Credits widget */}
      {user && !collapsed && (
        <div className="px-3 py-2 space-y-2">
          <WorkspaceSwitcher collapsed={false} />
          <button
            onClick={() => navigate("/credits")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <Coins className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                {t("common:neurons_currency")}
              </span>
              <span className="text-sm font-mono font-bold text-primary">
                {balanceLoading ? "…" : balance.toLocaleString()}
              </span>
            </div>
          </button>
          <div className="flex items-center gap-2 px-1">
            <StreakWidget />
            <div className="flex-1 min-w-0">
              <XPProgressBar compact />
            </div>
          </div>
        </div>
      )}
      {user && collapsed && (
        <div className="flex flex-col items-center gap-2 py-2">
          <WorkspaceSwitcher collapsed={true} />
          <button
            onClick={() => navigate("/credits")}
            className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/15 transition-colors"
            title={`${balance} ${t("common:neurons_currency")}`}
          >
            <Coins className="h-4 w-4 text-primary" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <SidebarContent>
        {resolvedSections.map((section, idx) => {
          const visibleItems = section.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          const hasActive = sectionHasActive(section);
          const SectionIcon = section.icon;

          if (collapsed) {
            return (
              <SidebarGroup key={section.labelKey}>
                {idx > 0 && <SidebarSeparator className="my-1" />}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => {
                      const menuItem = (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive(item.to)}
                            tooltip={t(`navigation:${item.labelKey}`)}
                          >
                            <button onClick={() => navigate(item.to)} className="w-full">
                              <item.icon className={cn("h-4 w-4", item.highlight && !isActive(item.to) && "text-primary")} />
                            </button>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                      if (item.controlId) {
                        return (
                          <ControlledNavItem key={item.to} elementId={item.controlId}>
                            {menuItem}
                          </ControlledNavItem>
                        );
                      }
                      return menuItem;
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          return (
            <Collapsible
              key={section.labelKey}
              defaultOpen={section.defaultOpen || hasActive}
              className="group/collapsible"
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="text-[10px] cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1.5">
                    <SectionIcon className="h-3 w-3 text-muted-foreground/70" />
                    <span className="flex-1">{t(`navigation:${section.labelKey}`)}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {visibleItems.map((item) => {
                        const menuItem = (
                          <SidebarMenuItem key={item.to}>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive(item.to)}
                              tooltip={t(`navigation:${item.labelKey}`)}
                            >
                              <button onClick={() => navigate(item.to)} className={cn(
                                "w-full",
                                item.highlight && !isActive(item.to) && "text-primary font-medium"
                              )}>
                                <item.icon className="h-4 w-4" />
                                <span className="flex-1">{t(`navigation:${item.labelKey}`)}</span>
                                {item.minTier && (
                                  <Lock className="h-2.5 w-2.5 text-primary/50 shrink-0" />
                                )}
                              </button>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );

                        if (item.controlId) {
                          return (
                            <ControlledNavItem key={item.to} elementId={item.controlId}>
                              {menuItem}
                            </ControlledNavItem>
                          );
                        }
                        return menuItem;
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              {!collapsed && <ThemeToggle />}
              {user ? (
                <SidebarMenuButton
                  tooltip={t("common:sign_out")}
                  className={cn(collapsed ? "w-full" : "w-auto flex-shrink-0")}
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>{t("common:sign_out")}</span>}
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  tooltip="Sign In"
                  className={cn(collapsed ? "w-full" : "w-auto flex-shrink-0")}
                  onClick={() => navigate("/auth")}
                >
                  <User className="h-4 w-4" />
                  {!collapsed && <span>Sign In</span>}
                </SidebarMenuButton>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
