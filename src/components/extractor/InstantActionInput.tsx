import { Button } from "@/components/ui/button";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import {
  Zap, Globe, FileAudio, Film, Type,
  ChevronDown, Brain, Layers, FileUp, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ACCEPTED_MEDIA = ".mp3,.wav,.m4a,.ogg,.webm,.flac,.mp4,.mov,.avi";
const ACCEPTED_TRANSCRIPTS = ".txt,.srt,.vtt,.md,.pdf";

interface InstantActionInputProps {
  input: string;
  setInput: (v: string) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  isDragging: boolean;
  detectedType: "url" | "text" | null;
  isRunning: boolean;
  balance: number;
  balanceLoading: boolean;
  estimatedCost: number;
  hasEnoughCredits: boolean;
  showSettings: boolean;
  setShowSettings: (fn: (v: boolean) => boolean) => void;
  extractionDepth: "quick" | "deep";
  setExtractionDepth: (v: "quick" | "deep") => void;
  insufficientCredits: { needed: number } | null;
  setInsufficientCredits: (v: { needed: number } | null) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  runPipeline: () => void;
  compact?: boolean;
  user: any;
}

export function InstantActionInput(props: InstantActionInputProps) {
  const {
    input, setInput, selectedFile, setSelectedFile,
    isDragging, detectedType, isRunning,
    balance, balanceLoading, estimatedCost, hasEnoughCredits,
    showSettings, setShowSettings, extractionDepth, setExtractionDepth,
    insufficientCredits, setInsufficientCredits,
    fileRef, handleFileSelect, runPipeline, compact, user,
  } = props;

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-5"
    >
      {/* Input row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          {selectedFile ? (
            <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5 border border-border">
              {selectedFile.type.startsWith("audio/") ? (
                <FileAudio className="h-4 w-4 text-primary shrink-0" />
              ) : selectedFile.type.startsWith("video/") ? (
                <Film className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Type className="h-4 w-4 text-primary shrink-0" />
              )}
              <span className="text-sm truncate flex-1">{selectedFile.name}</span>
              <span className="text-micro text-muted-foreground shrink-0">
                {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          ) : (
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isDragging ? "Drop file here…" : "Paste link or type content…"}
              className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground/50"
              onKeyDown={e => { if (e.key === "Enter" && (input.trim() || selectedFile)) runPipeline(); }}
              aria-label="Content input"
            />
          )}
          {detectedType && !selectedFile && input.trim() && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              {detectedType === "url" ? (
                <Globe className="h-3.5 w-3.5 text-primary/50" />
              ) : (
                <Type className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept={`${ACCEPTED_MEDIA},${ACCEPTED_TRANSCRIPTS}`} className="hidden" onChange={handleFileSelect} aria-hidden="true" />
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-xl"
          onClick={() => fileRef.current?.click()}
          aria-label="Upload file"
        >
          <FileUp className="h-4 w-4" />
        </Button>

        <Button
          size="lg"
          className={cn(
            "h-11 gap-2 rounded-xl px-5 font-semibold shrink-0",
            !hasEnoughCredits && (input.trim() || selectedFile) && "opacity-70"
          )}
          onClick={runPipeline}
          disabled={(!input.trim() && !selectedFile) || isRunning}
          aria-label="Start analysis"
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Analyze</span>
        </Button>
      </div>

      {/* Balance indicator */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-micro text-muted-foreground/60">
          {!balanceLoading && user && (
            <span className={cn(
              "flex items-center gap-1 font-mono font-medium",
              balance < estimatedCost ? "text-destructive/70"
                : balance < estimatedCost * 2 ? "text-amber-500/70"
                : "text-muted-foreground/60"
            )}>
              <Coins className="h-2.5 w-2.5" />
              {balance} NEURONS
            </span>
          )}
          <span className="flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> YouTube, URLs</span>
          <span className="flex items-center gap-1 hidden sm:flex"><FileAudio className="h-2.5 w-2.5" /> Audio</span>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="flex items-center gap-1 text-micro text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          aria-expanded={showSettings}
          aria-label="Toggle settings"
        >
          Settings
          <ChevronDown className={cn("h-2.5 w-2.5 transition-transform", showSettings && "rotate-180")} />
        </button>
      </div>

      {/* Low balance warning */}
      {!hasEnoughCredits && !insufficientCredits && user && !balanceLoading && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden">
          <div className="mt-3 p-3 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center gap-3" role="alert">
            <Coins className="h-4 w-4 text-destructive/60 shrink-0" />
            <p className="text-dense text-muted-foreground flex-1">
              {extractionDepth === "deep" ? "Deep" : "Quick"} analysis needs <span className="font-mono font-semibold text-foreground">{estimatedCost}</span> NEURONS.
              You have <span className="font-mono font-semibold text-destructive">{balance}</span>.
            </p>
            <Button size="sm" variant="outline" className="h-7 text-micro px-3 shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setInsufficientCredits({ needed: estimatedCost })}>
              Top Up
            </Button>
          </div>
        </motion.div>
      )}

      {/* Insufficient credits upsell */}
      <AnimatePresence>
        {insufficientCredits && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border">
              <InlineTopUp needed={insufficientCredits.needed} balance={balance} onDismiss={() => setInsufficientCredits(null)} compact={compact} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="border-t border-border mt-3 pt-3 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground w-24">Extraction</span>
                <div className="flex gap-1" role="radiogroup" aria-label="Extraction depth">
                  {([
                    { value: "quick" as const, label: "Quick · 100 cr", icon: Brain },
                    { value: "deep" as const, label: "Deep · 500 cr", icon: Layers },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      role="radio"
                      aria-checked={extractionDepth === opt.value}
                      onClick={() => { setExtractionDepth(opt.value); setInsufficientCredits(null); }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                        extractionDepth === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <opt.icon className="h-3 w-3" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
