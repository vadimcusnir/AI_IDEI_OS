import { useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, X, Send, Square } from "lucide-react";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
import { cn } from "@/lib/utils";

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

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <>
        {files.length > 0 && (
          <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-border/40">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-card border border-border/40 rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
                <Paperclip className="h-3 w-3 text-muted-foreground/60" />
                <span className="truncate max-w-[140px] text-foreground">{f.name}</span>
                <button onClick={() => onRemoveFile(i)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border/40 p-3 bg-background/60 backdrop-blur-md">
          <div className={cn(
            "flex items-end gap-2 rounded-2xl border bg-card px-3 py-2 transition-all duration-300",
            "border-border/60 shadow-sm focus-within:border-primary/40 focus-within:shadow-md focus-within:shadow-primary/[0.05] focus-within:ring-1 focus-within:ring-primary/15"
          )}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,.pdf,.docx,.mp3,.mp4,.wav,.m4a,.webm,.ogg,.srt,text/*,audio/*,video/*,application/pdf"
              className="hidden"
              onChange={onFileSelect}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0 rounded-lg text-muted-foreground/50 hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  onInputChange(e.target.value);
                  onShowSlashMenuChange(e.target.value.startsWith("/") && !e.target.value.includes(" "));
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a command, paste a URL, or describe what you need..."
                className="w-full resize-none bg-transparent px-1 py-1.5 text-sm focus:outline-none placeholder:text-muted-foreground/40 min-h-[28px] max-h-[120px]"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
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
            {loading ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0 rounded-lg text-destructive hover:bg-destructive/10"
                onClick={onStop}
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 shrink-0 rounded-lg transition-all duration-200",
                  input.trim() || files.length > 0
                    ? "shadow-sm shadow-primary/20"
                    : ""
                )}
                onClick={onSubmit}
                disabled={!input.trim() && files.length === 0}
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </>
    );
  },
);
