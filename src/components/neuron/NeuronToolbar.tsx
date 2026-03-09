import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight,
  Link, Image, Code, Quote,
  Heading1, Heading2, Heading3,
  Undo2, Redo2, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  action: string;
  active?: boolean;
}

interface NeuronToolbarProps {
  activeFormats: string[];
  onFormatToggle: (format: string) => void;
}

function ToolbarButton({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "toolbar-active" : "toolbar"}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

export function NeuronToolbar({ activeFormats, onFormatToggle }: NeuronToolbarProps) {
  const isActive = (f: string) => activeFormats.includes(f);

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 bg-toolbar border-b border-toolbar-border overflow-x-auto">
      {/* Undo/Redo */}
      <ToolbarButton icon={Undo2} label="Undo" onClick={() => onFormatToggle("undo")} />
      <ToolbarButton icon={Redo2} label="Redo" onClick={() => onFormatToggle("redo")} />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-toolbar-border" />

      {/* Headings */}
      <ToolbarButton icon={Heading1} label="Heading 1" active={isActive("h1")} onClick={() => onFormatToggle("h1")} />
      <ToolbarButton icon={Heading2} label="Heading 2" active={isActive("h2")} onClick={() => onFormatToggle("h2")} />
      <ToolbarButton icon={Heading3} label="Heading 3" active={isActive("h3")} onClick={() => onFormatToggle("h3")} />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-toolbar-border" />

      {/* Inline formatting */}
      <ToolbarButton icon={Bold} label="Bold" active={isActive("bold")} onClick={() => onFormatToggle("bold")} />
      <ToolbarButton icon={Italic} label="Italic" active={isActive("italic")} onClick={() => onFormatToggle("italic")} />
      <ToolbarButton icon={Underline} label="Underline" active={isActive("underline")} onClick={() => onFormatToggle("underline")} />
      <ToolbarButton icon={Strikethrough} label="Strikethrough" active={isActive("strike")} onClick={() => onFormatToggle("strike")} />
      <ToolbarButton icon={Code} label="Code" active={isActive("code")} onClick={() => onFormatToggle("code")} />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-toolbar-border" />

      {/* Lists */}
      <ToolbarButton icon={List} label="Bullet list" active={isActive("ul")} onClick={() => onFormatToggle("ul")} />
      <ToolbarButton icon={ListOrdered} label="Numbered list" active={isActive("ol")} onClick={() => onFormatToggle("ol")} />
      <ToolbarButton icon={CheckSquare} label="Checklist" active={isActive("checklist")} onClick={() => onFormatToggle("checklist")} />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-toolbar-border" />

      {/* Alignment */}
      <ToolbarButton icon={AlignLeft} label="Align left" active={isActive("left")} onClick={() => onFormatToggle("left")} />
      <ToolbarButton icon={AlignCenter} label="Align center" active={isActive("center")} onClick={() => onFormatToggle("center")} />
      <ToolbarButton icon={AlignRight} label="Align right" active={isActive("right")} onClick={() => onFormatToggle("right")} />

      <Separator orientation="vertical" className="mx-1.5 h-5 bg-toolbar-border" />

      {/* Insert */}
      <ToolbarButton icon={Link} label="Insert link" onClick={() => onFormatToggle("link")} />
      <ToolbarButton icon={Image} label="Insert image" onClick={() => onFormatToggle("image")} />
      <ToolbarButton icon={Quote} label="Blockquote" active={isActive("quote")} onClick={() => onFormatToggle("quote")} />

      <div className="flex-1" />

      <ToolbarButton icon={MoreHorizontal} label="More options" onClick={() => onFormatToggle("more")} />
    </div>
  );
}
