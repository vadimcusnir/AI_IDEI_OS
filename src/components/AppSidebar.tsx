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
  FileText, Lightbulb, Bot, Store, Layers,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { PipelineIndicator } from "@/components/PipelineIndicator";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  labelKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "dashboard_section",
    items: [
      { labelKey: "cockpit", to: "/home", icon: Home },
      { labelKey: "dashboard", to: "/dashboard", icon: BarChart3 },
      { labelKey: "onboarding", to: "/onboarding", icon: Rocket },
    ],
  },
  {
    labelKey: "create_section",
    items: [
      { labelKey: "extractor", to: "/extractor", icon: Upload },
      { labelKey: "neurons", to: "/neurons", icon: Brain },
      { labelKey: "services", to: "/services", icon: Sparkles },
      { labelKey: "chat", to: "/chat", icon: Bot },
    ],
  },
  {
    labelKey: "explore_section",
    items: [
      { labelKey: "library", to: "/library", icon: BookOpen },
      { labelKey: "intelligence", to: "/intelligence", icon: Network },
      { labelKey: "topics", to: "/topics", icon: Lightbulb },
      { labelKey: "marketplace", to: "/marketplace", icon: Store },
      { labelKey: "guest_pages", to: "/guests", icon: Users },
    ],
  },
  {
    labelKey: "operate_section",
    items: [
      { labelKey: "jobs", to: "/jobs", icon: Briefcase },
      { labelKey: "pipeline", to: "/pipeline", icon: Layers },
      { labelKey: "admin", to: "/admin", icon: Shield, adminOnly: true },
    ],
  },
  {
    labelKey: "account_section",
    items: [
      { labelKey: "credits", to: "/credits", icon: Coins },
      { labelKey: "notifications", to: "/notifications", icon: Bell },
      { labelKey: "feedback", to: "/feedback", icon: MessageCircle },
    ],
  },
  {
    labelKey: "learn_section",
    items: [
      { labelKey: "docs", to: "/docs", icon: FileText },
      { labelKey: "changelog", to: "/changelog", icon: ScrollText },
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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const sectionHasActive = (section: NavSection) =>
    section.items.some((item) => isActive(item.to));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <button onClick={() => navigate("/home")} className="flex items-center gap-2.5 px-1 py-1">
          <img src={logo} alt="AI-IDEI" className="h-7 w-7 rounded-full shrink-0" />
          {!collapsed && <span className="text-sm font-bold tracking-tight">AI-IDEI</span>}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {user && !collapsed && (
        <div className="px-3 py-2 space-y-2">
          <WorkspaceSwitcher collapsed={false} />
          <button onClick={() => navigate("/credits")} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors">
            <Coins className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{t("common:neurons_currency")}</span>
              <span className="text-sm font-mono font-bold text-primary">{balanceLoading ? "…" : balance.toLocaleString()}</span>
            </div>
          </button>
        </div>
      )}
      {user && collapsed && (
        <div className="flex flex-col items-center gap-2 py-2">
          <WorkspaceSwitcher collapsed={true} />
          <button onClick={() => navigate("/credits")} className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/15 transition-colors" title={`${balance} ${t("common:neurons_currency")}`}>
            <Coins className="h-4 w-4 text-primary" />
          </button>
        </div>
      )}

      <SidebarContent>
        {NAV_SECTIONS.map((section, sIdx) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || isAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.labelKey}>
              {sIdx > 0 && <SidebarSeparator />}
              <SidebarGroup defaultOpen={sectionHasActive(section)}>
                <SidebarGroupLabel>{t(`navigation:${section.labelKey}`)}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {visibleItems.map((item) => (
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
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </div>
          );
        })}

        {!collapsed && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>{t("navigation:pipeline_status")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2"><PipelineIndicator /></div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")} tooltip={t("navigation:profile")}>
              <button onClick={() => navigate("/profile")} className="w-full">
                <User className="h-4 w-4" />
                <span>{t("navigation:profile")}</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              {!collapsed && <ThemeToggle />}
              <SidebarMenuButton tooltip={t("common:sign_out")} className={cn(collapsed ? "w-full" : "w-auto flex-shrink-0")} onClick={() => signOut()}>
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
