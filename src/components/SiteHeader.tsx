import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import logo from "@/assets/logo.gif";
import {
  Brain, Shield, Upload, Sparkles, Briefcase, Coins,
  LogOut, LogIn, Home, User, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", to: "/home", icon: Home, auth: true },
  { label: "Extractor", to: "/extractor", icon: Upload, auth: true },
  { label: "Neuroni", to: "/neurons", icon: Brain, auth: true },
  { label: "Servicii", to: "/services", icon: Sparkles, auth: true },
  { label: "Jobs", to: "/jobs", icon: Briefcase, auth: true },
  { label: "Credits", to: "/credits", icon: Coins, auth: true },
  { label: "Feedback", to: "/feedback", icon: MessageCircle, auth: true },
];

export function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { balance, loading: balanceLoading } = useCreditBalance();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-2">
        {/* Logo */}
        <button
          onClick={() => navigate(user ? "/home" : "/")}
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
          {/* Credit Balance Badge */}
          {user && (
            <button
              onClick={() => navigate("/credits")}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors"
              title="Balanță NEURONS"
            >
              <Coins className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-mono font-bold text-primary">
                {balanceLoading ? "…" : balance}
              </span>
            </button>
          )}
          <ThemeToggle />
          {user && <NotificationBell />}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate("/profile")}
              title="Profilul meu"
            >
              <User className="h-3.5 w-3.5" />
            </Button>
          )}
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
