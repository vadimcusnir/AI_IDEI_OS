import { useState } from "react";
import {
  GitBranch, MessageSquare, BarChart3, Link2,
  Clock, ChevronDown, ChevronUp, Eye, Download, Quote,
  Terminal, CheckCircle2, XCircle, Loader2, Zap,
  Trash2, Plus, Save
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExecutionLog } from "./types";
import { NeuronLink, NeuronVersion } from "@/hooks/useNeuronGraph";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

type BottomTab = "relations" | "history" | "logs" | "analytics" | "comments";

interface NeuronBottomBarProps {
  isExpanded: boolean;
  onToggle: () => void;
  executionLogs: ExecutionLog[];
  links: NeuronLink[];
  versions: NeuronVersion[];
  loadingLinks: boolean;
  loadingVersions: boolean;
  onRemoveLink?: (linkId: string) => void;
  onSaveVersion?: () => void;
  onClearLogs?: () => void;
  onRestoreVersion?: (version: NeuronVersion) => void;
}

const tabs: { id: BottomTab; label: string; icon: React.ElementType }[] = [
  { id: "relations", label: "Relations", icon: Link2 },
  { id: "history", label: "History", icon: GitBranch },
  { id: "logs", label: "Execution Logs", icon: Terminal },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "comments", label: "Comments", icon: MessageSquare },
];

const relationColors: Record<string, string> = {
  supports: "bg-status-validated/15 text-status-validated",
  contradicts: "bg-destructive/15 text-destructive",
  extends: "bg-primary/15 text-primary",
  references: "bg-muted text-muted-foreground",
  derived_from: "bg-graph-highlight/15 text-graph-highlight",
};

const logStatusIcons = {
  idle: Zap,
  running: Loader2,
  success: CheckCircle2,
  error: XCircle,
};

const logStatusColors = {
  idle: "text-muted-foreground",
  running: "text-primary",
  success: "text-status-validated",
  error: "text-destructive",
};

export function NeuronBottomBar({
  isExpanded, onToggle, executionLogs,
  links, versions, loadingLinks, loadingVersions,
  onRemoveLink, onSaveVersion, onClearLogs, onRestoreVersion,
}: NeuronBottomBarProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("relations");
  const [commentText, setCommentText] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  return (
    <div className={cn("border-t border-border bg-card shrink-0 transition-all", isExpanded ? "h-48" : "h-9")}>
      <div className="h-9 flex items-center gap-0.5 px-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (!isExpanded) onToggle(); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-dense font-medium transition-colors",
              activeTab === tab.id && isExpanded
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
            {tab.id === "relations" && links.length > 0 && (
              <span className="text-nano bg-muted rounded-full px-1.5">{links.length}</span>
            )}
            {tab.id === "logs" && executionLogs.length > 0 && (
              <span className="text-nano bg-primary/15 text-primary rounded-full px-1.5">{executionLogs.length}</span>
            )}
            {tab.id === "history" && versions.length > 0 && (
              <span className="text-nano bg-muted rounded-full px-1.5">{versions.length}</span>
            )}
          </button>
        ))}
        <div className="flex-1" />

        {/* Tab-specific actions */}
        {isExpanded && activeTab === "logs" && executionLogs.length > 0 && onClearLogs && (
          <Button variant="ghost" size="sm" className="h-6 text-micro px-2 text-muted-foreground" onClick={onClearLogs}>
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
        {isExpanded && activeTab === "history" && onSaveVersion && (
          <Button variant="ghost" size="sm" className="h-6 text-micro px-2 text-primary" onClick={onSaveVersion}>
            <Save className="h-3 w-3 mr-1" /> Save Version
          </Button>
        )}

        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="h-[calc(100%-36px)] overflow-y-auto px-3 py-2">
          {/* Relations */}
          {activeTab === "relations" && (
            <div>
              {loadingLinks ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-xs text-muted-foreground/50 text-center py-4">
                  No relations yet. Connect this neuron to others.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {links.map(rel => {
                    const displayTitle = rel.direction === "outgoing"
                      ? rel.targetTitle || `Neuron #${rel.targetNeuronId}`
                      : rel.sourceTitle || `Neuron #${rel.sourceNeuronId}`;
                    const targetNumber = rel.direction === "outgoing" ? rel.targetNeuronId : rel.sourceNeuronId;

                    return (
                      <div key={rel.id} className="group flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors">
                        <span className={cn("text-nano", rel.direction === "outgoing" ? "text-primary" : "text-muted-foreground")}>
                          {rel.direction === "outgoing" ? "→" : "←"}
                        </span>
                        <button onClick={() => navigate(`/n/${targetNumber}`)} className="font-medium hover:text-primary transition-colors">
                          {displayTitle}
                        </button>
                        <Badge variant="secondary" className={cn("text-nano px-1.5 py-0", relationColors[rel.relationType] || "bg-muted text-muted-foreground")}>
                          {rel.relationType}
                        </Badge>
                        {onRemoveLink && (
                          <button
                            onClick={() => onRemoveLink(rel.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === "history" && (
            <div>
              {loadingVersions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-xs text-muted-foreground/50 text-center py-4">
                  No versions saved yet. Click "Save Version" to create a snapshot.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {versions.map((v, i) => (
                    <div key={v.id} className={cn("flex items-center gap-3 px-2 py-1.5 rounded-md text-xs group", i === 0 ? "bg-primary/5" : "hover:bg-muted/50")}>
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-24 shrink-0">
                        {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                      </span>
                      <span className="font-mono text-micro text-muted-foreground/60">v{v.version}</span>
                      <span className="font-medium flex-1 truncate">{v.title}</span>
                      {onRestoreVersion && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-nano px-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                          onClick={() => onRestoreVersion(v)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Logs */}
          {activeTab === "logs" && (
            <div className="space-y-1">
              {executionLogs.length === 0 ? (
                <div className="text-xs text-muted-foreground/50 text-center py-4">
                  No execution logs yet. Run a block to see activity.
                </div>
              ) : (
                executionLogs.map(log => {
                  const StatusIcon = logStatusIcons[log.status];
                  return (
                    <div key={log.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs hover:bg-muted/30">
                      <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", logStatusColors[log.status], log.status === "running" && "animate-spin")} />
                      <span className="font-mono text-micro text-muted-foreground w-16 shrink-0">{log.timestamp}</span>
                      <span className={cn("font-mono text-nano uppercase px-1 py-0 rounded", "bg-muted text-muted-foreground")}>{log.blockType}</span>
                      <span className="flex-1 font-medium">{log.action}</span>
                      {log.result && <span className="text-muted-foreground text-micro">{log.result}</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Analytics */}
          {activeTab === "analytics" && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Links", value: String(links.length), icon: Link2 },
                { label: "Versions", value: String(versions.length), icon: GitBranch },
                { label: "Blocks", value: String(0), icon: Eye },
                { label: "Executions", value: String(executionLogs.filter(l => l.status === "success").length), icon: Terminal },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1 py-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-micro text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Comments */}
          {activeTab === "comments" && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground/50 text-center py-2">
                {t("common:neuron_editor.comments_coming_soon")}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("common:neuron_editor.add_comment")}
                  className="flex-1 text-xs bg-muted/50 rounded-md px-2.5 py-1.5 outline-none border-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
