/**
 * UserMenu — Personal identity & control dropdown.
 * Contains ONLY: Profile, Workspace, Settings, Privacy, API & Docs, Logout.
 * No product features. No economy links. No activity items.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useUserTier } from "@/hooks/useUserTier";
import {
  User, Settings, Shield, Code2, LogOut, Crown, ChevronDown, Landmark,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { tier } = useUserTier();
  const { t } = useTranslation(["navigation", "common"]);
  const navigate = useNavigate();

  if (!user) return null;

  const initials = (user.email || "U").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-1.5">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {(tier === "pro" || tier === "vip") && (
            <Badge variant="outline" className="text-[7px] px-1 py-0 h-3.5 gap-0.5 border-primary/30 text-primary">
              <Crown className="h-2 w-2" />
              {tier === "vip" ? "VIP" : "PRO"}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* Identity & Control */}
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          {t("common:account")}
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")} className="gap-2 text-xs">
            <User className="h-3.5 w-3.5" /> {t("navigation:profile")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/workspace")} className="gap-2 text-xs">
            <Settings className="h-3.5 w-3.5" /> {t("common:workspace_settings")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/data-privacy")} className="gap-2 text-xs">
            <Shield className="h-3.5 w-3.5" /> {t("common:data_privacy")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/docs")} className="gap-2 text-xs">
            <Code2 className="h-3.5 w-3.5" /> {t("common:api_docs", { defaultValue: "API & Docs" })}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Admin */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2 text-xs">
              <Landmark className="h-3.5 w-3.5" /> {t("common:admin_panel")}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Sign Out */}
        <DropdownMenuItem
          onClick={() => signOut()}
          className="gap-2 text-xs text-destructive focus:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" /> {t("common:sign_out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
