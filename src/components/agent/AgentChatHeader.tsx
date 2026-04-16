import { Button } from "@/components/ui/button";
import { Terminal, History, RotateCcw, PanelRightOpen, PanelRightClose } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AgentChatHeaderProps {
  totalNeurons: number;
  totalEpisodes: number;
  balance: number;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  showTimeline: boolean;
  setShowTimeline: (v: boolean) => void;
  hasPlanMeta: boolean;
  clearChat: () => void;
}

export function AgentChatHeader({
  totalNeurons, totalEpisodes, balance,
  showHistory, setShowHistory,
  showTimeline, setShowTimeline,
  hasPlanMeta, clearChat,
}: AgentChatHeaderProps) {
  const { t } = useTranslation("common");

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <Terminal className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs font-bold">{t("knowledge_os_agent")}</p>
          <div className="flex items-center gap-2 text-nano text-muted-foreground">
            <span>{totalNeurons} {t("neurons_label")}</span>
            <span aria-hidden="true">·</span>
            <span>{totalEpisodes} {t("episodes_label")}</span>
            <span aria-hidden="true">·</span>
            <span className="text-primary font-medium">{balance.toLocaleString()} {t("credits_label")}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1" role="toolbar" aria-label="Chat actions">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowHistory(!showHistory)} aria-label="Toggle session history" aria-expanded={showHistory}>
          <History className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={clearChat} aria-label="Clear chat">
          <RotateCcw className="h-3 w-3" />
        </Button>
        {hasPlanMeta && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowTimeline(!showTimeline)} aria-label="Toggle execution timeline">
            {showTimeline ? <PanelRightClose className="h-3 w-3" /> : <PanelRightOpen className="h-3 w-3" />}
          </Button>
        )}
      </div>
    </header>
  );
}
