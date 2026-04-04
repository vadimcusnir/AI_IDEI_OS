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
  onInsertBlock?: (type: string) => void;
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
      <TooltipContent side="bottom" className="text-micro">{label}</TooltipContent>
    </Tooltip>
  );
}

export function NeuronEditorToolbar({ activeFormats, onFormatToggle, onInsertBlock }: NeuronEditorToolbarProps) {
  const is = (f: string) => activeFormats.includes(f);

  const insert = (type: string) => {
    if (onInsertBlock) onInsertBlock(type);
    else onFormatToggle(type);
  };

  return (
    <div className="h-9 flex items-center gap-0.5 px-3 bg-toolbar border-b border-toolbar-border shrink-0 overflow-x-auto">
      <ToolBtn icon={Undo2} label="Undo (Ctrl+Z)" onClick={() => document.execCommand("undo")} />
      <ToolBtn icon={Redo2} label="Redo (Ctrl+Y)" onClick={() => document.execCommand("redo")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={Heading1} label="Insert heading block" onClick={() => insert("heading")} />
      <ToolBtn icon={Heading2} label="Insert subheading block" onClick={() => insert("subheading")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={Bold} label="Bold (Ctrl+B)" active={is("bold")} onClick={() => document.execCommand("bold")} />
      <ToolBtn icon={Italic} label="Italic (Ctrl+I)" active={is("italic")} onClick={() => document.execCommand("italic")} />
      <ToolBtn icon={Underline} label="Underline (Ctrl+U)" active={is("underline")} onClick={() => document.execCommand("underline")} />
      <ToolBtn icon={Strikethrough} label="Strikethrough" active={is("strike")} onClick={() => document.execCommand("strikeThrough")} />
      <ToolBtn icon={Code} label="Insert code block" onClick={() => insert("code")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={List} label="Insert bullet list" onClick={() => insert("list")} />
      <ToolBtn icon={ListOrdered} label="Insert numbered list" onClick={() => insert("list")} />
      <ToolBtn icon={CheckSquare} label="Insert to-do checklist" onClick={() => insert("todo")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={AlignLeft} label="Align left" active={is("left")} onClick={() => onFormatToggle("left")} />
      <ToolBtn icon={AlignCenter} label="Center" active={is("center")} onClick={() => onFormatToggle("center")} />
      <ToolBtn icon={AlignRight} label="Align right" active={is("right")} onClick={() => onFormatToggle("right")} />

      <Separator orientation="vertical" className="mx-1 h-4 bg-toolbar-border" />

      <ToolBtn icon={Link} label="Insert link" onClick={() => onFormatToggle("link")} />
      <ToolBtn icon={Image} label="Insert image" onClick={() => onFormatToggle("image")} />
      <ToolBtn icon={Quote} label="Insert quote block" onClick={() => insert("quote")} />
      <ToolBtn icon={Lightbulb} label="Insert idea block — capture a spark" onClick={() => insert("idea")} />
      <ToolBtn icon={BookOpen} label="Insert reference block" onClick={() => insert("reference")} />
      <ToolBtn icon={Minus} label="Insert divider" onClick={() => insert("divider")} />
    </div>
  );
}
