import { useState } from "react";
import { Plus, GripVertical, Trash2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Block {
  id: string;
  type: "text" | "heading" | "subheading" | "todo" | "quote" | "code" | "divider" | "idea" | "reference" | "image";
  content: string;
  checked?: boolean;
  metadata?: string;
}

interface NeuronMainEditorProps {
  title: string;
  blocks: Block[];
  onTitleChange: (title: string) => void;
  onBlockChange: (id: string, content: string) => void;
  onBlockToggle: (id: string) => void;
  onAddBlock: (afterId: string, type?: Block["type"]) => void;
  onDeleteBlock: (id: string) => void;
}

const blockTypeLabels: Record<Block["type"], string> = {
  text: "Text",
  heading: "H1",
  subheading: "H2",
  todo: "Todo",
  quote: "Quote",
  code: "Code",
  divider: "—",
  idea: "💡",
  reference: "Ref",
  image: "Img",
};

const blockStyles: Record<string, string> = {
  text: "text-[15px] leading-relaxed",
  heading: "text-xl font-semibold font-serif",
  subheading: "text-base font-semibold",
  todo: "text-[15px] leading-relaxed",
  quote: "text-[15px] italic border-l-2 border-primary/30 pl-4 text-muted-foreground",
  code: "font-mono text-sm bg-muted/40 rounded-md px-3 py-2",
  idea: "text-[15px] bg-note-yellow/40 rounded-md px-3 py-2 border-l-2 border-primary/50",
  reference: "text-[13px] bg-muted/30 rounded-md px-3 py-2 border-l-2 border-graph-highlight/50",
  image: "",
  divider: "",
};

const blockTypeOptions: Block["type"][] = [
  "text", "heading", "subheading", "todo", "quote", "code", "idea", "reference", "divider"
];

function BlockTypeMenu({ onSelect, onClose }: { onSelect: (type: Block["type"]) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute left-0 top-7 z-20 bg-popover border border-border rounded-lg shadow-lg py-1 min-w-[120px]"
    >
      {blockTypeOptions.map(type => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose(); }}
          className="w-full text-left px-3 py-1 text-xs hover:bg-muted transition-colors flex items-center gap-2"
        >
          <span className="w-6 text-[10px] font-mono text-muted-foreground">{blockTypeLabels[type]}</span>
          <span className="capitalize">{type}</span>
        </button>
      ))}
    </motion.div>
  );
}

export function NeuronMainEditor({
  title, blocks, onTitleChange, onBlockChange, onBlockToggle, onAddBlock, onDeleteBlock
}: NeuronMainEditorProps) {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-card">
      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Title */}
        <div className="mb-1">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled Neuron"
            className="w-full text-3xl font-serif font-normal bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30"
          />
        </div>

        {/* Subtitle hint */}
        <div className="mb-8 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary/40" />
          <span className="text-xs text-muted-foreground/40">The smallest executable knowledge object</span>
        </div>

        {/* Blocks */}
        <div className="space-y-0.5">
          <AnimatePresence initial={false}>
            {blocks.map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="group relative flex items-start gap-0.5"
                onMouseEnter={() => setHoveredBlock(block.id)}
                onMouseLeave={() => { setHoveredBlock(null); setShowBlockMenu(null); }}
              >
                {/* Side controls */}
                <div className={cn(
                  "flex items-center gap-0 pt-0.5 transition-opacity w-12 shrink-0 justify-end",
                  hoveredBlock === block.id ? "opacity-100" : "opacity-0"
                )}>
                  <div className="relative">
                    <button
                      onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                      className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <AnimatePresence>
                      {showBlockMenu === block.id && (
                        <BlockTypeMenu
                          onSelect={(type) => onAddBlock(block.id, type)}
                          onClose={() => setShowBlockMenu(null)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <button className="h-6 w-6 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground cursor-grab">
                    <GripVertical className="h-3 w-3" />
                  </button>
                </div>

                {/* Block content */}
                <div className="flex-1 min-w-0">
                  {block.type === "divider" ? (
                    <div className="py-4">
                      <hr className="border-border" />
                    </div>
                  ) : block.type === "todo" ? (
                    <div className="flex items-start gap-2.5 py-0.5">
                      <input
                        type="checkbox"
                        checked={block.checked}
                        onChange={() => onBlockToggle(block.id)}
                        className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className={cn(
                          "flex-1 outline-none py-0.5 neuron-block-placeholder",
                          blockStyles.text,
                          block.checked && "line-through text-muted-foreground/50"
                        )}
                        onBlur={(e) => onBlockChange(block.id, e.currentTarget.textContent || "")}
                        data-placeholder="To do..."
                      >
                        {block.content}
                      </div>
                    </div>
                  ) : (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className={cn("outline-none py-0.5 neuron-block-placeholder", blockStyles[block.type])}
                      onBlur={(e) => onBlockChange(block.id, e.currentTarget.textContent || "")}
                      data-placeholder={
                        block.type === "heading" ? "Heading" :
                        block.type === "subheading" ? "Subheading" :
                        block.type === "idea" ? "Capture an idea..." :
                        block.type === "reference" ? "Add a reference..." :
                        block.type === "code" ? "Code..." :
                        block.type === "quote" ? "Quote..." :
                        "Type something..."
                      }
                    >
                      {block.content}
                    </div>
                  )}
                </div>

                {/* Block type label + Delete */}
                <div className={cn(
                  "flex items-center gap-1 pt-1 transition-opacity shrink-0",
                  hoveredBlock === block.id ? "opacity-100" : "opacity-0"
                )}>
                  <span className="text-[9px] font-mono text-muted-foreground/40 uppercase w-6 text-right">
                    {blockTypeLabels[block.type]}
                  </span>
                  {blocks.length > 1 && (
                    <button
                      onClick={() => onDeleteBlock(block.id)}
                      className="h-5 w-5 flex items-center justify-center text-muted-foreground/30 hover:text-destructive rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add block */}
        <button
          onClick={() => onAddBlock(blocks[blocks.length - 1]?.id || "")}
          className="mt-6 w-full py-2 text-xs text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/20 rounded-lg transition-colors text-left px-14"
        >
          + Add a block
        </button>
      </div>
    </div>
  );
}
