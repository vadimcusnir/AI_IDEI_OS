import { SEOHead } from "@/components/SEOHead";
import { AgentConsole } from "@/components/agent/AgentConsole";
import { useTranslation } from "react-i18next";

export default function ChatPage() {
  const { t } = useTranslation("pages");
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <SEOHead
        title={`${t("chat_page.title")} — AI-IDEI`}
        description={t("chat_page.desc")}
      />
      <AgentConsole />
    </div>
  );
}
