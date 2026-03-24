import { SEOHead } from "@/components/SEOHead";
import { CommandCenter } from "@/components/command-center/CommandCenter";
import { useTranslation } from "react-i18next";
import { useOnboardingRedirect } from "@/hooks/useOnboardingRedirect";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

export default function Home() {
  const { t } = useTranslation("pages");
  useOnboardingRedirect();

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-var(--header-height,3.5rem))]">
      <WelcomeModal />
      <SEOHead
        title={`${t("home.cockpit")} — AI-IDEI`}
        description={t("home.cockpit_desc")}
      />
      <CommandCenter />
    </div>
  );
}
