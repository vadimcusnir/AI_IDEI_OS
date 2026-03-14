import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  UserCheck, ArrowLeft, Loader2, Copy, Sparkles, Brain
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import logo from "@/assets/logo.gif";

export default function ProfileExtractor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [products, setProducts] = useState("");
  const [tone, setTone] = useState("profesional");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    if (!user) { toast.error("Autentifică-te"); return; }
    if (!experience.trim() || !skills.trim()) { toast.error("Completează experiența și competențele"); return; }

    setLoading(true);
    setResult("");

    try {
      const { data: neuron, error: nErr } = await supabase
        .from("neurons")
        .insert({ title: "Profile Extraction", author_id: user.id, status: "draft" })
        .select("id")
        .single();

      if (nErr || !neuron) throw new Error("Failed to create neuron");

      const { data: job, error: jErr } = await supabase
        .from("neuron_jobs")
        .insert({
          neuron_id: neuron.id,
          worker_type: "profile-extractor",
          status: "pending",
          author_id: user.id,
          input: { experience, skills, products, tone },
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
            service_key: "profile-extractor",
            neuron_id: neuron.id,
            inputs: { experience, skills, products, tone },
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

      toast.success("Profile generated!");
    } catch (e: any) {
      toast.error(e.message || "Extraction failed");
    }
    setLoading(false);
  }, [user, experience, skills, products, tone]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
  }, [result]);

  const TONES = ["profesional", "prietenos", "bold", "academic", "casual"];

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold mb-2">Profile Extractor 🧬</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Introdu experiența și competențele tale. AI-ul va genera texte gata de folosit pentru pagina ta de profil: hero, bio, produse și neuroni de cunoștințe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Experiența ta *
              </label>
              <Textarea
                value={experience}
                onChange={e => setExperience(e.target.value)}
                placeholder="Ex: 8 ani în marketing digital, am condus echipe de 5+ persoane, am gestionat bugete de $500K+, am lucrat cu 30+ startup-uri SaaS..."
                rows={4}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Competențe și abilități cheie *
              </label>
              <Textarea
                value={skills}
                onChange={e => setSkills(e.target.value)}
                placeholder="Ex: Growth marketing, SEO, Content strategy, Paid ads (Meta, Google), Analytics, Team leadership, Public speaking..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Produse / Servicii oferite (opțional)
              </label>
              <Textarea
                value={products}
                onChange={e => setProducts(e.target.value)}
                placeholder="Ex: Consultanță go-to-market ($2000), Curs de growth hacking ($297), Audit SEO ($500)..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Tonul dorit
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      tone === t
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleExtract}
              disabled={loading || !experience.trim() || !skills.trim()}
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se extrage...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Extrage & Generează Profil
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground/50 text-center">
              Cost: 75 NEURONS · Include: hero, bio, produse, 5-8 neuroni extrași
            </p>
          </div>

          {/* Output */}
          <div className="min-h-[400px] rounded-xl border border-border bg-card p-5 overflow-y-auto max-h-[70vh]">
            {result ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Profilul tău generat
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
                <UserCheck className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground/50">
                  Completează formularul pentru a genera conținutul profilului tău
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
