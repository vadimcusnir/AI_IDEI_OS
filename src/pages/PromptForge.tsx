import { useState, useCallback } from "react";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PipelineSourcePicker } from "@/components/services/PipelineSourcePicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Layers, Link2, Store, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { truncateForService, formatTruncationMessage } from "@/lib/contentTruncation";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { GoalSelector } from "@/components/prompt-forge/GoalSelector";
import { PromptOutput } from "@/components/prompt-forge/PromptOutput";
import { TemplateLibrary } from "@/components/prompt-forge/TemplateLibrary";
import { PromptHistory } from "@/components/prompt-forge/PromptHistory";
import { VariantComparison, Variant } from "@/components/prompt-forge/VariantComparison";
import { PromptChainBuilder, ChainStep } from "@/components/prompt-forge/PromptChainBuilder";
import { FeedbackLoop } from "@/components/prompt-forge/FeedbackLoop";
import { TemplateMarketplace } from "@/components/prompt-forge/TemplateMarketplace";
import { PromptAnalytics } from "@/components/prompt-forge/PromptAnalytics";

const SINGLE_COST = 200;
const VARIANT_COST = 500;

async function streamGenerate(
  session: any,
  inputs: { context: string; goal: string; details: string },
  neuronId: number,
  jobId: string,
  onChunk: (text: string) => void
): Promise<string> {
  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        job_id: jobId,
        service_key: "prompt-forge",
        neuron_id: neuronId,
        inputs,
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  const reader = resp.body?.getReader();
  if (!reader) throw new Error("No stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIdx: number;
    while ((nlIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nlIdx);
      buffer = buffer.slice(nlIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullText += content;
          onChunk(fullText);
        }
      } catch {}
    }
  }
  return fullText;
}

export default function PromptForge() {
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const { t } = useTranslation("pages");

  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [lastHistoryId, setLastHistoryId] = useState<string | undefined>();

  const [mode, setMode] = useState<"single" | "variants" | "chain">("single");
  const [activeTab, setActiveTab] = useState<"create" | "marketplace" | "analytics">("create");

  // Single mode
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Variants mode
  const [variants, setVariants] = useState<Variant[]>([
    { index: 0, result: "", loading: false },
    { index: 1, result: "", loading: false },
    { index: 2, result: "", loading: false },
  ]);
  const [selectedVariant, setSelectedVariant] = useState<number>(0);

  // Chain mode
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([
    { id: crypto.randomUUID(), instruction: "" },
  ]);
  const [activeChainStep, setActiveChainStep] = useState(0);
  const [chainRunning, setChainRunning] = useState(false);

  const estimatedCost = mode === "variants" ? VARIANT_COST : SINGLE_COST;

  const handleTemplateSelect = useCallback((template: any) => {
    setGoal(template.goal);
    if (template.context_template) setContext(template.context_template);
    if (template.details_template) setDetails(template.details_template);
    setActiveTab("create");
    toast.success(`Template „${template.title}" aplicat`);
  }, []);

  const handleHistoryReuse = useCallback((item: any) => {
    setGoal(item.goal);
    setContext(item.context);
    setDetails(item.details || "");
    setResult(item.result);
    setMode("single");
    toast.success(t("toast_prompt_loaded"));
  }, []);

  const createNeuronAndJob = useCallback(async (suffix = "") => {
    if (!user) throw new Error("Not authenticated");
    const { data: neuron, error: nErr } = await supabase
      .from("neurons")
      .insert({ title: `Prompt Forge: ${goal}${suffix}`, author_id: user.id, status: "draft" })
      .select("id")
      .single();
    if (nErr || !neuron) throw new Error("Failed to create neuron");

    const { data: job, error: jErr } = await supabase
      .from("neuron_jobs")
      .insert({
        neuron_id: neuron.id,
        worker_type: "prompt-forge",
        status: "pending",
        author_id: user.id,
        input: { context, goal, details },
      })
      .select("id")
      .single();
    if (jErr || !job) throw new Error("Failed to create job");

    return { neuronId: neuron.id, jobId: job.id };
  }, [user, context, goal, details]);

  // Single generation
  const handleGenerate = useCallback(async () => {
    if (!user) { toast.error(t("prompt_forge.error_auth")); return; }
    if (!context.trim() || !goal) { toast.error(t("prompt_forge.error_fields")); return; }
    if (balance < estimatedCost) { toast.error(t("prompt_forge.error_credits", { cost: estimatedCost })); return; }

    setLoading(true);
    setResult("");
    setLastHistoryId(undefined);
    try {
      const { neuronId, jobId } = await createNeuronAndJob();
      const { data: { session } } = await supabase.auth.getSession();

      // Load user's past feedback for AI loop
      const { data: feedback } = await supabase
        .from("prompt_history")
        .select("rating, feedback, goal")
        .eq("user_id", user.id)
        .eq("goal", goal)
        .not("feedback", "is", null)
        .order("created_at", { ascending: false })
        .limit(3);

      const feedbackContext = feedback?.length
        ? `\n\n[Feedback anterior: ${feedback.map(f => `Rating ${f.rating}/5: "${f.feedback}"`).join("; ")}]`
        : "";

      // Truncate context if too long
      const contextResult = truncateForService(context);
      if (contextResult.wasTruncated) {
        toast.info(formatTruncationMessage(contextResult), { duration: 6000 });
      }

      const fullText = await streamGenerate(
        session,
        { context: contextResult.content, goal, details: details + feedbackContext },
        neuronId, jobId, setResult
      );

      const { data: historyRow } = await supabase
        .from("prompt_history")
        .insert({
          user_id: user.id, goal, context, details, result: fullText, credits_spent: estimatedCost,
        })
        .select("id")
        .single();

      if (historyRow) setLastHistoryId(historyRow.id);
      setHistoryRefresh(p => p + 1);
      toast.success(t("prompt_forge.success"));
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setLoading(false);
  }, [user, context, goal, details, t, balance, estimatedCost, createNeuronAndJob]);

  // Variants generation
  const handleGenerateVariants = useCallback(async () => {
    if (!user) { toast.error(t("prompt_forge.error_auth")); return; }
    if (!context.trim() || !goal) { toast.error(t("prompt_forge.error_fields")); return; }
    if (balance < VARIANT_COST) { toast.error(t("prompt_forge.error_credits", { cost: VARIANT_COST })); return; }

    setVariants([
      { index: 0, result: "", loading: true },
      { index: 1, result: "", loading: true },
      { index: 2, result: "", loading: true },
    ]);

    const { data: { session } } = await supabase.auth.getSession();

    const promises = [0, 1, 2].map(async (i) => {
      try {
        const { neuronId, jobId } = await createNeuronAndJob(` v${i + 1}`);
        const detailsWithVariant = `${details}\n\n[Varianta ${i + 1} din 3 — abordare ${i === 0 ? "concisă" : i === 1 ? "detaliată" : "creativă"}]`;

        const fullText = await streamGenerate(
          session,
          { context, goal, details: detailsWithVariant },
          neuronId, jobId,
          (text) => setVariants(prev => prev.map(v => v.index === i ? { ...v, result: text } : v))
        );

        setVariants(prev => prev.map(v => v.index === i ? { ...v, result: fullText, loading: false } : v));

        await supabase.from("prompt_history").insert({
          user_id: user.id, goal, context, details, result: fullText,
          credits_spent: Math.round(VARIANT_COST / 3), variant_index: i,
        });
      } catch (e: any) {
        setVariants(prev => prev.map(v => v.index === i ? { ...v, result: `Eroare: ${e.message}`, loading: false } : v));
      }
    });

    await Promise.allSettled(promises);
    setHistoryRefresh(p => p + 1);
    toast.success(t("prompt_forge.success"));
  }, [user, context, goal, details, t, balance, createNeuronAndJob]);

  // Chain execution
  const handleRunChain = useCallback(async () => {
    if (!user) { toast.error(t("prompt_forge.error_auth")); return; }
    if (!context.trim() || !goal) { toast.error(t("prompt_forge.error_fields")); return; }
    if (balance < SINGLE_COST * chainSteps.length) {
      toast.error(t("prompt_forge.error_credits", { cost: SINGLE_COST * chainSteps.length }));
      return;
    }

    setChainRunning(true);
    const { data: { session } } = await supabase.auth.getSession();
    let previousOutput = "";

    for (let i = 0; i < chainSteps.length; i++) {
      setActiveChainStep(i);
      try {
        const stepContext = i === 0 ? context : `Context original:\n${context}\n\nRezultat anterior:\n${previousOutput}`;
        const stepDetails = chainSteps[i].instruction;
        const { neuronId, jobId } = await createNeuronAndJob(` chain-${i + 1}`);

        const fullText = await streamGenerate(
          session,
          { context: stepContext, goal, details: stepDetails },
          neuronId, jobId,
          (text) => {
            setChainSteps(prev => prev.map((s, idx) => idx === i ? { ...s, result: text } : s));
            if (i === chainSteps.length - 1) setResult(text);
          }
        );

        previousOutput = fullText;
        setChainSteps(prev => prev.map((s, idx) => idx === i ? { ...s, result: fullText } : s));

        if (i === chainSteps.length - 1) {
          setResult(fullText);
          await supabase.from("prompt_history").insert({
            user_id: user.id, goal, context, details: chainSteps.map(s => s.instruction).join(" → "),
            result: fullText, credits_spent: SINGLE_COST * chainSteps.length, chain_step: chainSteps.length,
          });
          setHistoryRefresh(p => p + 1);
        }
      } catch (e: any) {
        toast.error(`Chain step ${i + 1} failed: ${e.message}`);
        break;
      }
    }

    setChainRunning(false);
    toast.success(t("prompt_forge.success"));
  }, [user, context, goal, chainSteps, t, balance, createNeuronAndJob]);

  const handleRateVariant = useCallback(async (index: number, rating: number) => {
    setVariants(prev => prev.map(v => v.index === index ? { ...v, rating } : v));
  }, []);

  const isGenerating = loading || chainRunning || variants.some(v => v.loading);
  const activeResult = mode === "variants"
    ? (variants[selectedVariant]?.result || "")
    : result;

  return (
    <PremiumGate requiredTier="pro" featureName="Prompt Forge" fallback="overlay">
      <div className="flex-1">
        <SEOHead title="Prompt Forge — AI-IDEI" description="Generate AI prompts for marketing, copywriting and content creation." />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Hero */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{t("prompt_forge.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              {t("prompt_forge.subtitle")}
            </p>
          </div>

          {/* Main Tabs: Create / Marketplace / Analytics */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
            <TabsList className="h-8">
              <TabsTrigger value="create" className="text-xs gap-1.5">
                <Sparkles className="h-3 w-3" />
                Creează
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="text-xs gap-1.5">
                <Store className="h-3 w-3" />
                Marketplace
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs gap-1.5">
                <BarChart3 className="h-3 w-3" />
                Statistici
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marketplace" className="mt-4">
              <TemplateMarketplace onSelect={handleTemplateSelect} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <PromptAnalytics />
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              {/* Template Library */}
              <TemplateLibrary onSelect={handleTemplateSelect} />

              {/* Mode Tabs */}
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="mb-6">
                <TabsList className="h-8">
                  <TabsTrigger value="single" className="text-xs gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Simplu
                  </TabsTrigger>
                  <TabsTrigger value="variants" className="text-xs gap-1.5">
                    <Layers className="h-3 w-3" />
                    3 Variante
                  </TabsTrigger>
                  <TabsTrigger value="chain" className="text-xs gap-1.5">
                    <Link2 className="h-3 w-3" />
                    Chain
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input panel */}
                <div className="space-y-4">
                  <GoalSelector goal={goal} onSelect={setGoal} />

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t("prompt_forge.context_label")}
                    </label>
                    <PipelineSourcePicker
                      value={context}
                      onChange={setContext}
                      placeholder={t("prompt_forge.context_placeholder")}
                      minRows={4}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t("prompt_forge.details_label")}
                    </label>
                    <Textarea
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      placeholder={t("prompt_forge.details_placeholder")}
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  {mode === "chain" && (
                    <PromptChainBuilder
                      steps={chainSteps}
                      onUpdateStep={(id, instr) =>
                        setChainSteps(prev => prev.map(s => s.id === id ? { ...s, instruction: instr } : s))
                      }
                      onAddStep={() =>
                        setChainSteps(prev => [...prev, { id: crypto.randomUUID(), instruction: "" }])
                      }
                      onRemoveStep={(id) =>
                        setChainSteps(prev => prev.filter(s => s.id !== id))
                      }
                      activeStepIndex={activeChainStep}
                    />
                  )}

                  <Button
                    onClick={
                      mode === "variants" ? handleGenerateVariants
                      : mode === "chain" ? handleRunChain
                      : handleGenerate
                    }
                    disabled={isGenerating || !context.trim() || !goal || balance < estimatedCost}
                    className="w-full gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("prompt_forge.generating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {mode === "variants"
                          ? t("prompt_forge.generate_variants", { defaultValue: `Generează 3 Variante (${VARIANT_COST} N)` })
                          : mode === "chain"
                          ? `Run Chain (${SINGLE_COST * chainSteps.length} N)`
                          : t("prompt_forge.generate_button", { cost: estimatedCost })
                        }
                      </>
                    )}
                  </Button>

                  {balance < estimatedCost && !isGenerating && (
                    <div className="mt-3">
                      <InlineTopUp needed={estimatedCost} balance={balance} compact />
                    </div>
                  )}

                  <p className="text-micro text-muted-foreground/50 text-center">
                    {t("prompt_forge.balance_label", { balance })}
                  </p>

                  <PromptHistory onReuse={handleHistoryReuse} refreshKey={historyRefresh} />
                </div>

                {/* Output panel */}
                <div className="space-y-4">
                  {mode === "variants" ? (
                    <VariantComparison
                      variants={variants}
                      onRate={handleRateVariant}
                      onSelect={setSelectedVariant}
                      selectedIndex={selectedVariant}
                    />
                  ) : (
                    <div className="min-h-[400px] rounded-xl border border-border bg-card p-5 overflow-y-auto max-h-[70vh]">
                      <PromptOutput result={activeResult} goal={goal} />
                      {activeResult && mode === "single" && (
                        <FeedbackLoop
                          historyId={lastHistoryId}
                          result={activeResult}
                          goal={goal}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PremiumGate>
  );
}
