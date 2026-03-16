import { useState, useCallback } from "react";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2, ArrowLeft, Loader2, Copy, Sparkles, FileText,
  User, ShoppingBag, Mail, PenTool, LayoutList
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.gif";
import { InlineTopUp } from "@/components/credits/InlineTopUp";
import { useTranslation } from "react-i18next";

const GOALS = [
  { key: "prompt_forge.goal_experience", value: "Extragere experiență", icon: User, color: "text-primary" },
  { key: "prompt_forge.goal_profile", value: "Descriere profil", icon: FileText, color: "text-ai-accent" },
  { key: "prompt_forge.product_recommendation", value: "Product Recommendation", icon: ShoppingBag, color: "text-status-validated" },
  { key: "prompt_forge.content_structuring", value: "Content Structuring", icon: LayoutList, color: "text-primary" },
  { key: "prompt_forge.sales_copy", value: "Sales Copy", icon: PenTool, color: "text-destructive" },
  { key: "prompt_forge.email_sequence", value: "Email Sequence", icon: Mail, color: "text-ai-accent" },
];

export default function PromptForge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const { t } = useTranslation("pages");
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const estimatedCost = 200; // Prompt Forge typical cost

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
      // Create a temporary neuron + job for the service
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

      // Stream response
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

      toast.success(t("prompt_forge.success"));
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
    }
    setLoading(false);
  }, [user, context, goal, details, t, balance, estimatedCost]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    toast.success(t("prompt_forge.copied"));
  }, [result, t]);

  return (
    <PremiumGate requiredTier="pro" featureName="Prompt Forge" fallback="overlay">
    <div className="flex-1">
      <SEOHead title="Prompt Forge — AI-IDEI" description="Generate AI prompts for marketing, copywriting and content creation." />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">{t("prompt_forge.title")}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            {t("prompt_forge.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("prompt_forge.goal_label")}</label>
              <div className="grid grid-cols-2 gap-2">
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all",
                      goal === g.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    <g.icon className={cn("h-3.5 w-3.5", goal === g.value ? "text-primary" : g.color)} />
                    {t(g.key)}
                  </button>
                ))}
              </div>
            </div>

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
          </div>

          {/* Output panel */}
          <div className="min-h-[400px] rounded-xl border border-border bg-card p-5 overflow-y-auto max-h-[70vh]">
            {result ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("prompt_forge.result_label")}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copyToClipboard}>
                    <Copy className="h-3 w-3" />
                    {t("prompt_forge.copy")}
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Wand2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground/50">
                  {t("prompt_forge.empty_hint")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PremiumGate>
  );
}
