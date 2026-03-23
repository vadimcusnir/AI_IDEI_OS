import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redirects new users (0 neurons) to /onboarding after login.
 * Skips if already on /onboarding, /auth, or /reset-password.
 */
export function useOnboardingRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (authLoading || wsLoading || checked) return;
    if (!user || !currentWorkspace) { setChecked(true); return; }

    const skipPaths = ["/onboarding", "/auth", "/reset-password"];
    if (skipPaths.some(p => location.pathname.startsWith(p))) {
      setChecked(true);
      return;
    }

    // Check if user has already dismissed onboarding or completed it
    const dismissed = localStorage.getItem(`onboarding_dismissed_${user.id}`);
    const completed = localStorage.getItem(`onboarding_completed_${user.id}`);
    if (dismissed === "true" || completed === "true") {
      setChecked(true);
      return;
    }

    // Check neuron + episode count — skip onboarding if user has content
    Promise.all([
      supabase
        .from("neurons")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", currentWorkspace.id),
      supabase
        .from("episodes")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", currentWorkspace.id),
    ]).then(([neuronsRes, episodesRes]) => {
      const neuronCount = neuronsRes.count ?? 0;
      const episodeCount = episodesRes.count ?? 0;
      if (neuronCount === 0 && episodeCount === 0) {
        navigate("/onboarding", { replace: true });
      }
      setChecked(true);
    });
  }, [user, authLoading, wsLoading, currentWorkspace, checked, location.pathname]);
}
