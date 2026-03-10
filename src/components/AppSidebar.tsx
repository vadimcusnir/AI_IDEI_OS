import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import logo from "@/assets/logo.gif";
import {
  Brain, Shield, Upload, Sparkles, Briefcase, Coins,
  LogOut, Home, User, MessageCircle, ScrollText,
  BarChart3, Wrench, Bell,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { PipelineIndicator } from "@/components/PipelineIndicator";

const MAIN_NAV = [
  { label: "Cockpit", to: "/home", icon: Home },
  { label: "Extractor", to: "/extractor", icon: Upload },
  { label: "Neuroni", to: "/neurons", icon: Brain },
  { label: "Servicii", to: "/services", icon: Sparkles },
  { label: "Jobs", to: "/jobs", icon: Briefcase },
];

const SECONDARY_NAV = [
  { label: "Credits", to: "/credits", icon: Coins },
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "Notificări", to: "/notifications", icon: Bell },
  { label: "Feedback", to: "/feedback", icon: MessageCircle },
  { label: "Changelog", to: "/changelog", icon: ScrollText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { balance, loading: balanceLoading } = useCreditBalance();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      {/* Logo header */}
      <SidebarHeader>
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2.5 px-1 py-1"
        >
          <img src={logo} alt="AI-IDEI" className="h-7 w-7 rounded-full shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight">AI-IDEI</span>
          )}
        </button>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Credit balance */}
      {user && !collapsed && (
        <div className="px-3 py-2">
          <button
            onClick={() => navigate("/credits")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors"
          >
            <Coins className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">NEURONS</span>
              <span className="text-sm font-mono font-bold text-primary">
                {balanceLoading ? "…" : balance.toLocaleString()}
              </span>
            </div>
          </button>
        </div>
      )}
      {user && collapsed && (
        <div className="flex justify-center py-2">
          <button
            onClick={() => navigate("/credits")}
            className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/15 transition-colors"
            title={`${balance} NEURONS`}
          >
            <Coins className="h-4 w-4 text-primary" />
          </button>
        </div>
      )}

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to)}
                    tooltip={item.label}
                  >
                    <button onClick={() => navigate(item.to)} className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Secondary navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Platformă</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.to)}
                    tooltip={item.label}
                  >
                    <button onClick={() => navigate(item.to)} className="w-full">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/admin")}
                    tooltip="Admin"
                  >
                    <button onClick={() => navigate("/admin")} className="w-full">
                      <Shield className="h-4 w-4" />
                      <span>Admin</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pipeline Progress - only expanded */}
        {!collapsed && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Pipeline Status</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-2">
                  <PipelineIndicator />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* Footer with user actions */}
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/profile")}
              tooltip="Profil"
            >
              <button onClick={() => navigate("/profile")} className="w-full">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1">
              {!collapsed && <ThemeToggle />}
              <SidebarMenuButton
                tooltip="Deconectare"
                className={cn(collapsed ? "w-full" : "w-auto flex-shrink-0")}
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Ieșire</span>}
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
