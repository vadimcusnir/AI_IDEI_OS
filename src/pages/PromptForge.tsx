import { useState, useCallback } from "react";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { GoalSelector } from "@/components/prompt-forge/GoalSelector";
import { PromptOutput } from "@/components/prompt-forge/PromptOutput";
import { TemplateLibrary } from "@/components/prompt-forge/TemplateLibrary";
import { PromptHistory } from "@/components/prompt-forge/PromptHistory";

export default function PromptForge() {
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const { t } = useTranslation("pages");
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const estimatedCost = 200;

  const handleTemplateSelect = useCallback((template: any) => {
    setGoal(template.goal);
    if (template.context_template) setContext(template.context_template);
    if (template.details_template) setDetails(template.details_template);
    toast.success(`Template „${template.title}" aplicat`);
  }, []);

  const handleHistoryReuse = useCallback((item: any) => {
    setGoal(item.goal);
    setContext(item.context);
    setDetails(item.details || "");
    setResult(item.result);
    toast.success("Prompt din istoric încărcat");
  }, []);

  const saveToHistory = useCallback(async () => {
    if (!user || !result) return;
    await supabase.from("prompt_history").insert({
      user_id: user.id,
      goal,
      context,
      details,
      result,
      credits_spent: estimatedCost,
    });
    setHistoryRefresh(prev => prev + 1);
    toast.success("Salvat în istoric!");
  }, [user, goal, context, details, result, estimatedCost]);

  const handleGenerate = useCallback(async () => {
    if (!user) { toast.error(t("prompt_forge.error_auth")); return; }
    if (!context.trim() || !goal) { toast.error(t("prompt_forge.error_fields")); return; }
    if (balance < estimatedCost) {
      toast.error(t("prompt_forge.error_credits", { cost: estimatedCost }));
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const { data: neuron, error: nErr } = await supabase
        .from("neurons")
        .insert({ title: `Prompt Forge: ${goal}`, author_id: user.id, status: "draft" })
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

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            job_id: job.id,
            service_key: "prompt-forge",
            neuron_id: neuron.id,
            inputs: { context, goal, details },
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
              setResult(fullText);
            }
          } catch {}
        }
      }

      // Auto-save to history
      await supabase.from("prompt_history").insert({
        user_id: user.id,
        goal,
        context,
        details,
        result: fullText,
        credits_spent: estimatedCost,
      });
      setHistoryRefresh(prev => prev + 1);

      toast.success(t("prompt_forge.success"));
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setLoading(false);
  }, [user, context, goal, details, t, balance, estimatedCost]);

  return (
    <PremiumGate requiredTier="pro" featureName="Prompt Forge" fallback="overlay">
      <div className="flex-1">
        <SEOHead title="Prompt Forge — AI-IDEI" description="Generate AI prompts for marketing, copywriting and content creation." />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Hero */}
          <div className="mb-6">
            <h1 className="text-2xl font-serif font-bold mb-2">{t("prompt_forge.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              {t("prompt_forge.subtitle")}
            </p>
          </div>

          {/* Template Library */}
          <TemplateLibrary onSelect={handleTemplateSelect} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input panel */}
            <div className="space-y-4">
              <GoalSelector goal={goal} onSelect={setGoal} />

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("prompt_forge.context_label")}
                </label>
                <Textarea
                  value={context}
                  onChange={e => setContext(e.target.value)}
                  placeholder={t("prompt_forge.context_placeholder")}
                  rows={4}
                  className="text-sm"
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

              <Button
                onClick={handleGenerate}
                disabled={loading || !context.trim() || !goal || balance < estimatedCost}
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("prompt_forge.generating")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("prompt_forge.generate_button", { cost: estimatedCost })}
                  </>
                )}
              </Button>

              {balance < estimatedCost && !loading && (
                <div className="mt-3">
                  <InlineTopUp needed={estimatedCost} balance={balance} compact />
                </div>
              )}

              <p className="text-[10px] text-muted-foreground/50 text-center">
                {t("prompt_forge.balance_label", { balance })}
              </p>

              {/* History */}
              <PromptHistory onReuse={handleHistoryReuse} refreshKey={historyRefresh} />
            </div>

            {/* Output panel */}
            <div className="min-h-[400px] rounded-xl border border-border bg-card p-5 overflow-y-auto max-h-[70vh]">
              <PromptOutput result={result} onSaveToHistory={result ? saveToHistory : undefined} />
            </div>
          </div>
        </div>
      </div>
    </PremiumGate>
  );
}
