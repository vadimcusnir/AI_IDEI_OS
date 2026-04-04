import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Copy, Check, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

interface GeneratedHeadline {
  title: string;
  subtitle: string;
}

export default function HeadlineGenerator() {
  const [topic, setTopic] = useState("");
  const { t } = useTranslation();
  const [audience, setAudience] = useState("");
  const [pain, setPain] = useState("");
  const [headlines, setHeadlines] = useState<GeneratedHeadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-headlines", {
        body: { topic: topic.trim(), audience: audience.trim(), pain: pain.trim() },
      });

      if (error) throw error;
      if (data?.headlines?.length > 0) {
        setHeadlines(data.headlines);
      } else {
        toast.error(t("errors:generation_failed"));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t("errors:generation_failed"));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success(t("toast_copied"));
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <SEOHead
        title="Direct Response Headlines — AI-IDEI"
        description="Generate professional Direct Response headlines with the canonical 7-layer formula. AI linguistic engine."
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs tracking-wider text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          MOTOR LINGVISTIC v1
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <span className="text-primary">Titluri</span> care repoziționează identitar
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generator de titluri Direct Response în română. Construcție în 7 straturi.
          Nu informare — <span className="text-primary font-medium">repoziționare</span>.
        </p>
      </motion.div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mb-8 space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium">Domeniu / Topic *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="ex: Productivitate, Vânzări, Fitness, AI Marketing..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Public țintă</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="ex: Antreprenori, Freelanceri, Manageri..."
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Durere primară</label>
          <textarea
            value={pain}
            onChange={(e) => setPain(e.target.value)}
            placeholder="Ce problemă principală are publicul tău? Ce simte, ce pierde, ce îl blochează?"
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            maxLength={500}
          />
        </div>

        <Button
          size="lg"
          className="w-full gap-2 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
        >
          {loading ? (
            <RotateCcw className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5" />
          )}
          {loading ? "Se generează..." : "Generează Titluri"}
        </Button>
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {headlines.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Titluri Generate
            </h2>
            {headlines.map((headline, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.12 }}
                className="group relative rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="mb-1.5 font-mono text-micro tracking-widest text-muted-foreground">
                  TITLU #{idx + 1}
                </div>
                <p className="mb-3 text-lg font-medium leading-relaxed pr-10">
                  {headline.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {headline.subtitle}
                </p>
                <button
                  onClick={() =>
                    copyToClipboard(`${headline.title}\n\n${headline.subtitle}`, idx)
                  }
                  className="absolute right-4 top-4 rounded-md border border-border p-2 text-muted-foreground opacity-0 transition-all hover:border-primary hover:text-primary group-hover:opacity-100"
                >
                  {copiedIdx === idx ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
