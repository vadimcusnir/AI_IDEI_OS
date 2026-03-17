import { useState, useMemo, useEffect } from "react";
import {
  Sparkles, Brain, Lightbulb, MessageSquareQuote, Target,
  BookOpen,
  FileText, Twitter, Video, Presentation,
  Network, Radar, TrendingUp,
  ChevronRight, MessageCircle, Zap,
  Code, Bug, TestTube, Gauge,
  Play, Settings2, Calendar,
  FileCode, Braces, FileAudio, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Block, BLOCK_TYPE_CONFIG } from "./types";
import { CollapsibleSection } from "./right-panel/CollapsibleSection";
import { ScorePanel } from "./right-panel/ScorePanel";
import { NeuronChatPanel } from "./NeuronChatPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface EpisodeSource {
  id: string;
  title: string;
  source_type: string;
  transcript: string | null;
}

interface NeuronRightPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  neuronScore: number;
  blocks: Block[];
  neuronId?: number;
  neuronTitle?: string;
  onAIAction?: (action: string, blockIds?: string[]) => void;
  selectedEpisodeTranscript?: string;
  onEpisodeSelect?: (transcript: string | null) => void;
}

type RightPanelTab = "tools" | "chat";

export function NeuronRightPanel({ isCollapsed, onToggle, neuronScore, blocks, neuronId, neuronTitle, onAIAction, selectedEpisodeTranscript, onEpisodeSelect }: NeuronRightPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RightPanelTab>("tools");
  const [episodes, setEpisodes] = useState<EpisodeSource[]>([]);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const executableCount = blocks.filter(b => BLOCK_TYPE_CONFIG[b.type].executable).length;
  const formatStats = useMemo(() => ({
    code: blocks.filter(b => b.type === "code").length,
    yaml: blocks.filter(b => b.type === "yaml").length,
    prompts: blocks.filter(b => b.type === "prompt").length,
    data: blocks.filter(b => b.type === "dataset" || b.type === "json").length,
  }), [blocks]);

  // Load user episodes with transcripts
  useEffect(() => {
    if (!user) return;
    const loadEpisodes = async () => {
      setLoadingEpisodes(true);
      const { data } = await supabase
        .from("episodes")
        .select("id, title, source_type, transcript")
        .not("transcript", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);
      setEpisodes((data || []) as EpisodeSource[]);
      setLoadingEpisodes(false);
    };
    loadEpisodes();
  }, [user]);

  // Also check if neuron has an episode_id linked
  useEffect(() => {
    if (!neuronId) return;
    const checkLinkedEpisode = async () => {
      const { data } = await supabase
        .from("neurons")
        .select("episode_id")
        .eq("id", neuronId)
        .single();
      if (data?.episode_id) {
        setSelectedEpisodeId(data.episode_id);
        // Load the transcript
        const { data: ep } = await supabase
          .from("episodes")
          .select("transcript")
          .eq("id", data.episode_id)
          .single();
        if (ep?.transcript) {
          onEpisodeSelect?.(ep.transcript);
        }
      }
    };
    checkLinkedEpisode();
  }, [neuronId]);

  const handleEpisodeChange = (episodeId: string) => {
    if (episodeId === "") {
      setSelectedEpisodeId(null);
      onEpisodeSelect?.(null);
      return;
    }
    setSelectedEpisodeId(episodeId);
    const ep = episodes.find(e => e.id === episodeId);
    onEpisodeSelect?.(ep?.transcript || null);
  };

  const handleAIAction = (action: string) => {
    onAIAction?.(action);
  };

  if (isCollapsed) {
    return (
      <div className="w-10 border-l border-border bg-card flex flex-col items-center py-3 gap-3 shrink-0 transition-all duration-200">
        <button onClick={onToggle} className="text-ai-accent hover:text-foreground transition-colors">
          <Sparkles className="h-4 w-4" />
        </button>
        <button onClick={() => { onToggle(); setActiveTab("chat"); }} className="text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Code className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Network className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 border-l border-border bg-card flex flex-col shrink-0 overflow-hidden transition-all duration-200">
      {/* Header with tabs */}
      <div className="h-9 flex items-center justify-between px-1 border-b border-border shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveTab("tools")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors",
              activeTab === "tools"
                ? "text-ai-accent bg-ai-bg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3 w-3" />
            Tools
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors",
              activeTab === "chat"
                ? "text-ai-accent bg-ai-bg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageCircle className="h-3 w-3" />
            Chat
          </button>
        </div>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors px-1">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === "chat" && (
        <NeuronChatPanel
          blocks={blocks}
          neuronTitle={neuronTitle || ""}
          isVisible={true}
        />
      )}

      {/* Tools tab */}
      {activeTab === "tools" && (
        <>
          <ScorePanel neuronScore={neuronScore} formatStats={formatStats} />

          {/* Episode Source Selector */}
          <div className="px-3 py-2 border-b border-border">
            <label className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block flex items-center gap-1">
              <FileAudio className="h-2.5 w-2.5" />
              Sursă Transcript
            </label>
            {selectedEpisodeId ? (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-foreground truncate flex-1">
                  {episodes.find(e => e.id === selectedEpisodeId)?.title || "Episod legat"}
                </span>
                <button
                  onClick={() => handleEpisodeChange("")}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <select
                value={selectedEpisodeId || ""}
                onChange={e => handleEpisodeChange(e.target.value)}
                className="w-full bg-muted/50 rounded px-2 py-1 text-[10px] border border-border outline-none focus:border-primary"
              >
                <option value="">— Fără sursă (doar blocurile neuronului) —</option>
                {episodes.map(ep => (
                  <option key={ep.id} value={ep.id}>
                    {ep.title} ({ep.source_type})
                  </option>
                ))}
              </select>
            )}
            {selectedEpisodeId && (
              <p className="text-[8px] text-muted-foreground/50 mt-0.5">
                AI va folosi transcriptul ca sursă pentru extracție
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <CollapsibleSection
              title="AI Extraction"
              icon={Sparkles}
              color="text-ai-accent"
              items={[
                { icon: Brain, label: "Extract Insights", description: "Key takeaways from content", action: "extract_insights" },
                { icon: BookOpen, label: "Extract Frameworks", description: "Structured mental models", action: "extract_frameworks" },
                { icon: MessageSquareQuote, label: "Extract Questions", description: "Questions this raises", action: "extract_questions" },
                { icon: Target, label: "Extract Quotes", description: "Quotable statements", action: "extract_quotes" },
                { icon: Lightbulb, label: "Extract Prompts", description: "Auto-generate prompts", action: "extract_prompts" },
              ]}
              onAction={handleAIAction}
            />

            <CollapsibleSection
              title="Code Tools"
              icon={Code}
              color="text-status-validated"
              items={[
                { icon: Bug, label: "Debug Code", description: "Find and fix errors", action: "debug_code" },
                { icon: Gauge, label: "Optimize Code", description: "Performance improvements", action: "optimize_code" },
                { icon: TestTube, label: "Generate Tests", description: "Auto-create test cases", action: "generate_tests" },
                { icon: FileCode, label: "Explain Code", description: "Line-by-line explanation", action: "explain_code" },
              ]}
              onAction={handleAIAction}
              defaultOpen={false}
            />

            <CollapsibleSection
              title="Pipeline Execution"
              icon={Play}
              color="text-primary"
              items={[
                { icon: Play, label: "Run Pipeline", description: "Execute YAML pipeline", action: "run_pipeline" },
                { icon: Settings2, label: "Simulate", description: "Dry-run without side effects", action: "simulate" },
                { icon: Calendar, label: "Schedule", description: "Set automated execution", action: "schedule" },
                { icon: Braces, label: "Validate Schema", description: "Check data structures", action: "validate_schema" },
              ]}
              onAction={handleAIAction}
              defaultOpen={false}
            />

            <CollapsibleSection
              title="AI Transformation"
              icon={Zap}
              color="text-primary"
              items={[
                { icon: FileText, label: "→ Article", description: "Full article format", action: "transform_article" },
                { icon: Twitter, label: "→ Twitter Thread", description: "Thread of tweets", action: "transform_twitter" },
                { icon: Video, label: "→ Script", description: "Video/podcast script", action: "transform_script" },
                { icon: Presentation, label: "→ Course Slide", description: "Teaching material", action: "transform_slide" },
              ]}
              onAction={handleAIAction}
              defaultOpen={false}
            />

            <CollapsibleSection
              title="Graph Analysis"
              icon={Network}
              color="text-graph-highlight"
              items={[
                { icon: Network, label: "Related Neurons", description: "Similar content", action: "find_related" },
                { icon: Radar, label: "Idea Clusters", description: "Thematic groupings", action: "idea_clusters" },
                { icon: TrendingUp, label: "Influence Score", description: "Impact measurement", action: "influence_score" },
              ]}
              onAction={handleAIAction}
              defaultOpen={false}
            />
          </div>

          {/* Metadata footer */}
          <div className="px-3 py-2 border-t border-border bg-panel-header shrink-0">
            <div className="grid grid-cols-2 gap-y-1 text-[10px]">
              <span className="text-muted-foreground">Total Blocks</span>
              <span className="text-right font-medium">{blocks.length}</span>
              <span className="text-muted-foreground">Executable</span>
              <span className="text-right font-medium text-primary">{executableCount}</span>
              <span className="text-muted-foreground">Format Types</span>
              <span className="text-right font-medium">{new Set(blocks.map(b => b.type)).size}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
