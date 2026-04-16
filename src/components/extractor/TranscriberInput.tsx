import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import {
  Youtube, Loader2, Download, Subtitles, Coins, Gift, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "idle" | "detecting" | "extracting_audio" | "downloading_audio" | "transcribing_audio" | "detecting_language" | "ready" | "error";

interface Props {
  url: string;
  setUrl: (v: string) => void;
  stage: Stage;
  progress: number;
  error: string;
  validUrl: boolean;
  isRunning: boolean;
  isFree: boolean;
  balance: number;
  balanceLoading: boolean;
  showTopUp: boolean;
  setShowTopUp: (v: boolean) => void;
  user: any;
  episodeCount: number | null;
  onTranscribe: () => void;
  transcriptCost: number;
}

export function TranscriberInput({
  url, setUrl, stage, progress, error, validUrl, isRunning,
  isFree, balance, balanceLoading, showTopUp, setShowTopUp,
  user, episodeCount, onTranscribe, transcriptCost,
}: Props) {
  return (
    <motion.div
      key="input"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "rounded-2xl border-2 transition-all duration-300 overflow-hidden",
        isRunning
          ? "border-primary/40 bg-primary/5"
          : stage === "error"
            ? "border-destructive/30 bg-destructive/5"
            : "border-border bg-card hover:border-primary/20"
      )}
    >
      <div className="p-4 sm:p-6">
        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Youtube className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-base font-semibold">YouTube → Transcript</h2>
            <p className="text-xs text-muted-foreground">Lipește un link YouTube. Audio-ul se extrage și se transcrie automat.</p>
          </div>
        </div>

        {/* Input */}
        {!isRunning && (
          <>
            <div className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm outline-none border border-border focus:border-primary transition-colors placeholder:text-muted-foreground/40 font-mono"
                onKeyDown={(e) => { if (e.key === "Enter" && validUrl) onTranscribe(); }}
                disabled={isRunning}
                aria-label="YouTube URL"
              />
              <Button
                size="lg"
                className="h-[46px] gap-2 rounded-xl px-6 font-semibold shrink-0"
                onClick={onTranscribe}
                disabled={!validUrl || isRunning || !user}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Transcrie</span>
              </Button>
            </div>

            {/* Cost indicator */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3 text-micro text-muted-foreground/60">
                {episodeCount !== null && isFree ? (
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <Gift className="h-3 w-3" />
                    Prima transcriere GRATUITĂ!
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono">
                    <Coins className="h-2.5 w-2.5" />
                    {transcriptCost} NEURONS / transcriere
                  </span>
                )}
                {!balanceLoading && user && !isFree && (
                  <span className={cn("font-mono", balance < transcriptCost ? "text-destructive/70" : "")}>
                    Sold: {balance}
                  </span>
                )}
              </div>
              <span className="text-nano text-muted-foreground/40 flex items-center gap-1">
                <Subtitles className="h-2.5 w-2.5" /> Audio STT + diarizare
              </span>
            </div>

            {/* Top-up inline */}
            <AnimatePresence>
              {showTopUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-border">
                    <InlineTopUp needed={transcriptCost} balance={balance} onDismiss={() => setShowTopUp(false)} compact />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {stage === "error" && error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive mt-3" role="alert">
                {error}
              </motion.p>
            )}
          </>
        )}

        {/* Progress */}
        {isRunning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm font-medium">
                {stage === "detecting" && "Se detectează sursa…"}
                {stage === "extracting_audio" && "Se extrage audio-ul din video…"}
                {stage === "downloading_audio" && "Se descarcă audio-ul…"}
                {stage === "transcribing_audio" && "Se transcrie audio-ul (speech-to-text)…"}
                {stage === "detecting_language" && "Se detectează limba și vorbitorii…"}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between mt-2">
              {[
                { label: "Detectare", threshold: 10 },
                { label: "Extragere Audio", threshold: 20 },
                { label: "Descărcare", threshold: 40 },
                { label: "Transcriere STT", threshold: 60 },
                { label: "Finalizare", threshold: 90 },
              ].map(({ label, threshold }) => (
                <span key={label} className={cn(
                  "text-nano font-medium transition-colors",
                  progress >= threshold ? "text-primary" : "text-muted-foreground/40"
                )}>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
