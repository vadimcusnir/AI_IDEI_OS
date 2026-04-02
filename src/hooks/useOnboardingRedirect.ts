import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useOnboardingState } from "@/hooks/useOnboardingState";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redirects new users (0 neurons) to /onboarding after login.
 * Now reads flags from DB instead of localStorage.
 */
export function useOnboardingRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const { flags, loading: flagsLoading } = useOnboardingState();
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (authLoading || wsLoading || flagsLoading || checked) return;
    if (!user || !currentWorkspace) { setChecked(true); return; }

    const skipPaths = ["/onboarding", "/auth", "/reset-password"];
    if (skipPaths.some(p => location.pathname.startsWith(p))) {
      setChecked(true);
      return;
    }

    if (flags.checklist_dismissed || flags.checklist_completed) {
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
  }, [user, authLoading, wsLoading, flagsLoading, currentWorkspace, checked, location.pathname, flags]);
}
