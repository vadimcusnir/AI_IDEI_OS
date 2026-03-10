import { useState } from "react";
import {
  Share2, Copy, Download, ArrowRightLeft,
  Eye, EyeOff, Users, Globe,
  ChevronDown, Zap, Hash, Play, Shield,
  Fingerprint, MapPin, GitFork, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NeuronStatus = "draft" | "validated" | "published";
type NeuronVisibility = "private" | "team" | "public";

interface NeuronTopBarProps {
  title: string;
  neuronNumber: number;
  neuronUuid: string;
  nasPath: string;
  tags: string[];
  status: NeuronStatus;
  visibility: NeuronVisibility;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: NeuronStatus) => void;
  onVisibilityChange: (visibility: NeuronVisibility) => void;
  onTagsChange: (tags: string[]) => void;
  onRunAll: () => void;
  onClone?: () => Promise<any>;
  onFork?: () => Promise<any>;
}

const statusConfig: Record<NeuronStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  validated: { label: "Validated", className: "bg-status-validated/15 text-status-validated" },
  published: { label: "Published", className: "bg-status-published/15 text-status-published" },
};

const visibilityIcons: Record<NeuronVisibility, React.ElementType> = {
  private: EyeOff,
  team: Users,
  public: Globe,
};

export function NeuronTopBar({
  title, neuronNumber, neuronUuid, nasPath, tags, status, visibility,
  onTitleChange, onStatusChange, onVisibilityChange, onTagsChange, onRunAll,
  onClone, onFork,
}: NeuronTopBarProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [cloning, setCloning] = useState(false);

  const VisIcon = visibilityIcons[visibility];
  const statusCfg = statusConfig[status];

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="h-12 flex items-center gap-2 px-4 border-b border-border bg-card shrink-0">
      {/* Neuron Number — primary identity */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 mr-1 cursor-default">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary font-mono">#{neuronNumber}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs max-w-[300px]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="font-semibold">Neuron #{neuronNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Fingerprint className="h-3 w-3" />
              <span className="font-mono text-[10px]">{neuronUuid}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="font-mono text-[10px]">{nasPath}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* NAS Path */}
      <span className="text-[10px] font-mono text-muted-foreground/60 hidden lg:inline truncate max-w-[200px]">
        {nasPath}
      </span>

      {/* Title */}
      {isEditingTitle ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => setIsEditingTitle(false)}
          onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
          className="text-sm font-semibold bg-transparent border-none outline-none flex-shrink-0 max-w-[300px]"
        />
      ) : (
        <button
          onClick={() => setIsEditingTitle(true)}
          className="text-sm font-semibold truncate max-w-[300px] hover:text-primary transition-colors"
        >
          {title}
        </button>
      )}

      <div className="w-px h-5 bg-border mx-1" />

      {/* Tags */}
      <div className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-[10px] font-normal px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
            onClick={() => handleRemoveTag(tag)}
          >
            <Hash className="h-2.5 w-2.5 mr-0.5" />
            {tag}
          </Badge>
        ))}
        <input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="+ tag"
          className="text-[10px] bg-transparent border-none outline-none w-12 text-muted-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onStatusChange("draft")}>Draft</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("validated")}>Validated</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("published")}>Published</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <VisIcon className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onVisibilityChange("private")}>
            <EyeOff className="h-3.5 w-3.5 mr-2" /> Private
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onVisibilityChange("team")}>
            <Users className="h-3.5 w-3.5 mr-2" /> Team
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onVisibilityChange("public")}>
            <Globe className="h-3.5 w-3.5 mr-2" /> Public
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-5 bg-border" />

      {/* Execution controls */}
      <Button
        variant="default"
        size="sm"
        className="h-7 gap-1.5 text-xs px-3"
        onClick={onRunAll}
      >
        <Play className="h-3 w-3" />
        Run
      </Button>

      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
        <Shield className="h-3 w-3" />
        Validate
      </Button>

      <div className="w-px h-5 bg-border" />

      {/* Actions */}
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Share2 className="h-3.5 w-3.5" />
      </Button>

      {/* Clone / Fork */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2" disabled={cloning}>
            {cloning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            Clone
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={async () => {
            if (!onClone) return;
            setCloning(true);
            await onClone();
            setCloning(false);
          }}>
            <Copy className="h-3.5 w-3.5 mr-2" />
            Clone (full copy)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={async () => {
            if (!onFork) return;
            setCloning(true);
            await onFork();
            setCloning(false);
          }}>
            <GitFork className="h-3.5 w-3.5 mr-2" />
            Fork (copy + link)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Convert
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>→ Article</DropdownMenuItem>
          <DropdownMenuItem>→ Knowledge Card</DropdownMenuItem>
          <DropdownMenuItem>→ Tool Input</DropdownMenuItem>
          <DropdownMenuItem>→ Framework Element</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>→ Twitter Thread</DropdownMenuItem>
          <DropdownMenuItem>→ Course Slide</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
