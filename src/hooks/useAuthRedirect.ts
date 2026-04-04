/**
 * useAuthRedirect — Hook for components that need to redirect to auth with intent preservation.
 * 
 * Usage:
 *   const authRedirect = useAuthRedirect();
 *   authRedirect("/services"); // navigates to /auth?redirect=/services
 *   authRedirect(); // navigates to /auth?redirect={current_page}
 */
import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";
import { storeRedirect } from "@/lib/authRedirect";

export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback((returnTo?: string) => {
    const target = returnTo || (location.pathname + location.search + location.hash);
    storeRedirect(target);
    const encoded = encodeURIComponent(target);
    navigate(`/auth?redirect=${encoded}`);
  }, [navigate, location]);
}
