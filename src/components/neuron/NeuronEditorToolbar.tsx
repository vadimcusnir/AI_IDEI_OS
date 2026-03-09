import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, CheckSquare,
  AlignLeft, AlignCenter, AlignRight,
  Link, Image, Code, Quote,
  Heading1, Heading2,
  Undo2, Redo2, Lightbulb, BookOpen, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NeuronEditorToolbarProps {
  activeFormats: string[];
  onFormatToggle: (format: string) => void;
}

function ToolBtn({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "toolbar-active" : "toolbar"}
          size="icon"
          className="h-7 w-7"
          onClick={onClick}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px]">{label}</TooltipContent>
    </Tooltip>
  );
}

export function NeuronEditorToolbar({ activeFormats, onFormatToggle }: NeuronEditorToolbarProps) {
  const is = (f: string) => activeFormats.includes(f);

  return (
    <div className="h-9 flex items-center gap-0.5 px-3 bg-toolbar border-b border-toolbar-border shrink-0 overflow-x-auto">
      <ToolBtn icon={Undo2} label="Undo" onClick={() => onFormatToggle("undo")} />
      <ToolBtn icon={Redo2} label="Redo" onClick={() => onFormatToggle("redo")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={Heading1} label="Heading" active={is("h1")} onClick={() => onFormatToggle("h1")} />
      <ToolBtn icon={Heading2} label="Subheading" active={is("h2")} onClick={() => onFormatToggle("h2")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={Bold} label="Bold" active={is("bold")} onClick={() => onFormatToggle("bold")} />
      <ToolBtn icon={Italic} label="Italic" active={is("italic")} onClick={() => onFormatToggle("italic")} />
      <ToolBtn icon={Underline} label="Underline" active={is("underline")} onClick={() => onFormatToggle("underline")} />
      <ToolBtn icon={Strikethrough} label="Strikethrough" active={is("strike")} onClick={() => onFormatToggle("strike")} />
      <ToolBtn icon={Code} label="Code" active={is("code")} onClick={() => onFormatToggle("code")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={List} label="Bullet list" active={is("ul")} onClick={() => onFormatToggle("ul")} />
      <ToolBtn icon={ListOrdered} label="Numbered list" active={is("ol")} onClick={() => onFormatToggle("ol")} />
      <ToolBtn icon={CheckSquare} label="Checklist" active={is("checklist")} onClick={() => onFormatToggle("checklist")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={AlignLeft} label="Align left" active={is("left")} onClick={() => onFormatToggle("left")} />
      <ToolBtn icon={AlignCenter} label="Center" active={is("center")} onClick={() => onFormatToggle("center")} />
      <ToolBtn icon={AlignRight} label="Align right" active={is("right")} onClick={() => onFormatToggle("right")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={Link} label="Link" onClick={() => onFormatToggle("link")} />
      <ToolBtn icon={Image} label="Image" onClick={() => onFormatToggle("image")} />
      <ToolBtn icon={Quote} label="Quote" onClick={() => onFormatToggle("quote")} />
      <ToolBtn icon={Lightbulb} label="Idea block" onClick={() => onFormatToggle("idea")} />
      <ToolBtn icon={BookOpen} label="Reference" onClick={() => onFormatToggle("reference")} />
      <ToolBtn icon={Minus} label="Divider" onClick={() => onFormatToggle("divider")} />
    </div>
  );
}
