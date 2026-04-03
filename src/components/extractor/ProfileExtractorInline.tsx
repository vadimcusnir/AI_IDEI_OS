/**
 * ProfileExtractorInline — Inline version of ProfileExtractor for the Data Input hub.
 * Extracted from src/pages/ProfileExtractor.tsx as an embeddable component.
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  UserCheck, Loader2, Copy, Sparkles, ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function ProfileExtractorInline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation("pages");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [products, setProducts] = useState("");
  const [tone, setTone] = useState("profesional");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    if (!user) { toast.error(t("profile_extractor.error_auth")); return; }
    if (!experience.trim() || !skills.trim()) { toast.error(t("profile_extractor.error_fields")); return; }

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

      toast.success("Context analizat. Gata pentru generare.");
    } catch (e: any) {
      toast.error(e.message || "Procesare eșuată");
    }
    setLoading(false);
  }, [user, experience, skills, products, tone, t]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    toast.success(t("profile_extractor.copied"));
  }, [result, t]);

  const TONES = ["profesional", "prietenos", "bold", "academic", "casual"];

  if (!user) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center">
        <UserCheck className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">Autentifică-te pentru a extrage un profil expert.</p>
        <Button onClick={() => navigate("/auth?redirect=/extractor")} className="gap-2">
          Începe gratuit <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h2 className="text-lg font-semibold mb-1">Profil Expert</h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Completează experiența, skill-urile și produsele tale. AI-ul generează un profil profesional complet.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("profile_extractor.experience_label")}
            </label>
            <Textarea
              value={experience}
              onChange={e => setExperience(e.target.value)}
              placeholder={t("profile_extractor.experience_placeholder")}
              rows={4}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("profile_extractor.skills_label")}
            </label>
            <Textarea
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder={t("profile_extractor.skills_placeholder")}
              rows={3}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("profile_extractor.products_label")}
            </label>
            <Textarea
              value={products}
              onChange={e => setProducts(e.target.value)}
              placeholder={t("profile_extractor.products_placeholder")}
              rows={3}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("profile_extractor.tone_label")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t2 => (
                <button
                  key={t2}
                  onClick={() => setTone(t2)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    tone === t2
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {t2}
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
                Se procesează...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generează Profil
              </>
            )}
          </Button>
        </div>

        {/* Output */}
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
              {/* Post-success CTA */}
              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-sm font-medium mb-2">✅ Context analizat. Gata pentru generare.</p>
                <Button onClick={() => navigate("/services")} className="gap-2">
                  Mergi la Servicii <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <UserCheck className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground/50">
                Completează câmpurile și apasă "Generează Profil"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
