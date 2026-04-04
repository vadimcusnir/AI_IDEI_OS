/**
 * UserMenu — Personal identity & control dropdown.
 * 
 * World-class pattern (Linear/Notion/Vercel):
 * Trigger = Avatar + email + chevron
 * Content = Profile, Settings, Theme, Language, Privacy, API, Logout
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useUserTier } from "@/hooks/useUserTier";
import { useLocale } from "@/hooks/useLocale";
import {
  User, Settings, Shield, Code2, LogOut, Crown,
  ChevronDown, Landmark, Sun, Moon, Globe,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

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
  const currentLang = LANG_OPTIONS.find(l => l.code === currentLanguage) || LANG_OPTIONS[0];

  if (!user) return null;

  const initials = (user.email || "U").slice(0, 2).toUpperCase();
  const displayEmail = user.email || "";
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-muted/60 transition-colors w-full min-h-[36px]">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className={cn(
              "text-[10px] font-semibold",
              tier === "vip" ? "bg-tier-vip/15 text-tier-vip"
                : tier === "pro" ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left hidden group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-medium truncate text-foreground leading-tight">
              {displayEmail.split("@")[0]}
            </p>
            <p className="text-[10px] text-muted-foreground/60 truncate leading-tight">
              {tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "Free"} plan
            </p>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground/50 shrink-0 hidden group-data-[collapsible=icon]:hidden" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="right" align="end" className="w-56">
        {/* Identity header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn(
                "text-xs font-semibold",
                tier === "vip" ? "bg-tier-vip/15 text-tier-vip"
                  : tier === "pro" ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{displayEmail}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Crown className={cn(
                  "h-2.5 w-2.5",
                  tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/40"
                )} />
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider",
                  tier === "vip" ? "text-tier-vip" : tier === "pro" ? "text-primary" : "text-muted-foreground/60"
                )}>
                  {tier === "vip" ? "VIP" : tier === "pro" ? "PRO" : "FREE"}
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Navigation */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2.5 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground" /> {t("navigation:profile")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/workspace")} className="gap-2.5 text-xs">
            <Settings className="h-3.5 w-3.5 text-muted-foreground" /> {t("common:workspace_settings")}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Preferences */}
        <DropdownMenuGroup>
          {/* Theme toggle */}
          <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")} className="gap-2.5 text-xs">
            {isDark ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
            {isDark ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>

          {/* Language sub-menu */}
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
                  <span>{lang.flag}</span>
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* System */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/data-privacy")} className="gap-2.5 text-xs">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" /> {t("common:data_privacy")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/docs")} className="gap-2.5 text-xs">
            <Code2 className="h-3.5 w-3.5 text-muted-foreground" /> {t("common:api_docs", { defaultValue: "API & Docs" })}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Admin */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2.5 text-xs">
              <Landmark className="h-3.5 w-3.5 text-muted-foreground" /> {t("common:admin_panel")}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={() => signOut()}
          className="gap-2.5 text-xs text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> {t("common:sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
