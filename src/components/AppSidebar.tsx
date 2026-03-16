import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import logo from "@/assets/logo.gif";
import {
  Brain, Shield, Upload, Sparkles, Briefcase, Coins,
  LogOut, Home, User, MessageCircle, ScrollText,
  BarChart3, Bell, BookOpen, Users, Network, Rocket,
  FileText, Lightbulb, Bot, Store, Layers, MessagesSquare,
  Lock,
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

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  /** UI control registry ID for dynamic visibility */
  controlId?: string;
  /** Marks this nav item as requiring Pro tier */
  proOnly?: boolean;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

/*
 * Navigation Architecture — max 5 sections, max 6 items each.
 * Narrative: Pipeline flow → Explore → Manage → Support → Admin
 */
const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "pipeline_section",
    items: [
      { labelKey: "cockpit", to: "/home", icon: Home, controlId: "nav.home" },
      { labelKey: "extractor", to: "/extractor", icon: Upload, controlId: "nav.extractor" },
      { labelKey: "neurons", to: "/neurons", icon: Brain, controlId: "nav.neurons" },
      { labelKey: "services", to: "/services", icon: Sparkles, controlId: "nav.services" },
      { labelKey: "jobs", to: "/jobs", icon: Briefcase, controlId: "nav.jobs" },
      { labelKey: "library", to: "/library", icon: BookOpen, controlId: "nav.library" },
      { labelKey: "prompt_forge", to: "/prompt-forge", icon: Bot, controlId: "nav.prompt-forge" },
      { labelKey: "profile_extractor", to: "/profile-extractor", icon: Users, controlId: "nav.profile-extractor" },
    ],
  },
  {
    labelKey: "explore_section",
    items: [
      { labelKey: "dashboard", to: "/dashboard", icon: BarChart3, controlId: "nav.dashboard" },
      { labelKey: "intelligence", to: "/intelligence", icon: Network, controlId: "nav.intelligence", proOnly: true },
      { labelKey: "topics", to: "/topics", icon: Lightbulb, controlId: "nav.topics" },
      { labelKey: "marketplace", to: "/marketplace", icon: Store, controlId: "nav.marketplace" },
      { labelKey: "community", to: "/community", icon: MessagesSquare, controlId: "nav.community" },
      { labelKey: "chat", to: "/chat", icon: MessagesSquare, controlId: "nav.chat" },
    ],
  },
  {
    labelKey: "operate_section",
    items: [
      { labelKey: "credits", to: "/credits", icon: Coins, controlId: "nav.credits" },
      { labelKey: "guest_pages", to: "/guests", icon: Users, controlId: "nav.guests" },
      { labelKey: "pipeline", to: "/pipeline", icon: Layers, controlId: "nav.pipeline" },
      { labelKey: "onboarding", to: "/onboarding", icon: Rocket, controlId: "nav.onboarding" },
    ],
  },
  {
    labelKey: "account_section",
    items: [
      { labelKey: "notifications", to: "/notifications", icon: Bell, controlId: "nav.notifications" },
      { labelKey: "feedback", to: "/feedback", icon: MessageCircle, controlId: "nav.feedback" },
      { labelKey: "docs", to: "/docs", icon: FileText, controlId: "nav.docs" },
      { labelKey: "changelog", to: "/changelog", icon: ScrollText, controlId: "nav.changelog" },
    ],
  },
  {
    labelKey: "admin_section",
    items: [
      { labelKey: "admin", to: "/admin", icon: Shield, adminOnly: true },
    ],
  },
];

export function AppSidebar() {
  const { t } = useTranslation(["navigation", "common"]);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { balance, loading: balanceLoading } = useCreditBalance();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <button onClick={() => navigate("/home")} className="flex items-center gap-2.5 px-1 py-1">
          <img src={logo} alt="AI-IDEI" className="h-7 w-7 rounded-full shrink-0" />
          {!collapsed && <span className="text-sm font-bold tracking-tight">AI-IDEI</span>}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Workspace & Credits */}
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
          {/* Streak + XP compact */}
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

      {/* Navigation sections — all visible, no collapsible "More" */}
      <SidebarContent>
        {NAV_SECTIONS.map((section, idx) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.labelKey}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[9px]">
                  {t(`navigation:${section.labelKey}`)}
                </SidebarGroupLabel>
              )}
              {idx > 0 && collapsed && <SidebarSeparator className="my-1" />}
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
                            <span>{t(`navigation:${item.labelKey}`)}</span>
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
        })}
      </SidebarContent>

      {/* Footer: Profile + Sign out */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/profile")}
              tooltip={t("navigation:profile")}
            >
              <button onClick={() => navigate("/profile")} className="w-full">
                <User className="h-4 w-4" />
                <span>{t("navigation:profile")}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              {!collapsed && <ThemeToggle />}
              <SidebarMenuButton
                tooltip={t("common:sign_out")}
                className={cn(collapsed ? "w-full" : "w-auto flex-shrink-0")}
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>{t("common:sign_out")}</span>}
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
