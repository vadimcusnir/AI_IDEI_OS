import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { HomeSkeleton } from "@/components/skeletons/HomeSkeleton";
import { PageTransition } from "@/components/motion/PageTransition";

const CommandCenter = lazy(() =>
  import("@/components/command-center/CommandCenter").then(m => ({ default: m.CommandCenter }))
);

export default function Home() {
  const { loading: authLoading } = useAuth();
  const { t } = useTranslation("pages");

  useOnboardingRedirect();

  if (authLoading) return <HomeSkeleton />;

  return (
    <PageTransition>
      <WelcomeModal />
      <SEOHead title={`${t("home.cockpit")} — AI-IDEI`} description={t("home.cockpit_desc")} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Suspense fallback={<HomeSkeleton />}>
          <CommandCenter />
        </Suspense>
      </div>
    </PageTransition>
  );
}
