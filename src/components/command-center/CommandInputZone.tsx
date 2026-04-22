/**
 * CommandInputZone — Premium chat input with centered alignment.
 */

import { useRef, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Square, ArrowUp, Terminal } from "lucide-react";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
import { InputAttachMenu } from "./InputAttachMenu";
import { CostPreviewBadge } from "./CostPreviewBadge";
import { useCostEstimate } from "@/hooks/command-center/useCostEstimate";
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
  isSubmitting?: boolean;
  files: File[];
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (idx: number) => void;
  /** Non-editable command tags (set via slash menu / chips) */
  commands?: string[];
  onRemoveCommand?: (idx: number) => void;
  showSlashMenu: boolean;
  onShowSlashMenuChange: (show: boolean) => void;
  onSlashSelect: (cmd: string) => void;
  onAttachAction?: (action: string) => void;
  inputHistory?: string[];
  /** Optional NEURONS balance — enables inline cost-vs-balance hint. */
  balance?: number;
}

export const CommandInputZone = forwardRef<CommandInputZoneRef, CommandInputZoneProps>(
  function CommandInputZone(
    { input, onInputChange, onSubmit, onStop, loading, isSubmitting, files, onFileSelect, onRemoveFile,
      commands = [], onRemoveCommand,
      showSlashMenu, onShowSlashMenuChange, onSlashSelect, onAttachAction, inputHistory = [],
      balance = 0 },
    ref,
  ) {
    const { t } = useTranslation(["pages", "common"]);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const cost = useCostEstimate({ commands, files, input });

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isSubmitting) onSubmit();
        setHistoryIdx(-1);
      }
      // ↑ / ↓ history navigation
      if (e.key === "ArrowUp" && !input.trim() && inputHistory.length > 0) {
        e.preventDefault();
        const nextIdx = Math.min(historyIdx + 1, inputHistory.length - 1);
        setHistoryIdx(nextIdx);
        onInputChange(inputHistory[nextIdx]);
      }
      if (e.key === "ArrowDown" && historyIdx >= 0) {
        e.preventDefault();
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        onInputChange(nextIdx >= 0 ? inputHistory[nextIdx] : "");
      }
    };

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

    const handleAttachAction = useCallback((action: string) => {
      if (onAttachAction) {
        onAttachAction(action);
      } else {
        const actionMap: Record<string, string> = {
          web_search: "/search ",
          deep_research: "/research ",
          generate_image: "/generate ",
          analyze_url: "/analyze ",
          voice_input: "/voice ",
        };
        if (actionMap[action]) {
          onInputChange(actionMap[action]);
          inputRef.current?.focus();
        }
      }
    }, [onAttachAction, onInputChange]);

    return (
      <div
        className="bg-background relative"
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
              <p className="text-sm font-medium text-primary">Trage fișierele aici</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-3xl mx-auto px-2 sm:px-4 pb-1 sm:pb-2 pt-1 sm:pt-2">
          {/* Attached commands (non-editable tags) + files + cost preview */}
          {(commands.length > 0 || files.length > 0) && (
            <div className="flex gap-1.5 flex-wrap items-center pb-2">
              {commands.map((cmd, i) => (
                <div
                  key={`cmd-${i}`}
                  className="flex items-center gap-1.5 bg-gold/[0.08] border border-gold/30 rounded-lg px-2.5 py-1.5 text-xs shadow-sm select-none"
                >
                  <Terminal className="h-3 w-3 text-gold" />
                  <span className="font-mono font-semibold text-gold-bright truncate max-w-[140px]">{cmd}</span>
                  {onRemoveCommand && (
                    <button
                      type="button"
                      onClick={() => onRemoveCommand(i)}
                      className="text-gold/60 hover:text-gold-bright transition-colors ml-0.5"
                      aria-label={`Remove ${cmd}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {files.map((f, i) => (
                <div key={`file-${i}`} className="flex items-center gap-1.5 bg-card border border-border/40 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
                  <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                  <span className="truncate max-w-[120px] text-foreground">{f.name}</span>
                  <button onClick={() => onRemoveFile(i)} className="text-muted-foreground hover:text-foreground transition-colors ml-0.5" aria-label={`Remove ${f.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {/* Inline cost estimate — appears when ≥1 command/file is staged */}
              <div className="ml-auto">
                <CostPreviewBadge
                  estimatedCredits={cost.estimatedCredits}
                  balance={balance}
                  visible={cost.visible}
                />
              </div>
            </div>
          )}

          {/* Main input container — items-center for vertical alignment */}
          <div className={cn(
            "relative flex items-center gap-2 rounded-2xl border bg-card/90 backdrop-blur-sm transition-all duration-200",
            "px-2 py-1.5",
            "shadow-sm",
            "border-border/50 focus-within:border-gold/40 focus-within:shadow-md focus-within:shadow-gold/[0.04] focus-within:ring-1 focus-within:ring-gold/15"
          )}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.pdf,.docx,.mp3,.mp4,.wav,.m4a,.webm,.ogg,.srt,text/*,audio/*,video/*,application/pdf"
              className="hidden"
              onChange={onFileSelect}
            />

            {/* Plus menu — centered vertically */}
            <div className="shrink-0 flex items-center justify-center">
              <InputAttachMenu
                onFileClick={() => fileInputRef.current?.click()}
                onAction={handleAttachAction}
              />
            </div>

            {/* Textarea — fills center, vertically centered */}
            <div className="flex-1 relative flex items-center min-w-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  onInputChange(e.target.value);
                  onShowSlashMenuChange(e.target.value.startsWith("/") && !e.target.value.includes(" "));
                }}
                onKeyDown={handleKeyDown}
                placeholder={t("pages:home.cmd.placeholder", { defaultValue: "Run a command..." })}
                className="w-full resize-none bg-transparent px-1 py-2 text-sm leading-5 focus:outline-none placeholder:text-muted-foreground/35 min-h-[40px] max-h-[180px]"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 180) + "px";
                }}
              />
              {showSlashMenu && (
                <AgentSlashMenu
                  input={input}
                  visible={showSlashMenu}
                  onSelect={(cmd) => {
                    // Add as non-editable tag, clear the "/" trigger from textarea
                    onSlashSelect(cmd);
                    onInputChange("");
                    onShowSlashMenuChange(false);
                  }}
                  onClose={() => onShowSlashMenuChange(false)}
                />
              )}
            </div>

            {/* Send / Stop — centered vertically */}
            <div className="shrink-0 flex items-center justify-center">
              {loading ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  onClick={onStop}
                  title={t("pages:home.cmd.stop", { defaultValue: "Stop generation" })}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all duration-200",
                    (input.trim() || files.length > 0)
                      ? "bg-gold text-obsidian shadow-sm shadow-gold/20 hover:shadow-md hover:bg-gold-dim"
                      : "bg-muted text-muted-foreground/30"
                  )}
                  onClick={onSubmit}
                  disabled={(!input.trim() && files.length === 0) || isSubmitting}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Keyboard hint — desktop only (noise on touch) */}
          <p className="hidden sm:block text-nano text-muted-foreground/20 text-center mt-1.5 select-none tracking-wide">
            <kbd className="font-mono">Enter</kbd> {t("pages:home.cmd.hint_run", { defaultValue: "to run" })} · <kbd className="font-mono">/</kbd> {t("pages:home.cmd.hint_commands", { defaultValue: "for commands" })} · <kbd className="font-mono">+</kbd> {t("pages:home.cmd.hint_attach", { defaultValue: "to attach" })}
          </p>
        </div>
      </div>
    );
  },
);
