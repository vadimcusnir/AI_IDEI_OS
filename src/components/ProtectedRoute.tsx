import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { storeRedirect } from "@/lib/authRedirect";
import { trackAuthEvent } from "@/lib/authTelemetry";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Auth-only gate. Onboarding is invitational, not enforced:
 * — `useOnboardingRedirect` (mounted at /home via useCommandCenter) handles
 *   the soft first-login redirect.
 * — `OnboardingChecklist` invites progress without trapping the user.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    const target = location.pathname + location.search + location.hash;
    storeRedirect(target);
    trackAuthEvent("guard_redirect_triggered", { reason: "unauthenticated", from: target, to: "/auth" });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
