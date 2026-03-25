/**
 * P2-005: Onboarding flow enforcement
 * Forces new users through onboarding steps before accessing the app.
 */
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_STEPS = [
  { key: "profile_complete", label: "Completează profilul" },
  { key: "first_upload", label: "Încarcă primul conținut" },
  { key: "first_extraction", label: "Rulează prima extracție" },
] as const;

const EXEMPT_ROUTES = ["/auth", "/onboarding", "/login", "/register", "/guest/"];

interface OnboardingState {
  isComplete: boolean;
  currentStep: number;
  steps: typeof ONBOARDING_STEPS;
  loading: boolean;
  markStepComplete: (key: string) => Promise<void>;
}

export function useOnboardingGuard(): OnboardingState {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  async function checkOnboardingStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.onboarding_completed) {
        setCompletedSteps(new Set(ONBOARDING_STEPS.map(s => s.key)));
        setLoading(false);
        return;
      }

      const completed = new Set<string>();

      // Check profile completion
      if (profile?.display_name && profile.display_name !== "User") {
        completed.add("profile_complete");
      }

      // Check first upload
      const { count: neuronCount } = await supabase
        .from("neurons")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id);
      if (neuronCount && neuronCount > 0) completed.add("first_upload");

      // Check first extraction
      const { count: execCount } = await supabase
        .from("service_executions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (execCount && execCount > 0) completed.add("first_extraction");

      setCompletedSteps(completed);

      // Redirect if not complete and not on exempt route
      const isExempt = EXEMPT_ROUTES.some(r => location.pathname.startsWith(r));
      if (completed.size < ONBOARDING_STEPS.length && !isExempt) {
        navigate("/onboarding", { replace: true });
      }
    } catch (err) {
      console.error("[onboarding-guard]", err);
    } finally {
      setLoading(false);
    }
  }

  const markStepComplete = async (key: string) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      next.add(key);

      // If all steps done, mark onboarding complete in profile
      if (next.size >= ONBOARDING_STEPS.length) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from("profiles")
              .update({ onboarding_completed: true })
              .eq("id", user.id)
              .then(() => {});
          }
        });
      }

      return next;
    });
  };

  const currentStep = ONBOARDING_STEPS.findIndex(s => !completedSteps.has(s.key));

  return {
    isComplete: completedSteps.size >= ONBOARDING_STEPS.length,
    currentStep: currentStep === -1 ? ONBOARDING_STEPS.length : currentStep,
    steps: ONBOARDING_STEPS,
    loading,
    markStepComplete,
  };
}
