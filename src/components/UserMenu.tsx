/**
 * UserMenu — Unified user control dropdown (OS-grade).
 * Contains ALL user-scoped controls: profile, settings, notifications,
 * theme, language, privacy, docs, sign out.
 * NO duplication with header or sidebar.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useUserTier } from "@/hooks/useUserTier";
import { useLocale } from "@/hooks/useLocale";
import {
  User, Settings, Shield, Code2, LogOut, Bell,
  ChevronDown, Landmark, Sun, Moon, Globe, MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { tier } = useUserTier();
  const { t } = useTranslation(["navigation", "common"]);
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const { currentLanguage, changeLanguage } = useLocale();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentLang = LANG_OPTIONS.find(l => l.code === currentLanguage) || LANG_OPTIONS[0];

  if (!user) return null;

  const initials = (user.email || "U").slice(0, 2).toUpperCase();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "flex items-center gap-2 rounded-lg hover:bg-muted/60 transition-colors min-h-[36px]",
          collapsed ? "p-1 justify-center" : "px-2 py-1.5 w-full"
        )}>
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className={cn(
              "text-micro font-semibold",
              tier === "vip" ? "bg-tier-vip/15 text-tier-vip"
                : tier === "pro" ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <span className="text-xs font-medium truncate flex-1 text-left text-foreground">
                {user.email?.split("@")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={collapsed ? "right" : "top"}
        align={collapsed ? "end" : "start"}
        className="w-56"
      >
        {/* Identity */}
        <DropdownMenuLabel className="font-normal py-2">
          <p className="text-xs font-medium truncate">{user.email}</p>
          <p className={cn(
            "text-micro font-semibold uppercase tracking-wider mt-0.5",
            tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/60"
          )}>
            {tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE"}
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Account */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2.5 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground" /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/workspace")} className="gap-2.5 text-xs">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/notifications")} className="gap-2.5 text-xs">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" /> Notifications
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/feedback")} className="gap-2.5 text-xs">
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> Feedback
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Preferences */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")} className="gap-2.5 text-xs">
            {isDark ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
            {isDark ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2.5 text-xs">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1">{currentLang.flag} {currentLang.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[140px]">
              {LANG_OPTIONS.map(lang => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code as any)}
                  className={cn("gap-2 text-xs", currentLanguage === lang.code && "bg-accent")}
                >
                  <span>{lang.flag}</span> {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* System */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/data-privacy")} className="gap-2.5 text-xs">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" /> Privacy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/docs")} className="gap-2.5 text-xs">
            <Code2 className="h-3.5 w-3.5 text-muted-foreground" /> API & Docs
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2.5 text-xs">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" /> Admin
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut()}
          className="gap-2.5 text-xs text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
