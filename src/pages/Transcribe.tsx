import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { YouTubeTranscriber } from "@/components/extractor/YouTubeTranscriber";
import { TranscriptHistory } from "@/components/extractor/TranscriptHistory";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Sparkles, Zap, Shield, Globe, Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Transcribe() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <SEOHead
            title="YouTube Transcript Download — AI-IDEI"
            description="Descarcă transcrierea oricărui video YouTube instant. TXT, SRT, VTT. Prima transcriere gratuită."
          />

          {/* Hero header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight mb-2">
              YouTube → Transcript
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Lipește un link YouTube și descarcă transcrierea completă în secunde.
              <br />
              <span className="text-primary font-semibold">Prima transcriere este gratuită.</span>
            </p>
          </motion.div>

          {/* Main transcriber */}
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <YouTubeTranscriber />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border-2 border-dashed border-border bg-card p-8 text-center"
            >
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary/50" />
              </div>
              <h3 className="text-base font-semibold mb-1">Autentifică-te pentru a începe</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Creează un cont gratuit și obține prima transcriere fără cost.
              </p>
              <Button onClick={() => navigate("/auth")} className="gap-2">
                Începe gratuit <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* History */}
          {user && <TranscriptHistory />}

          {/* Features grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10"
          >
            {[
              {
                icon: Zap,
                title: "Instant",
                desc: "Subtitrările YouTube se descarcă în < 2 secunde prin fast-path.",
              },
              {
                icon: Brain,
                title: "Multi-format",
                desc: "Descarcă ca TXT, SRT sau VTT. Copiază direct în clipboard.",
              },
              {
                icon: Sparkles,
                title: "AI Extraction",
                desc: "Transformă transcrierea în neuroni de cunoștințe cu un click.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
              >
                <f.icon className="h-5 w-5 text-primary mb-2" />
                <h3 className="text-sm font-semibold mb-0.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 mt-8 py-4 border-y border-border"
          >
            {[
              { icon: Clock, label: "< 2s", desc: "Timp mediu" },
              { icon: Globe, label: "99+", desc: "Limbi suportate" },
              { icon: Shield, label: "100%", desc: "Privat & sigur" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-center">
                <s.icon className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-bold">{s.label}</p>
                  <p className="text-[9px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10"
          >
            <h2 className="text-lg font-semibold mb-4">Întrebări frecvente</h2>
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "Ce formate de export sunt disponibile?",
                  a: "Poți descărca transcrierea în TXT (text simplu), SRT (subtitrări), VTT (web video text tracks) sau PDF (format profesional cu branding). De asemenea, poți copia direct în clipboard.",
                },
                {
                  q: "Prima transcriere este cu adevărat gratuită?",
                  a: "Da! Prima transcriere este complet gratuită, fără card de credit. Transcripțiile ulterioare costă 50 NEURONS fiecare (~0.50 USD).",
                },
                {
                  q: "Cum funcționează fast-path-ul?",
                  a: "Sistemul verifică mai întâi dacă videoul YouTube are subtitrări disponibile. Dacă da, le descarcă direct în < 2 secunde. Dacă nu, folosește AI speech-to-text ca fallback.",
                },
                {
                  q: "Ce pot face cu transcrierea?",
                  a: "Pe lângă descărcare, poți extrage automat neuroni de cunoștințe, framework-uri, pattern-uri și insight-uri folosind motorul AI-IDEI de extracție. Un click → 50+ deliverables.",
                },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
