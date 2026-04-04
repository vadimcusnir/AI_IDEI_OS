/**
 * MagicPipelineFlow — Enhanced Magic Pipeline with live timeline,
 * plan preview, cost gating, and Command Center integration.
 * Replaces the basic MagicPipelineButton with a full orchestration UX.
 */
import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useWalletAtomicity } from "@/hooks/useWalletAtomicity";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Loader2, CheckCircle2, Upload, AlertCircle, FileText, Link2,
  ChevronRight, Clock, Sparkles, Brain, Network, FileOutput, ArrowRight,
  XCircle, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ═══ Pipeline Steps Definition ═══
interface PipelineStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  cost: number;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: { count?: number; link?: string; label?: string };
  startedAt?: number;
  completedAt?: number;
}

const INITIAL_STEPS: Omit<PipelineStep, "status">[] = [
  { id: "import", label: "Import Source", description: "Upload file or scrape URL", icon: Upload, cost: 0 },
  { id: "transcribe", label: "Transcribe", description: "Convert audio/video to text", icon: FileText, cost: 50 },
  { id: "extract", label: "Extract Neurons", description: "AI knowledge extraction", icon: Brain, cost: 250 },
  { id: "link", label: "Build Relations", description: "Connect neurons into a graph", icon: Network, cost: 100 },
  { id: "generate", label: "Generate Deliverables", description: "Create reports & assets", icon: FileOutput, cost: 100 },
];

const TOTAL_COST = INITIAL_STEPS.reduce((a, s) => a + s.cost, 0);

type InputMode = "file" | "url";
type FlowPhase = "input" | "preview" | "running" | "complete" | "error";

interface Props {
  className?: string;
  compact?: boolean;
  onPipelineMessage?: (role: "user" | "assistant", content: string, meta?: Record<string, any>) => void;
}

export function MagicPipelineFlow({ className, compact, onPipelineMessage }: Props) {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { balance, refetch: refetchBalance } = useCreditBalance();
  const { reserve, settle, release } = useWalletAtomicity();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<FlowPhase>("input");
  const [showDialog, setShowDialog] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const reservationRef = useRef<number>(0);

  const canAfford = balance >= TOTAL_COST;

  // ═══ Initialize steps for preview ═══
  const initSteps = useCallback((file?: File, url?: string) => {
    const isMedia = file?.type?.startsWith("audio/") || file?.type?.startsWith("video/");
    return INITIAL_STEPS.map((s) => ({
      ...s,
      status: "pending" as const,
      // Skip transcribe for non-media files
      ...(s.id === "transcribe" && !isMedia ? { status: "skipped" as const, cost: 0 } : {}),
    }));
  }, []);

  // ═══ Open dialog flow ═══
  const handleOpen = () => {
    setPhase("input");
    setShowDialog(true);
    setErrorMsg("");
    setSelectedFile(null);
    setUrlInput("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const s = initSteps(file);
      setSteps(s);
      setPhase("preview");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    const s = initSteps(undefined, urlInput);
    setSteps(s);
    setPhase("preview");
  };

  // ═══ Update step status ═══
  const updateStep = (id: string, update: Partial<PipelineStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)));
  };

  // ═══ Cost calculation ═══
  const activeCost = steps.filter((s) => s.status !== "skipped").reduce((a, s) => a + s.cost, 0) || TOTAL_COST;

  // ═══ Execute Pipeline ═══
  const runPipeline = async () => {
    if (!user) return;
    setPhase("running");
    setStartedAt(Date.now());
    setErrorMsg("");

    onPipelineMessage?.("user", `🚀 Magic Pipeline: ${selectedFile?.name || urlInput}`);

    const reservation = await reserve(activeCost, undefined, "Magic Pipeline: full extraction");
    if (!reservation.ok) {
      setPhase("error");
      setErrorMsg(reservation.error || "Insufficient credits");
      return;
    }
    reservationRef.current = reservation.reserved;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // ── Step 1: Import ──
      updateStep("import", { status: "running", startedAt: Date.now() });
      let sourceText = "";

      if (urlInput) {
        const resp = await supabase.functions.invoke("scrape-url", { body: { url: urlInput } });
        if (resp.error) throw new Error("Source import failed");
        sourceText = resp.data?.text || resp.data?.content || "";
      } else if (selectedFile) {
        const isMedia = selectedFile.type.startsWith("audio/") || selectedFile.type.startsWith("video/");
        if (isMedia) {
          updateStep("import", { status: "completed", completedAt: Date.now(), result: { label: selectedFile.name } });

          // ── Step 1.5: Transcribe ──
          updateStep("transcribe", { status: "running", startedAt: Date.now() });
          const formData = new FormData();
          formData.append("file", selectedFile);
          const resp = await supabase.functions.invoke("transcribe-audio", { body: formData });
          if (resp.error) throw new Error("Transcription failed");
          sourceText = resp.data?.text || "";
          updateStep("transcribe", { status: "completed", completedAt: Date.now(), result: { count: sourceText.length, label: `${Math.round(sourceText.length / 1000)}k chars` } });
        } else {
          sourceText = await selectedFile.text();
        }
      }

      if (!sourceText || sourceText.length < 50) throw new Error("Source content too short");
      updateStep("import", { status: "completed", completedAt: Date.now(), result: { count: sourceText.length, label: `${Math.round(sourceText.length / 1000)}k chars` } });

      // ── Step 2: Extract ──
      updateStep("extract", { status: "running", startedAt: Date.now() });
      const episodeTitle = urlInput
        ? new URL(urlInput).hostname + " — Import"
        : (selectedFile?.name || "Pipeline Import");

      const { data: newEpisode, error: epError } = await supabase
        .from("episodes")
        .insert({
          title: episodeTitle,
          transcript: sourceText.slice(0, 50000),
          author_id: user.id,
          workspace_id: currentWorkspace?.id,
          source_type: urlInput ? "url" : "file",
          status: "transcribed",
        })
        .select("id")
        .single();

      if (epError || !newEpisode) throw new Error("Failed to create episode");

      const extractResp = await supabase.functions.invoke("extract-neurons", {
        body: { episode_id: newEpisode.id },
      });
      if (extractResp.error) throw new Error("Extraction failed");
      const neuronCount = extractResp.data?.neurons_created || extractResp.data?.count || 0;
      updateStep("extract", {
        status: "completed", completedAt: Date.now(),
        result: { count: neuronCount, label: `${neuronCount} neurons`, link: "/library" },
      });

      // ── Step 3: Link / Relations ──
      updateStep("link", { status: "running", startedAt: Date.now() });
      // Entity/relation linking happens inside extract-neurons, so we mark it as done
      updateStep("link", {
        status: "completed", completedAt: Date.now(),
        result: { label: "Graph updated", link: "/library" },
      });

      // ── Step 4: Generate ──
      updateStep("generate", { status: "running", startedAt: Date.now() });
      const genResp = await supabase.functions.invoke("content-generate", {
        body: {
          text: sourceText.slice(0, 10000),
          neurons: extractResp.data?.neurons?.slice(0, 20) || [],
          workspace_id: currentWorkspace?.id,
          auto_pipeline: true,
        },
      });
      if (genResp.error) throw new Error("Generation failed");
      const deliverableCount = genResp.data?.deliverables?.length || genResp.data?.count || 1;
      updateStep("generate", {
        status: "completed", completedAt: Date.now(),
        result: { count: deliverableCount, label: `${deliverableCount} deliverables`, link: "/library" },
      });

      // ── Settle ──
      await settle(reservationRef.current, undefined, "Magic Pipeline: completed");
      refetchBalance();
      setPhase("complete");

      onPipelineMessage?.("assistant", `✅ Pipeline complete! ${neuronCount} neurons extracted, ${deliverableCount} deliverables generated.`, {
        type: "pipeline_result", neuronCount, deliverableCount,
      });

      toast.success(`Pipeline complete! ${neuronCount} neurons extracted`, {
        action: { label: "View Library", onClick: () => navigate("/library") },
      });
    } catch (err) {
      await release(reservationRef.current, undefined, "Magic Pipeline: failed");
      refetchBalance();
      const msg = err instanceof Error ? err.message : "Pipeline failed";
      setErrorMsg(msg);
      setPhase("error");

      // Mark current running step as failed
      setSteps((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)));

      onPipelineMessage?.("assistant", `❌ Pipeline failed: ${msg}`, { type: "pipeline_error" });
      toast.error("Pipeline failed", { description: msg });
    }
  };

  // ═══ Duration ═══
  const elapsed = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;

  return (
    <>
      {/* ═══ Trigger Button ═══ */}
      <Button
        onClick={handleOpen}
        disabled={!canAfford}
        className={cn(
          "gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20",
          compact ? "h-8 text-xs px-3" : "h-11 px-6 text-sm font-semibold",
          className,
        )}
      >
        <Zap className="h-4 w-4" />
        Magic Pipeline
        <span className="text-[10px] opacity-80 ml-1">{TOTAL_COST}N</span>
      </Button>

      {/* ═══ Pipeline Dialog ═══ */}
      <Dialog open={showDialog} onOpenChange={(v) => { if (phase !== "running") setShowDialog(v); }}>
        <DialogContent className="max-w-lg sm:max-w-xl p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/30">
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              Magic Pipeline
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload → Extract → Generate in one click
            </DialogDescription>
          </DialogHeader>

          {/* ═══ Input Phase ═══ */}
          <AnimatePresence mode="wait">
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-4"
              >
                <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as InputMode)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="file" className="flex-1 gap-2">
                      <Upload className="h-3.5 w-3.5" /> File
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex-1 gap-2">
                      <Link2 className="h-3.5 w-3.5" /> URL
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {inputMode === "file" ? (
                  <div className="space-y-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.md,.pdf,.srt,.vtt,.csv,audio/*,video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full h-32 rounded-xl border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/[0.02] hover:bg-primary/[0.05] transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground">
                        Drop file or click to browse
                      </span>
                      <span className="text-[10px] text-muted-foreground/50">
                        TXT, PDF, MD, SRT, VTT, CSV, Audio, Video
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="https://example.com/article"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                      className="h-10"
                    />
                    <Button
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      className="w-full gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Analyze URL
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ Preview Phase ═══ */}
            {phase === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-6 space-y-4"
              >
                {/* Source info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/30">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {selectedFile?.name || urlInput}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : "Web content"}
                    </p>
                  </div>
                </div>

                {/* Step timeline preview */}
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                    Execution Plan
                  </p>
                  {steps.filter((s) => s.status !== "skipped").map((step, i) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <step.icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="text-[10px] text-muted-foreground">{step.description}</p>
                      </div>
                      {step.cost > 0 && (
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                          {step.cost}N
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Cost summary */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/[0.04] border border-primary/15">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Total Cost</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary tabular-nums">{activeCost}N</span>
                    <p className="text-[10px] text-muted-foreground">
                      Balance: {balance.toLocaleString()}N
                    </p>
                  </div>
                </div>

                {!canAfford && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">
                      Insufficient credits. You need {activeCost - balance} more neurons.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto shrink-0 h-7 text-xs"
                      onClick={() => navigate("/credits")}
                    >
                      Top Up
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ═══ Running / Complete / Error Phase ═══ */}
            {(phase === "running" || phase === "complete" || phase === "error") && (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 space-y-3"
              >
                {/* Live timeline */}
                <div className="space-y-0.5">
                  {steps.filter((s) => s.status !== "skipped").map((step) => (
                    <div
                      key={step.id}
                      className={cn(
                        "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                        step.status === "running" && "bg-primary/[0.06] border border-primary/15",
                        step.status === "completed" && "opacity-80",
                        step.status === "failed" && "bg-destructive/[0.06] border border-destructive/15",
                      )}
                    >
                      {/* Status icon */}
                      <div className="shrink-0">
                        {step.status === "running" ? (
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : step.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : step.status === "failed" ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          step.status === "pending" && "text-muted-foreground",
                        )}>
                          {step.label}
                        </p>
                        {step.status === "running" && (
                          <p className="text-[10px] text-primary animate-pulse">{step.description}</p>
                        )}
                        {step.result?.label && step.status === "completed" && (
                          <p className="text-[10px] text-muted-foreground">{step.result.label}</p>
                        )}
                      </div>

                      {/* Duration */}
                      {step.startedAt && step.completedAt && (
                        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                          {((step.completedAt - step.startedAt) / 1000).toFixed(1)}s
                        </span>
                      )}

                      {/* Link to result */}
                      {step.result?.link && step.status === "completed" && (
                        <button
                          onClick={() => navigate(step.result!.link!)}
                          className="text-[10px] text-primary hover:underline shrink-0"
                        >
                          View →
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Elapsed time */}
                {phase === "running" && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="tabular-nums">{elapsed}s elapsed</span>
                  </div>
                )}

                {/* Error message */}
                {phase === "error" && errorMsg && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">{errorMsg}</p>
                  </div>
                )}

                {/* Complete summary */}
                {phase === "complete" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-3 space-y-2"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-semibold">Pipeline Complete!</p>
                    <p className="text-xs text-muted-foreground">
                      {steps.filter((s) => s.status === "completed").length} steps completed in {elapsed}s
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ Footer Actions ═══ */}
          <DialogFooter className="px-6 py-4 border-t border-border/30 bg-muted/20">
            {phase === "input" && (
              <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancel</Button>
            )}
            {phase === "preview" && (
              <>
                <Button variant="ghost" onClick={() => { setPhase("input"); setSelectedFile(null); setUrlInput(""); }}>
                  Back
                </Button>
                <Button onClick={runPipeline} disabled={!canAfford} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Execute Pipeline
                  <span className="text-[10px] opacity-70">{activeCost}N</span>
                </Button>
              </>
            )}
            {phase === "complete" && (
              <>
                <Button variant="ghost" onClick={() => setShowDialog(false)}>Close</Button>
                <Button onClick={() => navigate("/library")} className="gap-2">
                  <FileOutput className="h-4 w-4" />
                  View Results
                </Button>
              </>
            )}
            {phase === "error" && (
              <>
                <Button variant="ghost" onClick={() => setShowDialog(false)}>Close</Button>
                <Button variant="outline" onClick={() => { setPhase("preview"); setErrorMsg(""); }} className="gap-2">
                  Retry
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
