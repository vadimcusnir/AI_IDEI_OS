import {
  FileText, Video, Presentation, BarChart3, Table2, Map, Mic, TestTube2, Wand2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotebookArtifact } from "@/hooks/useNotebook";
import { toast } from "sonner";

interface Props {
  artifacts: NotebookArtifact[];
}

const STUDIO_ACTIONS = [
  { key: "summary", icon: FileText, label: "Summary", desc: "Generate a full summary" },
  { key: "audio", icon: Mic, label: "Audio Overview", desc: "Audio digest of sources" },
  { key: "video", icon: Video, label: "Video Script", desc: "Script from key insights" },
  { key: "mindmap", icon: Map, label: "Mind Map", desc: "Visual concept map" },
  { key: "report", icon: BarChart3, label: "Report", desc: "Structured analysis report" },
  { key: "quiz", icon: TestTube2, label: "Quiz", desc: "Test comprehension" },
  { key: "presentation", icon: Presentation, label: "Presentation", desc: "Slide deck outline" },
  { key: "table", icon: Table2, label: "Data Table", desc: "Extract structured data" },
];

export function NotebookStudioPanel({ artifacts }: Props) {
  const handleAction = (key: string) => {
    toast.info(`Studio action "${key}" will be connected to AI pipeline`);
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Studio</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Generate outputs from your sources</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 py-3 space-y-1.5">
          {/* Action cards */}
          {STUDIO_ACTIONS.map(({ key, icon: Icon, label, desc }) => (
            <button
              key={key}
              onClick={() => handleAction(key)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-border bg-background hover:bg-accent/5 hover:border-primary/20 transition-colors text-left group"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Generated artifacts */}
        {artifacts.length > 0 && (
          <div className="px-3 pb-3">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Generated ({artifacts.length})
            </div>
            <div className="space-y-1">
              {artifacts.map((art) => (
                <div
                  key={art.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/5 cursor-pointer transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground truncate flex-1">{art.title}</span>
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{art.artifact_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
