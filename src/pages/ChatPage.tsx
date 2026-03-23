import { SEOHead } from "@/components/SEOHead";
import { CommandCenter } from "@/components/command-center/CommandCenter";
import { useTranslation } from "react-i18next";

export default function ChatPage() {
  const { t } = useTranslation("pages");
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <SEOHead
        title={`Command Center — AI-IDEI`}
        description={t("chat_page.desc")}
      />
      <CommandCenter />
    </div>
  );
}
