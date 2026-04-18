import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FadeInView } from "@/components/motion/PageTransition";
import { ContentBoundary } from "@/components/layout/ContentBoundary";
import { supabase } from "@/integrations/supabase/client";
import { CountUpStat } from "@/components/landing/CountUpStat";

type Stats = { neurons: number; episodes: number; services: number; articles: number };

const FALLBACK: Stats = { neurons: 402, episodes: 46, services: 142, articles: 12 };

export function LandingProofBand() {
  const { t } = useTranslation("landing");
  const [stats, setStats] = useState<Stats>(FALLBACK);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_public_landing_stats");
      if (!error && data && !cancelled) {
        setStats(data as Stats);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const items: Array<{ value: number; label: string }> = [
    { value: stats.neurons,  label: t("proof_band.labels.neurons") },
    { value: stats.episodes, label: t("proof_band.labels.episodes") },
    { value: stats.services, label: t("proof_band.labels.services") },
    { value: stats.articles, label: t("proof_band.labels.articles") },
  ];

  return (
    <section className="border-y border-border/50 py-12 sm:py-16 bg-card/40" aria-label="Live platform metrics">
      <ContentBoundary width="default">
        <FadeInView>
          <p className="text-eyebrow font-mono tracking-[0.3em] text-gold/70 text-center mb-8">
            {t("proof_band.label")}
          </p>
        </FadeInView>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {items.map((s, i) => (
            <FadeInView key={s.label} delay={i * 0.08}>
              <CountUpStat target={s.value} label={s.label} />
            </FadeInView>
          ))}
        </div>
      </ContentBoundary>
    </section>
  );
}
