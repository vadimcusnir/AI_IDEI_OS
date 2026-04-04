/**
 * BulkAIActions — Dropdown with AI-powered bulk operations for selected neurons.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain, Sparkles, Tag, Link2, Wand2,
  FileText, Loader2, Layers,
} from "lucide-react";

interface BulkAIActionsProps {
  selectedCount: number;
  selectedIds: Set<number>;
  disabled?: boolean;
}

export function BulkAIActions({ selectedCount, selectedIds, disabled }: BulkAIActionsProps) {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);

  if (selectedCount === 0) return null;

  const idsParam = Array.from(selectedIds).join(",");

  const actions = [
    {
      icon: Tag,
      label: "Auto-categorize",
      description: "AI assigns categories based on content",
      prompt: `/extract categorize neurons ${idsParam}`,
    },
    {
      icon: Sparkles,
      label: "Enrich with context",
      description: "Add metadata, tags, and quality scores",
      prompt: `/analyze enrich neurons ${idsParam}`,
    },
    {
      icon: Link2,
      label: "Find connections",
      description: "Discover links between selected neurons",
      prompt: `/search find connections between neurons ${idsParam}`,
    },
    {
      icon: FileText,
      label: "Generate content pack",
      description: "Create articles & posts from selection",
      prompt: `/generate content pack from neurons ${idsParam}`,
    },
    {
      icon: Layers,
      label: "Merge duplicates",
      description: "Detect and merge similar neurons",
      prompt: `/compare find duplicates in neurons ${idsParam}`,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          disabled={disabled || running}
        >
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
          AI Actions ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-micro font-semibold text-muted-foreground">AI BULK OPERATIONS</p>
        </div>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => {
              navigate(`/home?q=${encodeURIComponent(action.prompt)}`);
            }}
            className="flex items-start gap-2 py-2"
          >
            <action.icon className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
            <div>
              <p className="text-xs font-medium">{action.label}</p>
              <p className="text-nano text-muted-foreground">{action.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
