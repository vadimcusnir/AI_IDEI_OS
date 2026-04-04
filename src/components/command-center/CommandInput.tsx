/**
 * CommandInput — Zone 1: The primary input region of the Command Center.
 * Handles text input, file attachments, URL detection, slash commands,
 * and quick action chips.
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send, X, Paperclip, Loader2, Globe,
  Link2, FileText, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentSlashMenu } from "@/components/agent/AgentSlashMenu";
import { motion, AnimatePresence } from "framer-motion";

const URL_REGEX = /https?:\/\/[^\s]+/gi;

interface CommandInputProps {
  onSubmit: (text: string, files: File[]) => void;
  loading: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function CommandInput({ onSubmit, loading, onStop, disabled }: CommandInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedUrls = input.match(URL_REGEX) || [];
  const hasContent = input.trim().length > 0 || files.length > 0;

  const handleSubmit = useCallback(() => {
    if (!hasContent || disabled) return;
    onSubmit(input.trim(), files);
    setInput("");
    setFiles([]);
  }, [input, files, hasContent, disabled, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSlashSelect = (cmd: string) => {
    setInput(cmd + " ");
    setShowSlashMenu(false);
    inputRef.current?.focus();
  };

  // Expose setter for external control
  const setInputExternal = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="border-t border-border p-3 bg-card space-y-2">
      {/* URL detection indicator */}
      <AnimatePresence>
        {detectedUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10"
          >
            <Link2 className="h-3 w-3 text-primary shrink-0" />
            <span className="text-nano text-primary/80 truncate">
              {detectedUrls.length} URL{detectedUrls.length > 1 ? "s" : ""} detected — will be processed
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File attachments */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-micro">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-[120px]">{f.name}</span>
              <span className="text-muted-foreground/60">
                {(f.size / 1024).toFixed(0)}KB
              </span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf,.docx,.mp3,.mp4,.wav,.m4a,.webm,.ogg,.srt,text/*,audio/*,video/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSlashMenu(e.target.value.startsWith("/") && !e.target.value.includes(" "));
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, paste a URL, or describe what you need..."
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 min-h-[36px] max-h-[120px]"
            rows={1}
            disabled={disabled}
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
              onSelect={handleSlashSelect}
              onClose={() => setShowSlashMenu(false)}
            />
          )}
        </div>
        {loading ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onStop}>
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            onClick={handleSubmit}
            disabled={!hasContent || disabled}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
