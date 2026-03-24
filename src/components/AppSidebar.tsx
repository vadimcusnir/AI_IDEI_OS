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
  const { sessions, loadSession, deleteSession, newSession } = useChatHistory();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const recentSessions = (sessions || []).slice(0, 6);

  const renderNavItem = (item: NavItem) => {
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
            <item.icon className={cn("h-4 w-4", item.highlight && !isActive(item.to) && "text-primary")} />
            {!collapsed && <span className="flex-1">{t(`navigation:${item.labelKey}`)}</span>}
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
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <button onClick={() => navigate(user ? "/home" : "/")} className="flex items-center gap-2.5 px-1 py-1">
          <Logo size="h-7 w-7" className="shrink-0" loading="eager" />
          {!collapsed && <span className="text-sm font-bold tracking-tight">AI-IDEI</span>}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Credits — compact */}
      {user && !collapsed && (
        <div className="px-3 py-2 space-y-1.5">
          <WorkspaceSwitcher collapsed={false} />
          <button
            onClick={() => navigate("/credits")}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <Coins className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-xs font-mono font-bold text-primary">
              {balanceLoading ? "…" : balance.toLocaleString()}
            </span>
            <span className="text-[9px] text-muted-foreground ml-auto">{t("common:neurons_currency")}</span>
          </button>
        </div>
      )}
      {user && collapsed && (
        <div className="flex flex-col items-center gap-2 py-2">
          <WorkspaceSwitcher collapsed={true} />
          <button
            onClick={() => navigate("/credits")}
            className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/15 transition-colors"
            title={`${balance} ${t("common:neurons_currency")}`}
          >
            <Coins className="h-3.5 w-3.5 text-primary" />
          </button>
        </div>
      )}

      <SidebarContent>
        {/* ═══ PRIMARY NAVIGATION — flat, 5 items ═══ */}
        {user ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {PRIMARY_ITEMS.map(renderNavItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          /* Public sections */
          PUBLIC_SECTIONS.map((section) => (
            <SidebarGroup key={section.labelKey}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px]">
                  {t(`navigation:${section.labelKey}`)}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}

        {/* ═══ SESSIONS ═══ */}
        {user && !collapsed && (
          <>
            <SidebarSeparator className="my-1" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground/70" />
                <span className="flex-1">Sesiuni</span>
                <button
                  onClick={() => { newSession(); navigate("/home"); }}
                  className="h-4 w-4 rounded flex items-center justify-center hover:bg-muted transition-colors"
                  title="Sesiune nouă"
                >
                  <Plus className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <ScrollArea className="max-h-[160px]">
                  <SidebarMenu>
                    {recentSessions.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/40 px-3 py-1.5">Nicio sesiune</p>
                    )}
                    {recentSessions.map((session) => (
                      <SidebarMenuItem key={session.session_id}>
                        <SidebarMenuButton
                          className="group/session text-[11px] h-7"
                          onClick={() => {
                            loadSession(session.session_id);
                            navigate("/home");
                          }}
                        >
                          <MessageCircle className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                          <span className="flex-1 truncate text-muted-foreground group-hover/session:text-foreground">
                            {session.last_message?.slice(0, 35) || formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: ro })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.session_id);
                              toast.success("Sesiune ștearsă");
                            }}
                            className="opacity-0 group-hover/session:opacity-100 h-3.5 w-3.5 rounded flex items-center justify-center hover:bg-destructive/10 transition-all"
                          >
                            <Trash2 className="h-2 w-2 text-muted-foreground hover:text-destructive" />
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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Sesiuni"
                    onClick={() => { newSession(); navigate("/home"); }}
                  >
                    <Clock className="h-4 w-4" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ═══ ADMIN — collapsed, admin-only ═══ */}
        {user && isAdmin && (
          <>
            <SidebarSeparator className="my-1" />
            <Collapsible className="group/collapsible">
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="text-[10px] cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-muted-foreground/70" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">Admin</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </>
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {ADMIN_NAV.items.map(renderNavItem)}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />

        {/* ═══ MONETIZATION ENGINE ═══ */}
        {user && !collapsed && (
          <div className="px-3 py-2 space-y-2">
            {/* Plan badge + balance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className={cn(
                  "h-3 w-3",
                  tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-muted-foreground/40"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-muted-foreground"
                )}>
                  {tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE"}
                </span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                {balanceLoading ? "…" : balance.toLocaleString()} N
              </span>
            </div>

            {/* Usage bar */}
            <div className="h-1 w-full bg-border/30 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  balance < 200 ? "bg-destructive" : balance < 1000 ? "bg-yellow-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, (balance / 5000) * 100)}%` }}
              />
            </div>

            {/* Low balance warning */}
            {balance < 200 && (
              <button
                onClick={() => navigate("/credits")}
                className="w-full text-[10px] text-destructive bg-destructive/5 rounded-lg px-2 py-1.5 text-left hover:bg-destructive/10 transition-colors"
              >
                ⚠ Sold scăzut — Reîncarcă
              </button>
            )}

            {/* Upgrade CTA — only for non-pro users */}
            {tier !== "vip" && tier !== "pro" && (
              <button
                onClick={() => navigate("/credits")}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/15 hover:border-primary/30 transition-all group"
              >
                <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-[11px] font-semibold text-primary">Upgrade to PRO</p>
                  <p className="text-[9px] text-muted-foreground">25% discount execuție + batch</p>
                </div>
                <ChevronRight className="h-3 w-3 text-primary/40 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Cusnir_OS — locked preview */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30 border border-border/20 hover:border-border/40 transition-colors group cursor-pointer">
                  <div className="h-5 w-5 rounded-md bg-foreground/5 flex items-center justify-center shrink-0">
                    <Lock className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[10px] font-bold text-muted-foreground/60 tracking-wide">CUSNIR_OS</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 transition-transform group-data-[state=open]:rotate-90" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 px-2.5 py-2 rounded-lg bg-muted/20 space-y-1.5">
                  <div className="space-y-0.5">
                    {["Multi-agent orchestration", "Economic system control", "Private neuron layers"].map(cap => (
                      <div key={cap} className="flex items-center gap-1.5">
                        <Lock className="h-2.5 w-2.5 text-muted-foreground/25 shrink-0" />
                        <span className="text-[9px] text-muted-foreground/40">{cap}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground/30 italic">
                    11 luni VIP consecutive sau $9,992
                  </p>
                  <button
                    onClick={() => navigate("/cusnir-os")}
                    className="w-full text-[9px] font-medium text-primary/60 hover:text-primary transition-colors py-0.5"
                  >
                    Vezi cerințe →
                  </button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        {/* Collapsed — just upgrade icon */}
        {user && collapsed && (
          <div className="flex flex-col items-center gap-1.5 py-2">
            <button
              onClick={() => navigate("/credits")}
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center transition-colors",
                tier === "vip" ? "bg-yellow-500/10" : tier === "pro" ? "bg-primary/10" : "bg-muted/50 hover:bg-primary/10"
              )}
              title={`${tier.toUpperCase()} — ${balance}N`}
            >
              <Crown className={cn(
                "h-3.5 w-3.5",
                tier === "vip" ? "text-yellow-500" : tier === "pro" ? "text-primary" : "text-muted-foreground/40"
              )} />
            </button>
          </div>
        )}

        {/* Sign in for logged-out users */}
        {!user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Sign In"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                <User className="h-4 w-4" />
                {!collapsed && <span>Sign In</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}