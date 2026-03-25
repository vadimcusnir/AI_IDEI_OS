import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Routes that should NOT trigger onboarding redirect (to avoid loops) */
const ONBOARDING_EXEMPT = ["/onboarding", "/profile", "/auth", "/reset-password"];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Enforce onboarding for new users (skip exempt routes)
  const isExempt = ONBOARDING_EXEMPT.some(p => location.pathname.startsWith(p));
  if (!isExempt) {
    const completed = localStorage.getItem(`onboarding_completed_${user.id}`);
    if (!completed) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}
