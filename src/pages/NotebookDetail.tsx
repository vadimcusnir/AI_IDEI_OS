import { useParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useNotebookDetail } from "@/hooks/useNotebook";
import { NotebookSourcesPanel } from "@/components/notebook/NotebookSourcesPanel";
import { NotebookChatPanel } from "@/components/notebook/NotebookChatPanel";
import { NotebookStudioPanel } from "@/components/notebook/NotebookStudioPanel";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileText, MessageSquare, Wand2, ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

type MobileTab = "sources" | "chat" | "studio";

export default function NotebookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const detail = useNotebookDetail(id);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);

  const title = detail.notebook?.title || "Notebook";
  const updatedAt = detail.notebook?.updated_at
    ? formatDistanceToNow(new Date(detail.notebook.updated_at), { addSuffix: true })
    : null;

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <SEOHead title={`${title} — AI-IDEI`} description="Knowledge notebook" />

        {/* Mobile top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <button onClick={() => navigate("/notebooks")} className="text-muted-foreground hover:text-foreground p-1">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{title}</p>
            {updatedAt && <p className="text-nano text-muted-foreground">Updated {updatedAt}</p>}
          </div>
        </div>

        <div className="flex border-b border-border bg-card shrink-0">
          {([
            { key: "sources" as MobileTab, icon: FileText, label: "Sources", count: detail.sources.length },
            { key: "chat" as MobileTab, icon: MessageSquare, label: "Chat" },
            { key: "studio" as MobileTab, icon: Wand2, label: "Studio" },
          ]).map(({ key, icon: Icon, label, count }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-all relative",
                mobileTab === key ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {count !== undefined && count > 0 && (
                <span className="text-nano bg-primary/10 text-primary px-1 rounded-full">{count}</span>
              )}
              {mobileTab === key && (
                <motion.div
                  layoutId="mobile-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {mobileTab === "sources" && <NotebookSourcesPanel {...detail} notebook={detail.notebook} />}
              {mobileTab === "chat" && <NotebookChatPanel {...detail} />}
              {mobileTab === "studio" && <NotebookStudioPanel artifacts={detail.artifacts} sources={detail.sources} notebookId={id} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <SEOHead title={`${title} — AI-IDEI`} description="Knowledge notebook" />
      <div className="flex flex-1 min-h-0">
        {/* Sources Panel - collapsible */}
        <motion.div
          animate={{ width: sourcesCollapsed ? 40 : 280 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 border-r border-border overflow-hidden relative bg-card"
        >
          {sourcesCollapsed ? (
            <button
              onClick={() => setSourcesCollapsed(false)}
              className="w-full h-full flex flex-col items-center pt-3 gap-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Expand sources"
            >
              <PanelLeftOpen className="h-4 w-4" />
              <span className="text-nano font-medium" style={{ writingMode: "vertical-lr" }}>
                Sources ({detail.sources.length})
              </span>
            </button>
          ) : (
            <>
              <NotebookSourcesPanel {...detail} notebook={detail.notebook} />
              <button
                onClick={() => setSourcesCollapsed(true)}
                className="absolute top-3 right-2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted z-10"
                title="Collapse"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </motion.div>

        {/* Chat Panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <NotebookChatPanel {...detail} />
        </div>

        {/* Studio Panel */}
        <div className="w-[320px] shrink-0 border-l border-border overflow-hidden">
          <NotebookStudioPanel artifacts={detail.artifacts} sources={detail.sources} notebookId={id} />
        </div>
      </div>
    </div>
  );
}