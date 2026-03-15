import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  Home, Brain, Upload, BookOpen, Menu,
  Sparkles, Briefcase, BarChart3, Network, Lightbulb,
  Store, Users, Bot, Layers, Rocket, Shield,
  Coins, Bell, MessageCircle, FileText, ScrollText,
  User, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

/* Bottom bar: 5 pipeline-essential tabs */
const BAR_ITEMS = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/extractor", icon: Upload, label: "Extract" },
  { path: "/neurons", icon: Brain, label: "Neurons" },
  { path: "/library", icon: BookOpen, label: "Library" },
];

/* Full menu sections — matches sidebar architecture */
interface MenuSection {
  label: string;
  labelKey: string;
  items: { path: string; icon: React.ElementType; labelKey: string; adminOnly?: boolean }[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    label: "Pipeline",
    labelKey: "pipeline_section",
    items: [
      { path: "/home", icon: Home, labelKey: "cockpit" },
      { path: "/extractor", icon: Upload, labelKey: "extractor" },
      { path: "/neurons", icon: Brain, labelKey: "neurons" },
      { path: "/services", icon: Sparkles, labelKey: "services" },
      { path: "/jobs", icon: Briefcase, labelKey: "jobs" },
      { path: "/library", icon: BookOpen, labelKey: "library" },
    ],
  },
  {
    label: "Explore",
    labelKey: "explore_section",
    items: [
      { path: "/dashboard", icon: BarChart3, labelKey: "dashboard" },
      { path: "/intelligence", icon: Network, labelKey: "intelligence" },
      { path: "/topics", icon: Lightbulb, labelKey: "topics" },
      { path: "/marketplace", icon: Store, labelKey: "marketplace" },
      { path: "/chat", icon: Bot, labelKey: "chat" },
    ],
  },
  {
    label: "Manage",
    labelKey: "operate_section",
    items: [
      { path: "/credits", icon: Coins, labelKey: "credits" },
      { path: "/guests", icon: Users, labelKey: "guest_pages" },
      { path: "/pipeline", icon: Layers, labelKey: "pipeline" },
      { path: "/onboarding", icon: Rocket, labelKey: "onboarding" },
    ],
  },
  {
    label: "Support",
    labelKey: "account_section",
    items: [
      { path: "/notifications", icon: Bell, labelKey: "notifications" },
      { path: "/feedback", icon: MessageCircle, labelKey: "feedback" },
      { path: "/docs", icon: FileText, labelKey: "docs" },
      { path: "/changelog", icon: ScrollText, labelKey: "changelog" },
      { path: "/profile", icon: User, labelKey: "profile" },
    ],
  },
  {
    label: "Admin",
    labelKey: "admin_section",
    items: [
      { path: "/admin", icon: Shield, labelKey: "admin", adminOnly: true },
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

  return (
    <>
      {/* Fixed bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-md safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {BAR_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = isActive(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[56px] min-h-[44px]",
              menuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[9px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-out full menu */}
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
              return (
                <div key={section.labelKey}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-4 pt-3 pb-1">
                    {t(`navigation:${section.labelKey}`)}
                  </p>
                  {visibleItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNav(item.path)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors",
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
