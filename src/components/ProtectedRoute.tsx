import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { Loader2 } from "lucide-react";
import { storeRedirect } from "@/lib/authRedirect";

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
    storeRedirect(location.pathname + location.search + location.hash);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Enforce onboarding for new users (skip exempt routes)
  const isExempt = ONBOARDING_EXEMPT.some(p => location.pathname.startsWith(p));
  if (!isExempt && !flags.checklist_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
