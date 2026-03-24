import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier, type UserTier } from "@/hooks/useUserTier";
import { useChatHistory } from "@/hooks/useChatHistory";
import { Logo } from "@/components/shared/Logo";
import {
  Brain, Shield, Sparkles, Coins,
  LogOut, Home, User, ScrollText,
  BarChart3, Bell, BookOpen, Network,
  FileText, Bot, Store, Layers,
  Lock, ChevronRight, GraduationCap,
  Wallet, Trophy, Activity,
  Zap, Plug, Database, Crown,
  Rocket, Code, FolderOpen,
  Package, TrendingUp, Eye, Cpu, Wrench,
  DollarSign, PenTool, MessageCircle, Upload,
  Clock, Trash2, Plus,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import { toast } from "sonner";

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
 * SIDEBAR — MINIMAL CONTEXT SWITCHER
 * Max 5 primary items (flat, no collapsible)
 * Sessions below
 * Admin only for admins (collapsed)
 */

const PUBLIC_SECTIONS: NavSection[] = [
  {
    labelKey: "explore_section",
    icon: Eye,
    defaultOpen: true,
    items: [
      { labelKey: "marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { labelKey: "library", to: "/library", icon: BookOpen, controlId: "nav.library" },
      { labelKey: "docs", to: "/docs", icon: FileText, controlId: "nav.docs" },
    ],
  },
];

// ═══ PRIMARY NAV — flat, always visible, max 5 items ═══
const PRIMARY_ITEMS: NavItem[] = [
  { labelKey: "cockpit", to: "/home", icon: Home, controlId: "nav.home", highlight: true },
  { labelKey: "extractor", to: "/extractor", icon: Upload, controlId: "nav.extractor" },
  { labelKey: "library", to: "/library", icon: BookOpen, controlId: "nav.library" },
  { labelKey: "services", to: "/services", icon: Sparkles, controlId: "nav.services" },
  { labelKey: "profile", to: "/profile", icon: User, controlId: "nav.profile" },
];

// ═══ ADMIN (collapsed, admin-only) ═══
const ADMIN_NAV: NavSection = {
  labelKey: "control_section",
  icon: Shield,
  adminOnly: true,
  items: [
    { labelKey: "admin", to: "/admin", icon: Shield, adminOnly: true },
    { labelKey: "kernel", to: "/admin/kernel", icon: Cpu, adminOnly: true },
    { labelKey: "runtime", to: "/runtime", icon: Activity, adminOnly: true },
    { labelKey: "analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
    { labelKey: "services_catalog", to: "/services-catalog", icon: Database, adminOnly: true },
  ],
};

  const renderSection = (section: NavSection, idx: number) => {
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
  };

  // Recent sessions (max 8)
  const recentSessions = (sessions || []).slice(0, 8);

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
        {/* CORE + EXECUTION sections */}
        {navSections.slice(0, 2).map((section, idx) => renderSection(section, idx))}

        {/* ═══ SESSIONS SECTION ═══ */}
        {user && !collapsed && (
          <>
            <SidebarSeparator className="my-1" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                <span className="flex-1">Sesiuni recente</span>
                <button
                  onClick={() => { newSession(); navigate("/home"); }}
                  className="h-4 w-4 rounded flex items-center justify-center hover:bg-muted transition-colors"
                  title="Sesiune nouă"
                >
                  <Plus className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <ScrollArea className="max-h-[180px]">
                  <SidebarMenu>
                    {recentSessions.length === 0 && (
                      <p className="text-[11px] text-muted-foreground/40 px-3 py-2">Nicio sesiune</p>
                    )}
                    {recentSessions.map((session) => (
                      <SidebarMenuItem key={session.session_id}>
                        <SidebarMenuButton
                          className="group/session text-xs h-8"
                          onClick={() => {
                            loadSession(session.session_id);
                            navigate("/home");
                          }}
                        >
                          <MessageCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className="flex-1 truncate text-muted-foreground group-hover/session:text-foreground">
                            {session.last_message?.slice(0, 40) || formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ro })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.session_id);
                              toast.success("Sesiune ștearsă");
                            }}
                            className="opacity-0 group-hover/session:opacity-100 h-4 w-4 rounded flex items-center justify-center hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {user && collapsed && (
          <>
            <SidebarSeparator className="my-1" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Sesiuni recente"
                      onClick={() => { newSession(); navigate("/home"); }}
                    >
                      <Clock className="h-4 w-4" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator className="my-1" />

        {/* SYSTEM + CREATOR + ACCOUNT + ADMIN sections */}
        {navSections.slice(2).map((section, idx) => renderSection(section, idx + 2))}
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