import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier, type UserTier } from "@/hooks/useUserTier";
import logo from "@/assets/logo.gif";
import {
  Brain, Shield, Upload, Sparkles, Briefcase, Coins,
  LogOut, Home, User, MessageCircle, ScrollText,
  BarChart3, Bell, BookOpen, Users, Network,
  FileText, Lightbulb, Bot, Store, Layers, MessagesSquare,
  Lock, ChevronRight, GraduationCap, Terminal,
  Wallet, Trophy, Eye, ShieldCheck,
  Activity,
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
  proOnly?: boolean;
  minTier?: UserTier;
}

interface NavSection {
  labelKey: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
  /** Minimum tier to see this entire section */
  minTier?: UserTier;
  /** Only show when user is authenticated */
  authOnly?: boolean;
}

/*
 * Navigation Architecture v4 — Role-based adaptation
 * Sections adapt based on user tier: free → authenticated → pro → vip → admin
 * Progressive disclosure: visitors see Explore+Learn, auth users see Create+Operate
 */

/** Sections visible to everyone (including visitors) */
const PUBLIC_SECTIONS: NavSection[] = [
  {
    labelKey: "explore_section",
    icon: Eye,
    defaultOpen: true,
    items: [
      { labelKey: "topics", to: "/topics", icon: Lightbulb, controlId: "nav.topics" },
      { labelKey: "marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { labelKey: "community", to: "/community", icon: MessagesSquare, controlId: "nav.community" },
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

/** Sections for authenticated users */
const AUTH_SECTIONS: NavSection[] = [
  {
    labelKey: "core_section",
    icon: Home,
    defaultOpen: true,
    authOnly: true,
    items: [
      { labelKey: "cockpit", to: "/home", icon: Home, controlId: "nav.home" },
      { labelKey: "extractor", to: "/extractor", icon: Upload, controlId: "nav.extractor" },
      { labelKey: "neurons", to: "/neurons", icon: Brain, controlId: "nav.neurons" },
      { labelKey: "services", to: "/services", icon: Sparkles, controlId: "nav.services" },
      { labelKey: "jobs", to: "/jobs", icon: Briefcase, controlId: "nav.jobs" },
      { labelKey: "library", to: "/library", icon: BookOpen, controlId: "nav.library" },
      { labelKey: "credits", to: "/credits", icon: Coins, controlId: "nav.credits" },
    ],
  },
  {
    labelKey: "tools_section",
    icon: Sparkles,
    authOnly: true,
    items: [
      { labelKey: "transcribe", to: "/transcribe", icon: FileText, controlId: "nav.transcribe" },
      { labelKey: "prompt_forge", to: "/prompt-forge", icon: Bot, controlId: "nav.prompt-forge", minTier: "pro" as UserTier },
      { labelKey: "profile_extractor", to: "/profile-extractor", icon: Users, controlId: "nav.profile-extractor" },
      { labelKey: "chat", to: "/chat", icon: Terminal, controlId: "nav.chat" },
      { labelKey: "pipeline", to: "/pipeline", icon: Layers, controlId: "nav.pipeline" },
    ],
  },
  {
    labelKey: "explore_section",
    icon: Eye,
    authOnly: true,
    items: [
      { labelKey: "topics", to: "/topics", icon: Lightbulb, controlId: "nav.topics" },
      { labelKey: "intelligence", to: "/intelligence", icon: Network, controlId: "nav.intelligence", minTier: "pro" as UserTier },
      { labelKey: "marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { labelKey: "community", to: "/community", icon: MessagesSquare, controlId: "nav.community" },
    ],
  },
  {
    labelKey: "account_section",
    icon: User,
    authOnly: true,
    items: [
      { labelKey: "profile", to: "/profile", icon: User, controlId: "nav.profile" },
      { labelKey: "wallet", to: "/wallet", icon: Wallet, controlId: "nav.wallet" },
      { labelKey: "notifications", to: "/notifications", icon: Bell, controlId: "nav.notifications" },
      { labelKey: "gamification", to: "/gamification", icon: Trophy, controlId: "nav.gamification" },
    ],
  },
  {
    labelKey: "learn_section",
    icon: GraduationCap,
    authOnly: true,
    items: [
      { labelKey: "docs", to: "/docs", icon: FileText, controlId: "nav.docs" },
      { labelKey: "changelog", to: "/changelog", icon: ScrollText, controlId: "nav.changelog" },
      { labelKey: "feedback", to: "/feedback", icon: MessageCircle, controlId: "nav.feedback" },
    ],
  },
];

const ADMIN_SECTION: NavSection = {
  labelKey: "admin_section",
  icon: Shield,
  items: [
    { labelKey: "admin", to: "/admin", icon: Shield, adminOnly: true },
    { labelKey: "runtime", to: "/runtime", icon: Activity, adminOnly: true },
    { labelKey: "analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
    { labelKey: "security", to: "/security", icon: ShieldCheck, adminOnly: true },
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

  // ─── Role-based section resolution ───
  const resolvedSections = (() => {
    if (!user) {
      // Visitor: only public sections
      return PUBLIC_SECTIONS;
    }
    // Authenticated user: full sections
    const sections = [...AUTH_SECTIONS];
    if (isAdmin) sections.push(ADMIN_SECTION);
    return sections;
  })();

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <button onClick={() => navigate(user ? "/home" : "/")} className="flex items-center gap-2.5 px-1 py-1">
          <img src={logo} alt="AI-IDEI" className="h-7 w-7 rounded-full shrink-0" />
          {!collapsed && <span className="text-sm font-bold tracking-tight">AI-IDEI</span>}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Workspace & Credits — compact */}
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

      {/* Navigation — role-adaptive sections */}
      <SidebarContent>
        {resolvedSections.map((section, idx) => {
          const visibleItems = section.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          const hasActive = sectionHasActive(section);
          const SectionIcon = section.icon;

          // In collapsed mode, just show items flat
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
                              <item.icon className="h-4 w-4" />
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

          // Expanded mode: collapsible sections with progressive disclosure
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
                              <button onClick={() => navigate(item.to)} className="w-full">
                                <item.icon className="h-4 w-4" />
                                <span className="flex-1">{t(`navigation:${item.labelKey}`)}</span>
                                {item.proOnly && (
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

      {/* Footer */}
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
