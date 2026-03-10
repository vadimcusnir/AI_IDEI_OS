import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import logo from "@/assets/logo.gif";
import {
  Brain, Shield, BookOpen, Link2, LogOut, LogIn,
  LayoutDashboard, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Neuroni", to: "/", icon: Brain, auth: true },
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, auth: true },
  { label: "Links", to: "/links", icon: Link2, auth: false },
  { label: "Docs", to: "/architecture", icon: BookOpen, auth: false },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-2">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 shrink-0 mr-2"
        >
          <img src={logo} alt="AI-IDEI" className="h-7 w-7 rounded-full" />
          <span className="text-sm font-bold hidden sm:inline">AI-IDEI</span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
          {NAV_ITEMS
            .filter(item => !item.auth || user)
            .map(item => {
              const active = location.pathname === item.to;
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                location.pathname === "/admin"
                  ? "bg-destructive/10 text-destructive"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ThemeToggle />
          {user && <NotificationBell />}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut()}
              title="Deconectare"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => navigate("/auth")}
            >
              <LogIn className="h-3.5 w-3.5 mr-1" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
