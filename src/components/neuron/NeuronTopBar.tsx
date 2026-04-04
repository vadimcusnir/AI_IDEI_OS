import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Share2, Copy, Download, ArrowRightLeft,
  Eye, EyeOff, Users, Globe,
  ChevronDown, Zap, Hash, Play, Shield,
  Fingerprint, MapPin, GitFork, Loader2, BookmarkPlus,
  Check, ExternalLink
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
import { toast } from "sonner";
import { Block, BLOCK_TYPE_CONFIG } from "./types";

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
  onSaveAsTemplate?: () => void;
  onConvert?: (format: string) => void;
  blocks?: { type: string; content: string }[];
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
  onClone, onFork, onSaveAsTemplate, onConvert, blocks,
}: NeuronTopBarProps) {
  const { t } = useTranslation("common");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [cloning, setCloning] = useState(false);
  const [validating, setValidating] = useState(false);
  const navigate = useNavigate();

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

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/n/${neuronNumber}`;
    navigator.clipboard.writeText(url);
    toast.success(t("copied"));
  }, [neuronNumber]);

  const handleDownload = useCallback(() => {
    if (!blocks) return;
    const content = blocks
      .filter(b => b.content?.trim())
      .map(b => {
        if (b.type === "heading") return `# ${b.content}`;
        if (b.type === "subheading") return `## ${b.content}`;
        if (b.type === "quote") return `> ${b.content}`;
        if (b.type === "todo") return `- [ ] ${b.content}`;
        if (b.type === "code") return `\`\`\`\n${b.content}\n\`\`\``;
        return b.content;
      })
      .join("\n\n");

    const blob = new Blob([`# ${title}\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neuron-${neuronNumber}-${title.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("downloaded_markdown"));
  }, [blocks, title, neuronNumber]);

  const handleValidate = useCallback(async () => {
    setValidating(true);
    // Check basic quality criteria
    const errors: string[] = [];
    const warnings: string[] = [];
    const totalContent = blocks?.reduce((sum, b) => sum + (b.content?.length || 0), 0) || 0;

    if (totalContent < 50) errors.push("Content too short (minimum 50 chars)");
    if (!title || title === "Untitled Neuron") errors.push("Title not set");
    if (tags.length === 0) warnings.push("No tags added (recommended)");

    await new Promise(r => setTimeout(r, 500)); // simulate validation delay

    if (errors.length === 0) {
      onStatusChange("validated");
      if (warnings.length > 0) {
        toast.success(t("neuron_validated") + " ⚠️ " + warnings.join(", "));
      } else {
        toast.success(t("neuron_validated"));
      }
    } else {
      toast.warning(t("validation_issues", { issues: errors.join(", ") }));
    }
    setValidating(false);
  }, [blocks, title, tags, onStatusChange]);

  const handleConvert = useCallback((format: string) => {
    if (onConvert) {
      onConvert(format);
    } else {
      // Default: navigate to run service with neuron context
      navigate(`/services`);
      toast.info(t("convert_hint", { format }));
    }
  }, [onConvert, navigate]);

  return (
    <div className="h-12 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 border-b border-border bg-card shrink-0 overflow-x-auto">
      {/* Neuron Number */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 sm:gap-1.5 mr-1 cursor-default shrink-0">
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
              <span className="font-mono text-micro">{neuronUuid}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="font-mono text-micro">{nasPath}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* NAS Path - desktop only */}
      <span className="text-micro font-mono text-muted-foreground/60 hidden xl:inline truncate max-w-[200px]">
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
          className="text-sm font-semibold bg-transparent border-none outline-none flex-shrink-0 max-w-[200px] sm:max-w-[300px]"
        />
      ) : (
        <button
          onClick={() => setIsEditingTitle(true)}
          className="text-sm font-semibold truncate max-w-[150px] sm:max-w-[300px] hover:text-primary transition-colors"
        >
          {title}
        </button>
      )}

      <div className="w-px h-5 bg-border mx-0.5 sm:mx-1 hidden sm:block" />

      {/* Tags - hidden on small screens */}
      <div className="hidden md:flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
        {tags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-micro font-normal px-1.5 py-0 h-5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
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
          className="text-micro bg-transparent border-none outline-none w-12 text-muted-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      <div className="flex-1 md:hidden" />

      {/* Status */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-1.5 sm:px-2 shrink-0">
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-micro font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            <ChevronDown className="h-3 w-3 hidden sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => onStatusChange("draft")}>{t("neuron_editor.status_draft")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("validated")}>{t("neuron_editor.status_validated")}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange("published")}>{t("neuron_editor.status_published")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
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

      <div className="w-px h-5 bg-border hidden sm:block" />

      {/* Run All — only enabled when executable blocks exist */}
      {(() => {
        const hasExecutable = blocks?.some(b => {
          const cfg = BLOCK_TYPE_CONFIG[b.type];
          return cfg?.executable;
        });
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 gap-1.5 text-xs px-2 sm:px-3 shrink-0"
                  onClick={onRunAll}
                  disabled={!hasExecutable}
                >
                  <Play className="h-3 w-3" />
                  <span className="hidden sm:inline">Run</span>
                </Button>
              </span>
            </TooltipTrigger>
            {!hasExecutable && (
              <TooltipContent side="bottom" className="text-micro">
                Adaugă un bloc executabil (code, prompt, ai-action) pentru a rula
              </TooltipContent>
            )}
          </Tooltip>
        );
      })()}

      {/* Validate */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs px-1.5 sm:px-2 shrink-0"
        onClick={handleValidate}
        disabled={validating}
      >
        {validating ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : status === "validated" ? (
          <Check className="h-3 w-3 text-status-validated" />
        ) : (
          <Shield className="h-3 w-3" />
        )}
        <span className="hidden sm:inline">Validate</span>
      </Button>

      <div className="w-px h-5 bg-border hidden sm:block" />

      {/* Share */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleShare}>
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-micro">Copy link</TooltipContent>
      </Tooltip>

      {/* Clone / Fork */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-1.5 sm:px-2 shrink-0" disabled={cloning}>
            {cloning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Clone</span>
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

      {/* Convert */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-1.5 sm:px-2 shrink-0">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Convert</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleConvert("article")}>
            → Article
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("knowledge-card")}>
            → Knowledge Card
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("framework")}>
            → Framework Element
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleConvert("twitter-thread")}>
            → Twitter Thread
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleConvert("course-slide")}>
            → Course Slide
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/services")} className="text-primary">
            <ExternalLink className="h-3.5 w-3.5 mr-2" />
            All Services →
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {onSaveAsTemplate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onSaveAsTemplate}>
              <BookmarkPlus className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-micro">Save as template</TooltipContent>
        </Tooltip>
      )}

      {/* Download */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-micro">Download as Markdown</TooltipContent>
      </Tooltip>
    </div>
  );
}
