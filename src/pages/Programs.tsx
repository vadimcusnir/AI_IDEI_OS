/**
 * Programs — LCSS exposed as user-facing Growth Programs.
 * Each program = long-term orchestration system with MMS pipeline steps.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, Layers, Target, Zap, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Program {
  id: string;
  name: string;
  macro_intent: string;
  description: string;
  mms_ids: string[];
  strategic_value: number;
  status: string;
}

interface MmsInfo {
  id: string;
  name: string;
  bundle_price_neurons: number;
}

const PROGRAM_ICONS: Record<string, typeof Crown> = {
  "Revenue Growth OS": Target,
  "Authority & Influence OS": Crown,
  "Content Production OS": Layers,
  "Market Dominance OS": Zap,
  "AI Operations OS": Zap,
};

export default function Programs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [mmsMap, setMmsMap] = useState<Record<string, MmsInfo>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: lcss }, { data: mms }] = await Promise.all([
        supabase.from("os_lcss").select("*").eq("status", "active").order("strategic_value", { ascending: false }),
        supabase.from("os_mms").select("id, name, bundle_price_neurons").eq("status", "active"),
      ]);

      if (lcss) setPrograms(lcss as Program[]);
      if (mms) {
        const map: Record<string, MmsInfo> = {};
        (mms as MmsInfo[]).forEach(m => { map[m.id] = m; });
        setMmsMap(map);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead
          title="Growth Programs — Long-term AI Orchestration | AI-IDEI"
          description="5 strategic growth programs with continuous execution, feedback loops, and automated optimization. Transform expertise into market dominance."
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary">
              <Crown className="h-3 w-3" /> Growth Programs
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Programe de Creștere Strategică
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Sisteme AI pe termen lung care rulează continuu, învață din rezultate și optimizează automat execuția. Fiecare program combină multiple sisteme într-un workflow strategic.
            </p>
          </div>

          {/* Programs grid */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground text-sm">Se încarcă programele...</div>
          ) : (
            <div className="space-y-4">
              {programs.map((program, i) => {
                const Icon = PROGRAM_ICONS[program.name] || Crown;
                const includedMms = (program.mms_ids || [])
                  .map(id => mmsMap[id])
                  .filter(Boolean);
                const totalCost = includedMms.reduce((sum, m) => sum + (m.bundle_price_neurons || 0), 0);

                return (
                  <motion.div
                    key={program.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold">{program.name.replace(" OS", "")}</h3>
                          <span className="text-micro px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            PROGRAM
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{program.macro_intent}</p>

                        {/* Description */}
                        {program.description && (
                          <p className="text-sm text-muted-foreground/80 mb-4">{program.description}</p>
                        )}

                        {/* Included systems */}
                        {includedMms.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="text-micro font-medium uppercase tracking-wider text-muted-foreground">
                              Include {includedMms.length} sisteme:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {includedMms.map(m => (
                                <span
                                  key={m.id}
                                  className="text-micro px-2 py-1 rounded-lg border border-border bg-muted/30 text-muted-foreground"
                                >
                                  <Layers className="h-2.5 w-2.5 inline mr-1" />
                                  {m.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-micro text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {includedMms.length} sisteme
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {totalCost > 0 ? `~${totalCost} NEURONS` : "Variabil"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Execuție continuă
                          </span>
                        </div>
                      </div>

                      {/* CTA */}
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => {
                           if (!user) {
                            navigate(`/auth?redirect=${encodeURIComponent(`/home?program=${program.id}`)}`);
                            return;
                          }
                          navigate(`/home?program=${program.id}`);
                        }}
                      >
                        Start Program
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Bottom info */}
          <div className="flex items-center justify-center gap-6 py-4 text-micro text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary/50" />
              Feedback loops automate
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary/50" />
              Monitorizare continuă
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary/50" />
              Auto-ajustare execuție
            </span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
