/**
 * AppSidebar — World-class sidebar following Linear/Notion/Vercel patterns.
 *
 * Structure (top → bottom):
 *   HEADER   — Logo + Workspace name (single row, Linear-style team switcher)
 *   SEARCH   — Full-width search + compact "New" button
 *   CONTENT  — Navigation groups (CORE, WORK, DISCOVER, SESSIONS, ADMIN)
 *   FOOTER   — Credit progress bar + User row (avatar + email + notifications)
 */
import { lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserTier, type UserTier } from "@/hooks/useUserTier";
import { useChatHistory } from "@/hooks/useChatHistory";
import { usePrefetch } from "@/hooks/usePrefetch";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Logo } from "@/components/shared/Logo";
import {
  Home, BookOpen, Sparkles,
  Brain, Network, Store,
  Coins, Plus, Wallet,
  Clock, Trash2, MessageCircle,
  Shield, Cpu, Activity, BarChart3, Database,
  Trophy, ChevronRight, Lock,
  Plug, Gem, Workflow, LogIn,
  ChevronsUpDown, Check,
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
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Lazy-load widgets
const GlobalSearch = lazy(() => import("@/components/GlobalSearch").then(m => ({ default: m.GlobalSearch })));
const NotificationBell = lazy(() => import("@/components/NotificationBell").then(m => ({ default: m.NotificationBell })));
const UserMenu = lazy(() => import("@/components/UserMenu").then(m => ({ default: m.UserMenu })));

// ═══ ROUTE REGISTRY ═══

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  controlId?: string;
  minTier?: UserTier;
  highlight?: boolean;
  locked?: boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  key: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
  authOnly?: boolean;
  adminOnly?: boolean;
}

const SYSTEM_MAP: NavGroup[] = [
  {
    key: "core",
    label: "CORE",
    icon: Home,
    defaultOpen: true,
    items: [
      { label: "Command Center", to: "/home", icon: Home, controlId: "nav.home", highlight: true },
    ],
  },
  {
    key: "work",
    label: "WORK",
    icon: BookOpen,
    defaultOpen: true,
    authOnly: true,
    items: [
      { label: "Pipeline", to: "/pipeline", icon: Workflow, controlId: "nav.pipeline", highlight: true },
      { label: "Library", to: "/library", icon: BookOpen, controlId: "nav.library" },
      { label: "Jobs", to: "/jobs", icon: Clock, controlId: "nav.jobs" },
      { label: "Credits", to: "/credits", icon: Coins, controlId: "nav.credits" },
      { label: "Wallet", to: "/wallet", icon: Wallet, controlId: "nav.wallet" },
    ],
  },
  {
    key: "more",
    label: "DISCOVER",
    icon: Sparkles,
    authOnly: true,
    items: [
      { label: "Services", to: "/services", icon: Sparkles, controlId: "nav.services" },
      { label: "Neurons", to: "/neurons", icon: Brain, controlId: "nav.neurons" },
      { label: "Knowledge Graph", to: "/intelligence", icon: Network, controlId: "nav.intelligence" },
      { label: "Marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { label: "Progress", to: "/gamification", icon: Trophy, controlId: "nav.gamification" },
      { label: "VIP Program", to: "/vip", icon: Gem, controlId: "nav.vip" },
      { label: "Integrations", to: "/integrations", icon: Plug, controlId: "nav.integrations" },
    ],
  },
];

const ADMIN_GROUP: NavGroup = {
  key: "admin",
  label: "ADMIN",
  icon: Shield,
  adminOnly: true,
  items: [
    { label: "Dashboard", to: "/admin", icon: Shield, adminOnly: true },
    { label: "Kernel", to: "/admin/kernel", icon: Cpu, adminOnly: true },
    { label: "Runtime", to: "/runtime", icon: Activity, adminOnly: true },
    { label: "Analytics", to: "/analytics", icon: BarChart3, adminOnly: true },
    { label: "Catalog", to: "/services-catalog", icon: Database, adminOnly: true },
  ],
};

const PUBLIC_ITEMS: NavItem[] = [
  { label: "Marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
  { label: "Library", to: "/library", icon: BookOpen, controlId: "nav.library" },
];

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
  const { sessions, loadSession, deleteSession, newSession } = useChatHistory();
  const { prefetchServices, prefetchCredits, prefetchLibrary } = usePrefetch();
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();

  const prefetchMap: Record<string, (() => void) | undefined> = {
    "/services": prefetchServices,
    "/services-catalog": prefetchServices,
    "/credits": prefetchCredits,
    "/library": prefetchLibrary,
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const recentSessions = (sessions || []).slice(0, 8);
  const initials = (user?.email || "U").slice(0, 2).toUpperCase();

  // Credit progress (cap at 10000 for visual)
  const creditPercent = Math.min((balance / 10000) * 100, 100);

  // ─── Render helpers ───

  const renderNavItem = (item: NavItem) => {
    const content = (
      <SidebarMenuItem key={item.to}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.to)}
          tooltip={item.label}
        >
          <button onClick={() => navigate(item.to)} onMouseEnter={prefetchMap[item.to]} className={cn(
            "w-full",
            item.highlight && !isActive(item.to) && "text-primary font-medium",
            item.locked && "opacity-60",
          )}>
            <item.icon className={cn(
              "h-4 w-4",
              item.highlight && !isActive(item.to) && "text-primary",
              item.locked && "text-muted-foreground/40",
            )} />
            {!collapsed && (
              <span className="flex-1 flex items-center gap-1.5">
                {item.label}
                {item.locked && <Lock className="h-2.5 w-2.5 text-muted-foreground/30" />}
                {item.minTier && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-primary/50 bg-primary/5 px-1 rounded">
                    {item.minTier}
                  </span>
                )}
              </span>
            )}
          </button>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
    if (item.controlId) {
      return (
        <ControlledNavItem key={item.to} elementId={item.controlId}>
          {content}
        </ControlledNavItem>
      );
    }
    return content;
  };

  const renderGroup = (group: NavGroup) => {
    if (group.authOnly && !user) return null;
    if (group.adminOnly && !isAdmin) return null;

    const groupActive = group.items.some(i => isActive(i.to));

    return (
      <Collapsible key={group.key} defaultOpen={group.defaultOpen || groupActive} className="group/collapsible">
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-[9px] cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1.5 tracking-[0.15em]">
              <group.icon className="h-3 w-3 text-muted-foreground/50" />
              {!collapsed && (
                <>
                  <span className="flex-1 font-bold">{group.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </>
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter(i => !i.adminOnly || isAdmin)
                  .map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  };

  // Tier badge helper
  const tierLabel = tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE";
  const tierColor = tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/60";

  return (
    <Sidebar collapsible="icon">
      {/* ═══════════════════════════════════════════
          HEADER — Logo + Workspace (Linear team-switcher style)
          Single row: Logo icon + workspace name + dropdown chevron
          ═══════════════════════════════════════════ */}
      <SidebarHeader className="p-0">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center gap-2.5 px-3 transition-colors hover:bg-muted/50",
                collapsed ? "justify-center h-10" : "h-12"
              )}>
                <Logo size="h-6 w-6" className="shrink-0" loading="eager" />
                {!collapsed && (
                  <>
                    <span className="text-sm font-semibold truncate text-foreground flex-1 text-left">
                      {currentWorkspace?.name || "AI-IDEI"}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side={collapsed ? "right" : "bottom"} className="min-w-[220px]">
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
                  {ws.id === currentWorkspace?.id ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <div className="w-3" />
                  )}
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
        ) : (
          <button
            onClick={() => navigate("/")}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 transition-colors hover:bg-muted/50",
              collapsed ? "justify-center h-10" : "h-12"
            )}
          >
            <Logo size="h-6 w-6" className="shrink-0" loading="eager" />
            {!collapsed && <span className="text-sm font-semibold text-foreground">AI-IDEI</span>}
          </button>
        )}
      </SidebarHeader>

      {/* ═══════════════════════════════════════════
          QUICK ACTIONS — Search fills width, compact "New" icon
          ═══════════════════════════════════════════ */}
      {user && !collapsed && (
        <div className="px-2.5 py-1.5">
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <Suspense fallback={null}><GlobalSearch /></Suspense>
            </div>
            <button
              onClick={() => { newSession(); navigate("/home"); }}
              className="h-7 w-7 rounded-md bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shrink-0"
              title="New session"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      {user && collapsed && (
        <div className="flex flex-col items-center gap-1 py-1.5">
          <Suspense fallback={null}><GlobalSearch /></Suspense>
        </div>
      )}

      <SidebarSeparator />

      {/* ═══════════════════════════════════════════
          NAVIGATION — Clean group hierarchy
          ═══════════════════════════════════════════ */}
      <SidebarContent>
        {user ? (
          <>
            {SYSTEM_MAP.map(renderGroup)}

            {/* ── Sessions ── */}
            {!collapsed && (
              <>
                <SidebarSeparator className="my-1" />
                <SidebarGroup>
                  <SidebarGroupLabel className="text-[9px] flex items-center gap-1.5 tracking-[0.15em]">
                    <MessageCircle className="h-3 w-3 text-muted-foreground/50" />
                    <span className="flex-1 font-bold">SESSIONS</span>
                    <button
                      onClick={() => { newSession(); navigate("/home"); }}
                      className="h-5 w-5 rounded flex items-center justify-center hover:bg-muted transition-colors"
                      title="New session"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <ScrollArea className="max-h-[160px]">
                      <SidebarMenu>
                        {recentSessions.length === 0 && (
                          <p className="text-[10px] text-muted-foreground/40 px-3 py-1.5">
                            {t("common:no_sessions", { defaultValue: "No sessions yet" })}
                          </p>
                        )}
                        {recentSessions.map((session) => (
                          <SidebarMenuItem key={session.session_id} className="group/session">
                            <SidebarMenuButton
                              className="text-[11px] h-7"
                              onClick={() => { loadSession(session.session_id); navigate("/home"); }}
                            >
                              <MessageCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                              <span className="flex-1 truncate text-muted-foreground group-hover/session:text-foreground">
                                {session.last_message?.slice(0, 30) || formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                              </span>
                            </SidebarMenuButton>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => { e.stopPropagation(); deleteSession(session.session_id); toast.success("Deleted"); }}
                              onKeyDown={(e) => { if (e.key === "Enter") { deleteSession(session.session_id); toast.success("Deleted"); } }}
                              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/session:opacity-100 h-5 w-5 rounded flex items-center justify-center hover:bg-destructive/10 transition-all cursor-pointer z-10"
                            >
                              <Trash2 className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" />
                            </span>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </ScrollArea>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
            {collapsed && (
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        tooltip="New Session"
                        onClick={() => { newSession(); navigate("/home"); }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* ── Admin ── */}
            {isAdmin && (
              <>
                <SidebarSeparator className="my-1" />
                {renderGroup(ADMIN_GROUP)}
              </>
            )}
          </>
        ) : (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-[9px] tracking-[0.15em] font-bold">
                EXPLORE
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {PUBLIC_ITEMS.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ═══════════════════════════════════════════
          FOOTER — Credit bar + User row (Notion/Linear style)
          ═══════════════════════════════════════════ */}
      <SidebarFooter>
        <SidebarSeparator />

        {/* ── Authenticated: expanded ── */}
        {user && !collapsed && (
          <div className="px-2 py-2 space-y-2">
            {/* Credit progress bar — clickable */}
            <button
              onClick={() => navigate("/credits")}
              className="w-full px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left group/credits"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-[9px] font-bold uppercase tracking-wider", tierColor)}>
                  {tierLabel}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-muted-foreground group-hover/credits:text-foreground transition-colors">
                  {balanceLoading ? "…" : balance.toLocaleString()}N
                </span>
              </div>
              <Progress value={creditPercent} className="h-1 bg-muted/60" />
            </button>

            {/* User row — avatar + email + notifications + menu */}
            <div className="flex items-center gap-2 px-0.5">
              <Suspense fallback={<div className="h-7 w-7 rounded-full bg-muted animate-pulse" />}>
                <UserMenu />
              </Suspense>
              <div className="flex-1 min-w-0" />
              <Suspense fallback={null}><NotificationBell /></Suspense>
            </div>
          </div>
        )}

        {/* ── Authenticated: collapsed ── */}
        {user && collapsed && (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <Suspense fallback={null}><NotificationBell /></Suspense>
            <Suspense fallback={null}><UserMenu /></Suspense>
          </div>
        )}

        {/* ── Not authenticated ── */}
        {!user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign In"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
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
