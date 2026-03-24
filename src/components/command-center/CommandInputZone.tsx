/**
 * CommandInputZone — World-class chat input.
 * Best practices: centered max-width, drag & drop, auto-grow, prominent stop, keyboard hints.
 */

import { useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Send, Square, ArrowUp } from "lucide-react";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface CommandInputZoneRef {
  focus: () => void;
}

interface CommandInputZoneProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  loading: boolean;
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (idx: number) => void;
  showSlashMenu: boolean;
  onShowSlashMenuChange: (show: boolean) => void;
  onSlashSelect: (cmd: string) => void;
}

export const CommandInputZone = forwardRef<CommandInputZoneRef, CommandInputZoneProps>(
  function CommandInputZone(
    { input, onInputChange, onSubmit, onStop, loading, files, onFileSelect, onRemoveFile,
      showSlashMenu, onShowSlashMenuChange, onSlashSelect },
    ref,
  ) {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    // Drag & drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        const syntheticEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
        onFileSelect(syntheticEvent);
      }
    }, [onFileSelect]);

    return (
      <div
        className="border-t border-border/30 bg-gradient-to-t from-background via-background to-background/80"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-primary/[0.04] border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <p className="text-sm font-medium text-primary">Drop files here</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-4 pt-2">
          {/* Attached files */}
          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex gap-2 flex-wrap pb-2 overflow-hidden"
              >
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-card border border-border/40 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
                    <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                    <span className="truncate max-w-[140px] text-foreground">{f.name}</span>
                    <button onClick={() => onRemoveFile(i)} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main input container */}
          <div className={cn(
            "relative flex items-end gap-2 rounded-2xl border bg-card transition-all duration-300",
            "shadow-sm",
            "border-border/50 focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/[0.04] focus-within:ring-1 focus-within:ring-primary/10"
          )}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.pdf,.docx,.mp3,.mp4,.wav,.m4a,.webm,.ogg,.srt,text/*,audio/*,video/*,application/pdf"
              className="hidden"
              onChange={onFileSelect}
            />

            {/* Attach button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 shrink-0 rounded-xl ml-1 mb-1 text-muted-foreground/40 hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file (or drag & drop)"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Textarea */}
            <div className="flex-1 relative py-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  onInputChange(e.target.value);
                  onShowSlashMenuChange(e.target.value.startsWith("/") && !e.target.value.includes(" "));
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message AI-IDEI..."
                className="w-full resize-none bg-transparent px-1 py-2 text-[15px] leading-relaxed focus:outline-none placeholder:text-muted-foreground/35 min-h-[40px] max-h-[200px]"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 200) + "px";
                }}
              />
              {showSlashMenu && (
                <AgentSlashMenu
                  input={input}
                  visible={showSlashMenu}
                  onSelect={(cmd) => {
                    onSlashSelect(cmd + " ");
                    onShowSlashMenuChange(false);
                  }}
                  onClose={() => onShowSlashMenuChange(false)}
                />
              )}
            </div>

            {/* Send / Stop button */}
            {loading ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 shrink-0 rounded-xl mr-1 mb-1 bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                onClick={onStop}
                title="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "h-9 w-9 p-0 shrink-0 rounded-xl mr-1 mb-1 transition-all duration-200",
                  (input.trim() || files.length > 0)
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:shadow-md"
                    : "bg-muted text-muted-foreground/30"
                )}
                onClick={onSubmit}
                disabled={!input.trim() && files.length === 0}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Keyboard hint */}
          <p className="text-[10px] text-muted-foreground/30 text-center mt-1.5 select-none">
            <kbd className="font-mono">Enter</kbd> to send · <kbd className="font-mono">Shift+Enter</kbd> new line · <kbd className="font-mono">/</kbd> commands
          </p>
        </div>
      </div>
    );
  },
);
