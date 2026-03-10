import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

const GOALS = [
  { value: "Extragere experiență", icon: User, color: "text-primary" },
  { value: "Descriere profil", icon: FileText, color: "text-ai-accent" },
  { value: "Recomandare produse", icon: ShoppingBag, color: "text-status-validated" },
  { value: "Structurare conținut", icon: LayoutList, color: "text-primary" },
  { value: "Copy de vânzare", icon: PenTool, color: "text-destructive" },
  { value: "Email sequence", icon: Mail, color: "text-ai-accent" },
];

export default function PromptForge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [context, setContext] = useState("");
  const [goal, setGoal] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!user) { toast.error("Autentifică-te pentru a genera prompturi"); return; }
    if (!context.trim() || !goal) { toast.error("Completează contextul și obiectivul"); return; }

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

      toast.success("Prompt generat cu succes!");
    } catch (e: any) {
      toast.error(e.message || "Generarea a eșuat");
    }
    setLoading(false);
  }, [user, context, goal, details]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    toast.success("Copiat în clipboard!");
  }, [result]);

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">Prompt Forge ⚒️</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Generează prompturi specializate pentru site-uri personale: extragere experiență, descrieri, produse, conținut structurat.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Obiectivul promptului</label>
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
                    {g.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Context (industrie, nișă, public-țintă)
              </label>
              <Textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Ex: Sunt consultant de marketing digital pentru startup-uri SaaS B2B. Publicul meu sunt fondatorii tehnici care au nevoie de strategie go-to-market..."
                rows={4}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Detalii suplimentare (opțional)
              </label>
              <Textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Ex: Vreau un ton prietenos dar profesional. Focus pe rezultate măsurabile..."
                rows={3}
                className="text-sm"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !context.trim() || !goal}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se generează...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generează Prompt
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Cost: 25 NEURONS per generare
            </p>
          </div>

          {/* Output panel */}
          <div className="min-h-[400px] rounded-xl border border-border bg-card p-5 overflow-y-auto max-h-[70vh]">
            {result ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Rezultat
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copyToClipboard}>
                    <Copy className="h-3 w-3" />
                    Copiază
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
                  Selectează un obiectiv și completează contextul pentru a genera un prompt
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
