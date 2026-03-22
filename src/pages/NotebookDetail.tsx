import { useParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useNotebookDetail } from "@/hooks/useNotebook";
import { NotebookSourcesPanel } from "@/components/notebook/NotebookSourcesPanel";
import { NotebookChatPanel } from "@/components/notebook/NotebookChatPanel";
import { NotebookStudioPanel } from "@/components/notebook/NotebookStudioPanel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, MessageSquare, Wand2 } from "lucide-react";

type MobileTab = "sources" | "chat" | "studio";

export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>();
  const detail = useNotebookDetail(id);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  const title = detail.notebook?.title || "Notebook";

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <SEOHead title={`${title} — AI-IDEI`} description="Knowledge notebook" />
        <div className="flex border-b border-border bg-card shrink-0">
          {([
            { key: "sources" as MobileTab, icon: FileText, label: "Sources" },
            { key: "chat" as MobileTab, icon: MessageSquare, label: "Chat" },
            { key: "studio" as MobileTab, icon: Wand2, label: "Studio" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
                mobileTab === key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          {mobileTab === "sources" && <NotebookSourcesPanel {...detail} notebook={detail.notebook} />}
          {mobileTab === "chat" && <NotebookChatPanel {...detail} />}
          {mobileTab === "studio" && <NotebookStudioPanel artifacts={detail.artifacts} sources={detail.sources} notebookId={id} />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SEOHead title={`${title} — AI-IDEI`} description="Knowledge notebook" />
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
          <NotebookSourcesPanel {...detail} notebook={detail.notebook} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={30}>
          <NotebookChatPanel {...detail} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={28} minSize={18} maxSize={40}>
          <NotebookStudioPanel artifacts={detail.artifacts} sources={detail.sources} notebookId={id} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
