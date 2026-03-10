import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.gif";
import {
  Brain, Sparkles, Network, ArrowRight, Upload,
  Layers, Zap, BarChart3, ChevronRight, Play,
  Shield, Globe, CheckCircle2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const FLOW_STEPS = [
  { icon: Upload, label: "Încarci conținut", sub: "Audio, video, text, URL" },
  { icon: Brain, label: "Extragi neuroni", sub: "Idei atomice structurate" },
  { icon: Layers, label: "Construiești grafuri", sub: "Relații semantice" },
  { icon: Sparkles, label: "Rulezi servicii AI", sub: "Rezultate operaționale" },
  { icon: BarChart3, label: "Monetizezi", sub: "Active digitale reutilizabile" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Knowledge Extraction",
    description: "Transformă conversații, podcasturi și texte în unități de cunoaștere structurate — neuroni atomici cu relații semantice.",
  },
  {
    icon: Zap,
    title: "AI Services Layer",
    description: "Servicii deterministe cu costuri fixe. Fiecare serviciu are input definit, deliverables clare și execuție auditabilă.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description: "Neuronii se leagă prin relații tipizate: supports, contradicts, extends, derived_from. Grafuri de cunoaștere navigabile.",
  },
  {
    icon: Shield,
    title: "Credit Economy",
    description: "Sistem intern de credite transparent. Fiecare operație are cost vizibil. Fără surprize, fără abonamente ascunse.",
  },
];

const PROOF_ITEMS = [
  { value: "11+", label: "Categorii de conținut" },
  { value: "44+", label: "Template-uri AI" },
  { value: "5", label: "Lifecycle stages" },
  { value: "7+", label: "Servicii AI active" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full" />
            <span className="text-base font-serif font-bold">AI-IDEI</span>
            <span className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
              Knowledge OS
            </span>
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button size="sm" onClick={() => navigate("/neurons")} className="gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs">
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
                  Start gratuit
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mx-auto mb-6 h-20 w-20"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-ai-accent/30 blur-xl animate-pulse-soft" />
              <img src={logo} alt="AI-IDEI" className="relative h-20 w-20 rounded-full border-2 border-primary/20 shadow-xl shadow-primary/20" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-serif font-bold mb-4 leading-tight"
          >
            Transformă expertiza ta
            <br />
            <span className="text-primary">în active digitale</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8"
          >
            AI-IDEI extrage cunoștințe din conversații, podcasturi și texte, 
            le structurează în neuroni atomici și le transformă în produse monetizabile.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="flex items-center justify-center gap-3 flex-wrap mb-8"
          >
            {[
              { icon: Brain, label: "Knowledge Extraction" },
              { icon: Sparkles, label: "AI-Powered" },
              { icon: Network, label: "Graph Relations" },
            ].map(p => (
              <span key={p.label} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card border border-border px-3 py-1.5 rounded-full">
                <p.icon className="h-3.5 w-3.5 text-primary" />
                {p.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex items-center justify-center gap-3"
          >
            <Button size="lg" onClick={() => navigate(user ? "/neurons" : "/auth")} className="gap-2 text-sm px-8">
              {user ? "Mergi la Neuroni" : "Începe gratuit"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/architecture")} className="gap-2 text-sm">
              <Play className="h-4 w-4" />
              Cum funcționează
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problem */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="p-6 rounded-2xl border border-destructive/20 bg-destructive/5"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-3 block">Problema</span>
            <h2 className="text-xl font-serif font-bold mb-3">Internetul produce informație infinită.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Dar aproape nimic nu devine cunoaștere utilizabilă. Insight-urile dispar în podcasturi, conversații și note neorganizate.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Podcasturi", "Interviuri", "Cursuri", "Articole", "Conversații"].map(t => (
                <span key={t} className="text-[10px] bg-background border border-border px-2.5 py-1 rounded-full text-muted-foreground">{t}</span>
              ))}
            </div>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={1}
            variants={fadeUp}
            className="p-6 rounded-2xl border border-status-validated/20 bg-status-validated/5"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-status-validated mb-3 block">Soluția</span>
            <h2 className="text-xl font-serif font-bold mb-3">Extrage idei. Construiește sisteme de decizie.</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Platforma extrage idei din conversații și le transformă în structuri de cunoaștere acționabile, nu conținut generic.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Neuroni atomici", "Knowledge Graph", "Servicii AI", "Monetizare"].map(t => (
                <span key={t} className="text-[10px] bg-background border border-border px-2.5 py-1 rounded-full text-muted-foreground">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works - Flow */}
      <section className="bg-card border-y border-border">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            variants={fadeUp}
            className="text-center mb-10"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Cum funcționează</span>
            <h2 className="text-2xl font-serif font-bold">De la conținut brut la active monetizabile</h2>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
            {FLOW_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="flex items-center gap-2 flex-1"
              >
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">{step.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{step.sub}</span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 hidden sm:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Capabilități</span>
          <h2 className="text-2xl font-serif font-bold">Explorează structura ideilor, nu doar conținutul</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="p-5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="bg-card border-y border-border">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {PROOF_ITEMS.map((p, i) => (
              <motion.div
                key={p.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center"
              >
                <span className="text-3xl font-bold font-mono text-primary">{p.value}</span>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{p.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={0}
          variants={fadeUp}
        >
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ești gata să-ți transformi expertiza?
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Începe gratuit cu 500 de credite. Încarcă primul tău conținut și extrage neuroni în mai puțin de 2 minute.
          </p>
          <Button size="lg" onClick={() => navigate(user ? "/neurons" : "/auth")} className="gap-2 px-10">
            {user ? "Mergi la Neuroni" : "Creează cont gratuit"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AI-IDEI" className="h-6 w-6 rounded-full" />
            <span className="text-xs text-muted-foreground">AI-IDEI · Knowledge Operating System · {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/architecture")} className="text-xs text-muted-foreground hover:text-primary transition-colors">Docs</button>
            <button onClick={() => navigate("/links")} className="text-xs text-muted-foreground hover:text-primary transition-colors">Links</button>
            <a href="https://github.com/vadimcusnir/AI_IDEI_OS" target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
