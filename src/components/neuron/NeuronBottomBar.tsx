import { useState } from "react";
import {
  GitBranch, MessageSquare, BarChart3, Link2,
  Clock, ChevronDown, ChevronUp, Eye, Download, Quote,
  Terminal, CheckCircle2, XCircle, Loader2, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ExecutionLog } from "./types";

type BottomTab = "relations" | "history" | "analytics" | "comments" | "logs";

interface RelationItem {
  id: string;
  targetTitle: string;
  relationType: string;
  direction: "outgoing" | "incoming";
}

const relations: RelationItem[] = [
  { id: "r1", targetTitle: "Attention Economy", relationType: "references", direction: "outgoing" },
  { id: "r2", targetTitle: "Viral Content Framework", relationType: "extends", direction: "outgoing" },
  { id: "r3", targetTitle: "Identity & Branding", relationType: "supports", direction: "incoming" },
  { id: "r4", targetTitle: "Network Effects", relationType: "contradicts", direction: "incoming" },
  { id: "r5", targetTitle: "Bitcoin Meme Analysis", relationType: "derived_from", direction: "outgoing" },
];

const versions = [
  { id: "v1", timestamp: "2 min ago", author: "You", changes: "Added YAML pipeline block" },
  { id: "v2", timestamp: "15 min ago", author: "You", changes: "Added prompt definition" },
  { id: "v3", timestamp: "1 hour ago", author: "You", changes: "Added code block with viral_score" },
  { id: "v4", timestamp: "3 hours ago", author: "You", changes: "Initial draft" },
];

const comments = [
  { id: "c1", author: "AI Worker", text: "Pipeline validated. 3 tasks registered. Consider adding error handling to extract_frameworks.", timestamp: "2 min ago" },
  { id: "c2", author: "You", text: "Need to find more data on identity-linked sharing.", timestamp: "30 min ago" },
];

const relationColors: Record<string, string> = {
  supports: "bg-status-validated/15 text-status-validated",
  contradicts: "bg-destructive/15 text-destructive",
  extends: "bg-primary/15 text-primary",
  references: "bg-muted text-muted-foreground",
  derived_from: "bg-graph-highlight/15 text-graph-highlight",
};

const tabs: { id: BottomTab; label: string; icon: React.ElementType }[] = [
  { id: "relations", label: "Relations", icon: Link2 },
  { id: "history", label: "History", icon: GitBranch },
  { id: "logs", label: "Execution Logs", icon: Terminal },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "comments", label: "Comments", icon: MessageSquare },
];

interface NeuronBottomBarProps {
  isExpanded: boolean;
  onToggle: () => void;
  executionLogs: ExecutionLog[];
}

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

export function NeuronBottomBar({ isExpanded, onToggle, executionLogs }: NeuronBottomBarProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("relations");

  return (
    <div className={cn("border-t border-border bg-card shrink-0 transition-all", isExpanded ? "h-48" : "h-9")}>
      <div className="h-9 flex items-center gap-0.5 px-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (!isExpanded) onToggle(); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              activeTab === tab.id && isExpanded
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
            {tab.id === "relations" && (
              <span className="text-[9px] bg-muted rounded-full px-1.5">{relations.length}</span>
            )}
            {tab.id === "logs" && executionLogs.length > 0 && (
              <span className="text-[9px] bg-primary/15 text-primary rounded-full px-1.5">{executionLogs.length}</span>
            )}
            {tab.id === "comments" && (
              <span className="text-[9px] bg-muted rounded-full px-1.5">{comments.length}</span>
            )}
          </button>
        ))}
        <div className="flex-1" />
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="h-[calc(100%-36px)] overflow-y-auto px-3 py-2">
          {activeTab === "relations" && (
            <div className="flex flex-wrap gap-2">
              {relations.map(rel => (
                <div key={rel.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5 text-xs hover:bg-muted/60 transition-colors cursor-pointer">
                  <span className={cn("text-[9px]", rel.direction === "outgoing" ? "text-primary" : "text-muted-foreground")}>
                    {rel.direction === "outgoing" ? "→" : "←"}
                  </span>
                  <span className="font-medium">{rel.targetTitle}</span>
                  <Badge variant="secondary" className={cn("text-[9px] px-1.5 py-0", relationColors[rel.relationType])}>
                    {rel.relationType}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-1.5">
              {versions.map((v, i) => (
                <div key={v.id} className={cn("flex items-center gap-3 px-2 py-1.5 rounded-md text-xs", i === 0 ? "bg-primary/5" : "hover:bg-muted/50")}>
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-20 shrink-0">{v.timestamp}</span>
                  <span className="font-medium flex-1">{v.changes}</span>
                  <span className="text-muted-foreground">{v.author}</span>
                </div>
              ))}
            </div>
          )}

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
                      <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">{log.timestamp}</span>
                      <span className={cn("font-mono text-[9px] uppercase px-1 py-0 rounded", "bg-muted text-muted-foreground")}>{log.blockType}</span>
                      <span className="flex-1 font-medium">{log.action}</span>
                      {log.result && <span className="text-muted-foreground text-[10px]">{log.result}</span>}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Views", value: "127", icon: Eye },
                { label: "Citations", value: "8", icon: Quote },
                { label: "Exports", value: "3", icon: Download },
                { label: "Executions", value: String(executionLogs.filter(l => l.status === "success").length), icon: Terminal },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1 py-2">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2 text-xs">
                  <div className={cn(
                    "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                    c.author === "AI Worker" ? "bg-ai-accent/15 text-ai-accent" : "bg-primary/15 text-primary"
                  )}>
                    {c.author[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.author}</span>
                      {c.author === "AI Worker" && <span className="text-[8px] bg-ai-accent/15 text-ai-accent rounded px-1">AI</span>}
                      <span className="text-muted-foreground text-[10px]">{c.timestamp}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  placeholder="Add a comment..."
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
