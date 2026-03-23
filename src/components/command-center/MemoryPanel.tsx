import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History, Workflow, Play, Layers, FileText,
  X, Loader2, Trash2, Coins, Star, Clock,
  ChevronRight, Zap, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface HistoryRun {
  id: string;
  intent_key: string;
  plan_name: string;
  status: string;
  total_credits: number;
  created_at: string;
  completed_steps: number;
  total_steps: number;
  success: boolean;
}

interface SavedAsset {
  id: string;
  title: string;
  artifact_type: string;
  created_at: string;
}

interface WorkflowTemplate {
  id: string;
  intent_key: string;
  name: string;
  description: string;
  steps: Array<{ tool: string; label: string; credits: number }>;
  estimated_credits: number;
  estimated_duration_seconds: number;
  success_count: number;
  failure_count: number;
  is_default: boolean;
  created_at: string;
}

interface MemoryPanelProps {
  visible: boolean;
  onClose: () => void;
  onReplay: (intent: string) => void;
  onExecuteTemplate?: (template: WorkflowTemplate) => void;
  sessions: Array<{
    session_id: string;
    last_message: string | null;
    created_at: string;
    message_count: number;
  }>;
  onLoadSession: (sid: string) => void;
  onDeleteSession: (sid: string) => void;
  currentSessionId: string;
}

type Tab = "history" | "assets" | "templates" | "sessions";

export function MemoryPanel({
  visible, onClose, onReplay, onExecuteTemplate,
  sessions, onLoadSession, onDeleteSession, currentSessionId,
}: MemoryPanelProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("history");
  const [runs, setRuns] = useState<HistoryRun[]>([]);
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [runsRes, assetsRes, templatesRes] = await Promise.all([
      supabase.from("agent_action_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("artifacts")
        .select("id, title, artifact_type, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase.from("agent_plan_templates")
        .select("*")
        .order("success_count", { ascending: false })
        .limit(50),
    ]);

    if (runsRes.data) setRuns(runsRes.data as unknown as HistoryRun[]);
    if (assetsRes.data) setAssets(assetsRes.data as SavedAsset[]);
    if (templatesRes.data) setTemplates(templatesRes.data as unknown as WorkflowTemplate[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (visible) loadData();
  }, [visible, loadData]);

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from("agent_plan_templates").delete().eq("id", id).eq("is_default", false);
    if (error) {
      toast.error("Cannot delete system templates");
      return;
    }
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  if (!visible) return null;

  const TABS: Array<{ key: Tab; label: string; icon: typeof History; count?: number }> = [
    { key: "history", label: "Runs", icon: History, count: runs.length },
    { key: "templates", label: "Workflows", icon: Workflow, count: templates.length },
    { key: "assets", label: "Assets", icon: FileText, count: assets.length },
    { key: "sessions", label: "Sessions", icon: Layers },
  ];

  const filteredRuns = search
    ? runs.filter(r => r.intent_key.includes(search.toLowerCase()) || r.plan_name?.toLowerCase().includes(search.toLowerCase()))
    : runs;

  const filteredAssets = search
    ? assets.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : assets;

  const filteredTemplates = search
    ? templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.intent_key.includes(search.toLowerCase()))
    : templates;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 300, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="border-l border-border bg-card flex flex-col h-full overflow-hidden shrink-0"
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold">Memory</span>
        </div>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Tab nav */}
      <div className="flex border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors border-b-2",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="h-7 text-[10px]"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Runs tab */}
        {tab === "history" && !loading && filteredRuns.map(run => (
          <button
            key={run.id}
            onClick={() => onReplay(run.intent_key)}
            className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-medium truncate">
                {run.plan_name || run.intent_key.replace(/_/g, " ")}
              </span>
              <Badge
                variant={run.success ? "default" : "destructive"}
                className="text-[8px] h-4 shrink-0"
              >
                {run.success ? "OK" : "FAIL"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span>{run.completed_steps}/{run.total_steps} steps</span>
              <span>·</span>
              <span>{run.total_credits} N</span>
              <span>·</span>
              <span>{new Date(run.created_at).toLocaleDateString()}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 mt-1 flex items-center gap-1 text-[9px] text-primary">
              <Play className="h-3 w-3" />
              Re-run this
            </div>
          </button>
        ))}

        {tab === "history" && !loading && filteredRuns.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-8">No execution history yet</p>
        )}

        {/* Templates tab */}
        {tab === "templates" && !loading && filteredTemplates.map(tmpl => {
          const successRate = tmpl.success_count + tmpl.failure_count > 0
            ? Math.round((tmpl.success_count / (tmpl.success_count + tmpl.failure_count)) * 100)
            : null;

          return (
            <div
              key={tmpl.id}
              className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] font-medium truncate">{tmpl.name}</span>
                <div className="flex items-center gap-1">
                  {tmpl.is_default && (
                    <Badge variant="outline" className="text-[7px] h-3.5 px-1 border-primary/30 text-primary">
                      <Star className="h-2 w-2 mr-0.5" />
                      System
                    </Badge>
                  )}
                </div>
              </div>

              {tmpl.description && (
                <p className="text-[9px] text-muted-foreground line-clamp-2 mb-1">{tmpl.description}</p>
              )}

              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Zap className="h-2.5 w-2.5" />
                  {(tmpl.steps as any[])?.length || 0} steps
                </span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  <Coins className="h-2.5 w-2.5" />
                  {tmpl.estimated_credits} N
                </span>
                {successRate !== null && (
                  <>
                    <span>·</span>
                    <span className={cn(
                      successRate >= 80 ? "text-green-500" : successRate >= 50 ? "text-yellow-500" : "text-destructive"
                    )}>
                      {successRate}% success
                    </span>
                  </>
                )}
              </div>

              {/* Steps preview */}
              <div className="mt-1.5 space-y-0.5">
                {((tmpl.steps as any[]) || []).slice(0, 3).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-[8px] text-muted-foreground/70">
                    <span className="font-mono w-3">{i + 1}.</span>
                    <span className="truncate">{s.label}</span>
                    {s.credits > 0 && <span className="shrink-0">{s.credits}N</span>}
                  </div>
                ))}
                {((tmpl.steps as any[]) || []).length > 3 && (
                  <span className="text-[8px] text-muted-foreground/50">
                    +{((tmpl.steps as any[]) || []).length - 3} more steps
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="opacity-0 group-hover:opacity-100 mt-2 flex items-center gap-1.5 transition-opacity">
                {onExecuteTemplate && (
                  <Button
                    size="sm"
                    className="h-6 text-[9px] gap-1 flex-1"
                    onClick={() => onExecuteTemplate(tmpl)}
                  >
                    <Play className="h-2.5 w-2.5" />
                    Execute
                  </Button>
                )}
                {!tmpl.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteTemplate(tmpl.id)}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {tab === "templates" && !loading && filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <Workflow className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground">No workflow templates yet</p>
            <p className="text-[9px] text-muted-foreground/70 mt-0.5">Run a task and save it as template</p>
          </div>
        )}

        {/* Assets tab */}
        {tab === "assets" && !loading && filteredAssets.map(asset => (
          <div
            key={asset.id}
            className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <p className="text-[11px] font-medium truncate">{asset.title}</p>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
              <Badge variant="outline" className="text-[8px] h-4">{asset.artifact_type}</Badge>
              <span>{new Date(asset.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {tab === "assets" && !loading && filteredAssets.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-8">No saved assets yet</p>
        )}

        {/* Sessions tab */}
        {tab === "sessions" && sessions.map(s => (
          <button
            key={s.session_id}
            onClick={() => onLoadSession(s.session_id)}
            className={cn(
              "w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors group flex items-center justify-between",
              s.session_id === currentSessionId && "bg-primary/5 border border-primary/20"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[10px] truncate">{s.last_message || "Session"}</p>
              <p className="text-[8px] text-muted-foreground">
                {new Date(s.created_at).toLocaleDateString()} · {s.message_count} msgs
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteSession(s.session_id); }}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity ml-2 shrink-0"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        ))}

        {tab === "sessions" && sessions.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-8">No previous sessions</p>
        )}
      </div>
    </motion.div>
  );
}
