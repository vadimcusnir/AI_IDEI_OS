import { useState, useRef, KeyboardEvent } from "react";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Block {
  id: string;
  type: "text" | "heading" | "todo" | "quote" | "code" | "divider";
  content: string;
  checked?: boolean;
}

interface NeuronEditorProps {
  title: string;
  blocks: Block[];
  onTitleChange: (title: string) => void;
  onBlockChange: (id: string, content: string) => void;
  onBlockToggle: (id: string) => void;
  onAddBlock: (afterId: string) => void;
  onDeleteBlock: (id: string) => void;
}

const blockStyles: Record<string, string> = {
  text: "text-base leading-relaxed",
  heading: "text-xl font-semibold font-serif",
  todo: "text-base leading-relaxed",
  quote: "text-base italic border-l-2 border-primary/40 pl-4 text-muted-foreground",
  code: "font-mono text-sm bg-muted/60 rounded-md px-3 py-2",
  divider: "",
};

export function NeuronEditor({
  title, blocks, onTitleChange, onBlockChange, onBlockToggle, onAddBlock, onDeleteBlock
}: NeuronEditorProps) {
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Title */}
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full text-4xl font-serif font-normal bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/40 mb-6"
        />

        {/* Blocks */}
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {blocks.map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="group relative flex items-start gap-1"
                onMouseEnter={() => setHoveredBlock(block.id)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                {/* Side controls */}
                <div className={cn(
                  "flex items-center gap-0.5 pt-1 transition-opacity",
                  hoveredBlock === block.id ? "opacity-100" : "opacity-0"
                )}>
                  <button
                    onClick={() => onAddBlock(block.id)}
                    className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-grab">
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Block content */}
                <div className="flex-1 min-w-0">
                  {block.type === "divider" ? (
                    <div className="py-3">
                      <hr className="border-border" />
                    </div>
                  ) : block.type === "todo" ? (
                    <div className="flex items-start gap-2 py-0.5">
                      <input
                        type="checkbox"
                        checked={block.checked}
                        onChange={() => onBlockToggle(block.id)}
                        className="mt-1.5 h-4 w-4 rounded border-border accent-primary"
                      />
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className={cn(
                          "flex-1 outline-none py-0.5",
                          blockStyles.text,
                          block.checked && "line-through text-muted-foreground"
                        )}
                        onBlur={(e) => onBlockChange(block.id, e.currentTarget.textContent || "")}
                        dangerouslySetInnerHTML={{ __html: block.content }}
                      />
                    </div>
                  ) : (
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className={cn("outline-none py-0.5", blockStyles[block.type])}
                      onBlur={(e) => onBlockChange(block.id, e.currentTarget.textContent || "")}
                      dangerouslySetInnerHTML={{ __html: block.content }}
                      data-placeholder="Type something..."
                    />
                  )}
                </div>

                {/* Delete */}
                {hoveredBlock === block.id && blocks.length > 1 && (
                  <button
                    onClick={() => onDeleteBlock(block.id)}
                    className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive rounded transition-colors mt-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add block at end */}
        <button
          onClick={() => onAddBlock(blocks[blocks.length - 1]?.id || "")}
          className="mt-4 w-full py-3 text-sm text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 rounded-lg transition-colors text-left px-2"
        >
          + Add a block
        </button>
      </div>
    </div>
  );
}
