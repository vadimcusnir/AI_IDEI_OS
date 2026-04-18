import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { Loader2 } from "lucide-react";
import { storeRedirect } from "@/lib/authRedirect";
import { trackAuthEvent } from "@/lib/authTelemetry";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Routes that should NOT trigger onboarding redirect (to avoid loops) */
const ONBOARDING_EXEMPT = ["/onboarding", "/profile", "/auth", "/reset-password", "/home", "/credits", "/settings"];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { flags, loading: flagsLoading } = useOnboardingState();
  const location = useLocation();

  if (loading || flagsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    // Preserve intended destination for post-auth redirect
    const target = location.pathname + location.search + location.hash;
    storeRedirect(target);
    trackAuthEvent("guard_redirect_triggered", { reason: "unauthenticated", from: target, to: "/auth" });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Enforce onboarding for new users (skip exempt routes) — propagă target original
  const isExempt = ONBOARDING_EXEMPT.some(p => location.pathname.startsWith(p));
  if (!isExempt && !flags.checklist_completed) {
    const target = location.pathname + location.search + location.hash;
    const onboardingUrl = `/onboarding?redirect=${encodeURIComponent(target)}`;
    trackAuthEvent("guard_redirect_triggered", { reason: "onboarding_incomplete", from: target, to: onboardingUrl });
    return <Navigate to={onboardingUrl} replace />;
  }

  return <>{children}</>;
}
