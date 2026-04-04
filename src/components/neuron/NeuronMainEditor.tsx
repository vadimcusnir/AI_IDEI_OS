import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, GripVertical, Trash2, Zap, Settings2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Block, BlockType, BLOCK_TYPE_CONFIG, CodeLanguage } from "./types";
import { SlashCommandMenu } from "./SlashCommandMenu";
import {
  CodeBlock, YamlBlock, JsonBlock, PromptBlock,
  DatasetBlock, DiagramBlock, AIActionBlock
} from "./FormatBlocks";

interface NeuronMainEditorProps {
  title: string;
  blocks: Block[];
  onTitleChange: (title: string) => void;
  onBlockChange: (id: string, content: string) => void;
  onBlockToggle: (id: string) => void;
  onAddBlock: (afterId: string, type?: BlockType) => void;
  onDeleteBlock: (id: string) => void;
  onBlockExecute: (id: string) => void;
  onBlockLanguageChange: (id: string, lang: CodeLanguage) => void;
  onReorderBlock?: (fromIndex: number, toIndex: number) => void;
}

const contentBlockStyles: Record<string, string> = {
  text: "text-[15px] leading-relaxed",
  heading: "text-xl font-semibold",
  subheading: "text-base font-semibold",
  markdown: "text-[15px] leading-relaxed font-mono",
  todo: "text-[15px] leading-relaxed",
  quote: "text-[15px] italic border-l-2 border-primary/30 pl-4 text-muted-foreground",
  list: "text-[15px] leading-relaxed",
  idea: "text-[15px] bg-note-yellow/30 rounded-md px-3 py-2 border-l-2 border-primary/40",
  reference: "text-compact bg-muted/20 rounded-md px-3 py-2 border-l-2 border-graph-highlight/40",
};

const FORMAT_BLOCK_TYPES: BlockType[] = ["code", "yaml", "json", "prompt", "dataset", "diagram", "ai-action"];

export function NeuronMainEditor({
  title, blocks, onTitleChange, onBlockChange, onBlockToggle,
  onAddBlock, onDeleteBlock, onBlockExecute, onBlockLanguageChange, onReorderBlock,
}: NeuronMainEditorProps) {
  const { t } = useTranslation("common");
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [slashMenu, setSlashMenu] = useState<{ afterId: string; filter: string; position: { top: number; left: number } } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleSlashInput = useCallback((blockId: string, e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent || "";
    if (text.startsWith("/")) {
      const rect = e.currentTarget.getBoundingClientRect();
      setSlashMenu({
        afterId: blockId,
        filter: text.slice(1),
        position: { top: rect.bottom + 4, left: rect.left },
      });
    } else if (slashMenu) {
      setSlashMenu(null);
    }
  }, [slashMenu]);

  const handleSlashSelect = useCallback((type: BlockType) => {
    if (slashMenu) {
      // Clear the slash text from the current block
      const currentBlock = blocks.find(b => b.id === slashMenu.afterId);
      if (currentBlock && currentBlock.content.startsWith("/")) {
        onBlockChange(slashMenu.afterId, "");
      }
      onAddBlock(slashMenu.afterId, type);
      setSlashMenu(null);
    }
  }, [slashMenu, blocks, onAddBlock, onBlockChange]);

  const renderFormatBlock = (block: Block) => {
    const props = {
      block,
      onContentChange: (content: string) => onBlockChange(block.id, content),
      onExecute: onBlockExecute,
      onLanguageChange: (lang: CodeLanguage) => onBlockLanguageChange(block.id, lang),
    };

    switch (block.type) {
      case "code": return <CodeBlock {...props} />;
      case "yaml": return <YamlBlock {...props} />;
      case "json": return <JsonBlock {...props} />;
      case "prompt": return <PromptBlock {...props} />;
      case "dataset": return <DatasetBlock {...props} />;
      case "diagram": return <DiagramBlock {...props} />;
      case "ai-action": return <AIActionBlock {...props} />;
      default: return null;
    }
  };

  const renderContentBlock = (block: Block) => {
    if (block.type === "divider") {
      return <div className="py-4"><hr className="border-border" /></div>;
    }

    if (block.type === "todo") {
      return (
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
              contentBlockStyles.text,
              block.checked && "line-through text-muted-foreground/50"
            )}
            onBlur={(e) => onBlockChange(block.id, e.currentTarget.textContent || "")}
            onInput={(e) => handleSlashInput(block.id, e)}
            data-placeholder="To do..."
          >
            {block.content}
          </div>
        </div>
      );
    }

    const placeholders: Record<string, string> = {
      heading: "Heading",
      subheading: "Subheading",
      markdown: "Write markdown...",
      idea: "Capture an idea...",
      reference: "Add a reference...",
      quote: "Quote...",
      list: "- Item 1\n- Item 2",
      text: 'Type "/" for commands...',
    };

    return (
      <div
        contentEditable
        suppressContentEditableWarning
        className={cn("outline-none py-0.5 neuron-block-placeholder", contentBlockStyles[block.type] || contentBlockStyles.text)}
        onBlur={(e) => onBlockChange(block.id, e.currentTarget.textContent || "")}
        onInput={(e) => handleSlashInput(block.id, e)}
        data-placeholder={placeholders[block.type] || 'Type "/" for commands...'}
      >
        {block.content}
      </div>
    );
  };

  return (
    <div ref={editorRef} className="flex-1 overflow-y-auto bg-card">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Title */}
        <div className="mb-1">
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t("common:neuron_editor.untitled")}
            className="w-full text-3xl font-normal bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30"
          />
        </div>

        {/* Identity bar */}
        <div className="mb-8 flex items-center gap-3 text-xs text-muted-foreground/40">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary/40" />
            <span>{t("common:neuron_editor.programmable_object")}</span>
          </div>
          <span className="text-border">|</span>
          <span className="font-mono">Type / for commands</span>
        </div>

        {/* Blocks */}
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {blocks.map((block, blockIndex) => {
              const isFormatBlock = FORMAT_BLOCK_TYPES.includes(block.type);
              const cfg = BLOCK_TYPE_CONFIG[block.type];

              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "group relative flex items-start gap-0.5",
                    dragOverIdx === blockIndex && dragIdx !== blockIndex && "border-t-2 border-primary"
                  )}
                  onMouseEnter={() => setHoveredBlock(block.id)}
                  onMouseLeave={() => setHoveredBlock(null)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIdx(blockIndex); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIdx !== null && dragIdx !== blockIndex && onReorderBlock) {
                      onReorderBlock(dragIdx, blockIndex);
                    }
                    setDragIdx(null);
                    setDragOverIdx(null);
                  }}
                >
                  {/* Side controls */}
                  <div className={cn(
                    "flex items-center gap-0 pt-0.5 transition-opacity w-10 shrink-0 justify-end",
                    hoveredBlock === block.id ? "opacity-100" : "opacity-0"
                  )}>
                    <button
                      onClick={() => {
                        const el = document.querySelector(`[data-block-id="${block.id}"]`);
                        const rect = el?.getBoundingClientRect();
                        setSlashMenu({
                          afterId: block.id,
                          filter: "",
                          position: { top: (rect?.bottom || 200) + 4, left: rect?.left || 100 },
                        });
                      }}
                      className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      draggable
                      onDragStart={() => setDragIdx(blockIndex)}
                      onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                      className="h-6 w-6 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Block content */}
                  <div className="flex-1 min-w-0" data-block-id={block.id}>
                    {isFormatBlock ? renderFormatBlock(block) : renderContentBlock(block)}
                  </div>

                  {/* Right side: type label + delete */}
                  <div className={cn(
                    "flex items-center gap-1 pt-1 transition-opacity shrink-0",
                    hoveredBlock === block.id ? "opacity-100" : "opacity-0"
                  )}>
                    <span className={cn(
                      "text-nano font-mono uppercase px-1 py-0.5 rounded",
                      cfg.executable
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground/40"
                    )}>
                      {cfg.shortLabel}
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
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add block */}
        <button
          onClick={() => {
            const lastId = blocks[blocks.length - 1]?.id || "";
            const btnRect = document.querySelector("[data-add-block]")?.getBoundingClientRect();
            setSlashMenu({
              afterId: lastId,
              filter: "",
              position: { top: (btnRect?.top || 500) - 320, left: btnRect?.left || 100 },
            });
          }}
          data-add-block
          className="mt-6 w-full py-2.5 text-xs text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/20 rounded-lg transition-colors text-left px-12 border border-dashed border-transparent hover:border-border"
        >
          + Add a block &middot; Type / for commands
        </button>
      </div>

      {/* Slash command menu */}
      <SlashCommandMenu
        isOpen={!!slashMenu}
        filter={slashMenu?.filter || ""}
        position={slashMenu?.position || { top: 0, left: 0 }}
        onSelect={handleSlashSelect}
        onClose={() => setSlashMenu(null)}
      />
    </div>
  );
}
