/**
 * ProfileGeneratorPanel — Inline component triggered after extraction
 * Allows users to generate an intelligence profile from an episode's neurons
 */
import { useState } from "react";
import { useProfileGenerator } from "@/hooks/useProfileGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Brain, ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  episodeId?: string;
  sourceUrl?: string;
  suggestedName?: string;
  onComplete?: (profileId: string, slug: string) => void;
  className?: string;
}

const PROFILE_TYPES = [
  { value: "public_figure", label: "Figură Publică", desc: "Personalitate publică — analiză completă" },
  { value: "local_figure", label: "Figură Locală", desc: "Expert sau lider de opinie" },
  { value: "anonymized_client", label: "Client Anonim", desc: "Profil anonimizat — PII eliminat" },
] as const;

const SOURCE_TYPES = [
  { value: "podcast", label: "Podcast" },
  { value: "interview", label: "Interviu" },
  { value: "conversation", label: "Conversație" },
] as const;

export function ProfileGeneratorPanel({ episodeId, sourceUrl, suggestedName, onComplete, className }: Props) {
  const { generate, generating, result } = useProfileGenerator();
  const [personName, setPersonName] = useState(suggestedName || "");
  const [profileType, setProfileType] = useState<"public_figure" | "local_figure" | "anonymized_client">("public_figure");
  const [sourceType, setSourceType] = useState<"podcast" | "interview" | "conversation">("podcast");

  const handleGenerate = async () => {
    if (!personName.trim()) return;
    const res = await generate({
      episode_id: episodeId,
      person_name: personName.trim(),
      profile_type: profileType,
      source_type: sourceType,
      source_ref: sourceUrl || "N/A",
    });
    if (res && onComplete) {
      onComplete(res.profile_id, res.slug);
    }
  };

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("rounded-xl border border-primary/20 bg-primary/5 p-6 text-center", className)}
      >
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
        <h3 className="text-sm font-semibold mb-1">Profil Generat</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {result.signal_count} semnale • {result.neuron_count} neuroni analizați • Status: draft
        </p>
        <div className="flex gap-2 justify-center">
          <Link to={`/media/profiles/${result.slug}`}>
            <Button size="sm" variant="outline" className="gap-1">
              <ExternalLink className="h-3 w-3" /> Preview
            </Button>
          </Link>
          <Link to="/admin/media-profiles">
            <Button size="sm" className="gap-1">
              Administrare <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-border bg-card p-5 space-y-4", className)}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Generează Profil Intelligence</h3>
          <p className="text-xs text-muted-foreground">
            Transformă neuronii extrași într-un profil comportamental structurat
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Numele persoanei analizate"
          value={personName}
          onChange={e => setPersonName(e.target.value)}
          className="text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select value={profileType} onValueChange={v => setProfileType(v as typeof profileType)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROFILE_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>
                  <div>
                    <div className="text-xs font-medium">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceType} onValueChange={v => setSourceType(v as typeof sourceType)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Profile type badges */}
        <div className="flex gap-1.5">
          {PROFILE_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setProfileType(t.value)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                profileType === t.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating || !personName.trim()}
        className="w-full gap-2"
        size="sm"
      >
        {generating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Se generează profilul...
          </>
        ) : (
          <>
            <Brain className="h-3.5 w-3.5" />
            Generează Profil
          </>
        )}
      </Button>

      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-2">
              {["Extragere semnale...", "Sinteză profil AI...", "Scrubbing PII...", "Salvare draft..."].map((step, i) => (
                <div key={step} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    generating ? "bg-primary animate-pulse" : "bg-muted"
                  )} />
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
