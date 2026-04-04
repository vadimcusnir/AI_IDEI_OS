/**
 * AppSidebar — OS-grade navigation kernel.
 * Single vertical flow: Logo → Search → Workspace → Navigation → User Control
 * Zero redundancy. Every element serves the pipeline.
 */
import { lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier, type UserTier } from "@/hooks/useUserTier";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Logo } from "@/components/shared/Logo";
import {
  Home, BookOpen, Sparkles, Brain, Network, Store,
  Coins, Plus, Clock, Shield, Cpu, Activity, BarChart3,
  Database, Trophy, Workflow, Gem, Plug, LogIn,
  ChevronsUpDown, Check, Settings, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { ControlledNavItem } from "@/components/ControlledNavItem";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const GlobalSearch = lazy(() => import("@/components/GlobalSearch").then(m => ({ default: m.GlobalSearch })));
const UserMenu = lazy(() => import("@/components/UserMenu").then(m => ({ default: m.UserMenu })));

// ═══ NAVIGATION MAP — Flat, deterministic, pipeline-aligned ═══

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  controlId?: string;
  minTier?: UserTier;
  highlight?: boolean;
  adminOnly?: boolean;
}

interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
  authOnly?: boolean;
  adminOnly?: boolean;
}

const SECTIONS: NavSection[] = [
  {
    key: "core",
    label: "CORE",
    items: [
      { label: "Command Center", to: "/home", icon: Home, controlId: "nav.home", highlight: true },
      { label: "Pipeline", to: "/pipeline", icon: Workflow, controlId: "nav.pipeline" },
      { label: "Library", to: "/library", icon: BookOpen, controlId: "nav.library" },
      { label: "Jobs", to: "/jobs", icon: Clock, controlId: "nav.jobs" },
    ],
  },
  {
    key: "economy",
    label: "ECONOMY",
    authOnly: true,
    items: [
      { label: "Credits", to: "/credits", icon: Coins, controlId: "nav.credits" },
    ],
  },
  {
    key: "intelligence",
    label: "INTELLIGENCE",
    authOnly: true,
    items: [
      { label: "Neurons", to: "/neurons", icon: Brain, controlId: "nav.neurons" },
      { label: "Knowledge Graph", to: "/intelligence", icon: Network, controlId: "nav.intelligence" },
    ],
  },
  {
    key: "expansion",
    label: "EXPANSION",
    authOnly: true,
    items: [
      { label: "Services", to: "/services", icon: Sparkles, controlId: "nav.services" },
      { label: "Marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { label: "Progress", to: "/gamification", icon: Trophy, controlId: "nav.gamification" },
      { label: "VIP Program", to: "/vip", icon: Gem, controlId: "nav.vip" },
      { label: "Integrations", to: "/integrations", icon: Plug, controlId: "nav.integrations" },
    ],
  },
];

const ADMIN_SECTION: NavSection = {
  key: "admin",
  label: "ADMIN",
  adminOnly: true,
  items: [
    { label: "Dashboard", to: "/admin", icon: Shield, adminOnly: true },
    { label: "Kernel", to: "/admin/kernel", icon: Cpu, adminOnly: true },
    { label: "Runtime", to: "/runtime", icon: Activity, adminOnly: true },
    { label: "Analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
    { label: "Catalog", to: "/services-catalog", icon: Database, adminOnly: true },
  ],
};

// ═══ COMPONENT ═══

export function AppSidebar() {
  const { t } = useTranslation(["navigation", "common"]);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { balance, loading: balanceLoading } = useCreditBalance();
  const { tier } = useUserTier();
  const { prefetchServices, prefetchCredits, prefetchLibrary } = usePrefetch();
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();

  const prefetchMap: Record<string, (() => void) | undefined> = {
    "/services": prefetchServices,
    "/credits": prefetchCredits,
    "/library": prefetchLibrary,
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const initials = (user?.email || "U").slice(0, 2).toUpperCase();
  const creditPercent = Math.min((balance / 10000) * 100, 100);
  const tierLabel = tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE";
  const tierColor = tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/60";

  // ─── Render nav item ───
  const renderItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;
    const el = (
      <SidebarMenuItem key={item.to}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.to)}
          tooltip={item.label}
        >
          <button
            onClick={() => navigate(item.to)}
            onMouseEnter={prefetchMap[item.to]}
            className={cn(
              "w-full",
              item.highlight && !isActive(item.to) && "text-primary font-medium",
            )}
          >
            <item.icon className={cn("h-4 w-4", item.highlight && !isActive(item.to) && "text-primary")} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
    return item.controlId ? (
      <ControlledNavItem key={item.to} elementId={item.controlId}>{el}</ControlledNavItem>
    ) : el;
  };

  // ─── Render section ───
  const renderSection = (section: NavSection) => {
    if (section.authOnly && !user) return null;
    if (section.adminOnly && !isAdmin) return null;

    return (
      <SidebarGroup key={section.key} className="py-1">
        {!collapsed && (
          <SidebarGroupLabel className="text-[9px] tracking-[0.15em] font-bold text-muted-foreground/50 select-none px-3 mb-0.5">
            {section.label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>{section.items.map(renderItem)}</SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon">
      {/* ═══ HEADER — Logo + Brand (fixed) ═══ */}
      <SidebarHeader className="p-0">
        <button
          onClick={() => navigate(user ? "/home" : "/")}
          className={cn(
            "w-full flex items-center gap-3 px-3 transition-colors hover:bg-muted/50",
            collapsed ? "justify-center h-12" : "h-12"
          )}
        >
          <Logo size="h-7 w-7" className="shrink-0" loading="eager" />
          {!collapsed && (
            <span className="text-base font-bold tracking-tight text-foreground">
              AI-<span className="text-primary">IDEI</span>
            </span>
          )}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ═══ NAVIGATION — Single vertical flow ═══ */}
      <SidebarContent>
        {user ? (
          <>
            {/* Search + Workspace — full-width, matched styling */}
            <div className="px-3 pt-3 pb-2 space-y-2">
              <div className={cn(collapsed && "flex justify-center")}>
                <Suspense fallback={null}><GlobalSearch /></Suspense>
              </div>
              {!collapsed && workspaces.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-muted/30 text-left hover:bg-muted/60 hover:border-border/60 transition-colors">
                      <span className="text-xs font-medium truncate flex-1 text-foreground/80">
                        {currentWorkspace?.name || "Workspace"}
                      </span>
                      <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[200px]">
                    {workspaces.map((ws) => (
                      <DropdownMenuItem
                        key={ws.id}
                        onClick={() => {
                          if (ws.id !== currentWorkspace?.id) {
                            switchWorkspace(ws.id);
                            toast.success(t("common:workspace_switched", { name: ws.name }));
                          }
                        }}
                        className="gap-2 text-xs"
                      >
                        {ws.id === currentWorkspace?.id ? <Check className="h-3 w-3 text-primary" /> : <div className="w-3" />}
                        <span className="truncate">{ws.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        const name = prompt(t("common:workspace_name_placeholder", { defaultValue: "Workspace name" }));
                        if (name?.trim()) {
                          const ws = await createWorkspace(name.trim());
                          if (ws) toast.success(t("common:workspace_created", { name: ws.name }));
                        }
                      }}
                      className="gap-2 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      {t("common:new_workspace", { defaultValue: "New workspace" })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <SidebarSeparator />

            {SECTIONS.map(renderSection)}
            {isAdmin && (
              <>
                <SidebarSeparator className="my-1" />
                {renderSection(ADMIN_SECTION)}
              </>
            )}
          </>
        ) : (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-[9px] tracking-[0.15em] font-bold text-muted-foreground/50">
                EXPLORE
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {renderItem({ label: "Marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" })}
                {renderItem({ label: "Library", to: "/library", icon: BookOpen, controlId: "nav.library" })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ═══ FOOTER — Unified user control ═══ */}
      <SidebarFooter>
        <SidebarSeparator />

        {user ? (
          <div className={cn(
            "space-y-1.5",
            collapsed ? "flex flex-col items-center py-2 space-y-1.5" : "px-2 py-2"
          )}>
            {/* Credit bar (expanded only) */}
            {!collapsed && (
              <button
                onClick={() => navigate("/credits")}
                className="w-full px-2 py-1 rounded-md hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider", tierColor)}>
                    {tierLabel}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                    {balanceLoading ? "…" : balance.toLocaleString()}N
                  </span>
                </div>
                <Progress value={creditPercent} className="h-1 bg-muted/60" />
              </button>
            )}

            {/* User menu (contains: profile, settings, theme, language, notifications, sign out) */}
            <Suspense fallback={<div className={cn("rounded-full bg-muted animate-pulse", collapsed ? "h-7 w-7" : "h-9 w-full")} />}>
              <UserMenu />
            </Suspense>
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sign In" className="w-full" onClick={() => navigate("/auth")}>
                <LogIn className="h-4 w-4" />
                {!collapsed && <span>Sign In</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
