import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.gif";
import {
  Brain, Sparkles, Network, ArrowRight, Upload,
  Layers, Zap, BarChart3, ChevronRight, Play,
  Shield, Globe, CheckCircle2, Users, Lightbulb,
  FileText, Bot, TrendingUp, Mic, BookOpen,
  Target, Cpu, Gem, Flame, Eye, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { PublicTestimonials } from "@/components/landing/PublicTestimonials";
import { Footer } from "@/components/global/Footer";
import { useRef } from "react";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ─── Data ─── */
const PIPELINE = [
  { icon: Upload, label: "Upload", sub: "Audio · Video · Text · URL", color: "text-blue-500" },
  { icon: Brain, label: "Extract", sub: "Atomic neurons", color: "text-primary" },
  { icon: Network, label: "Connect", sub: "Knowledge graph", color: "text-violet-500" },
  { icon: Sparkles, label: "Generate", sub: "50+ deliverables", color: "text-amber-500" },
  { icon: BarChart3, label: "Monetize", sub: "Infinite reuse", color: "text-emerald-500" },
];

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Knowledge Extraction Engine",
    description: "Turns conversations into structured atomic ideas — frameworks, patterns, formulas, psychological signals. Not summaries. Structures.",
    accent: "from-primary/20 to-primary/5",
  },
  {
    icon: Zap,
    title: "Deterministic AI Services",
    description: "Fixed cost. Clear deliverables. Every service has defined input, auditable execution, and predictable output. No tokens burned guessing.",
    accent: "from-amber-500/20 to-amber-500/5",
  },
  {
    icon: Network,
    title: "Living Knowledge Graph",
    description: "Neurons connect through typed relations: supports, contradicts, extends, derived_from. Your expertise becomes navigable architecture.",
    accent: "from-violet-500/20 to-violet-500/5",
  },
  {
    icon: Shield,
    title: "Transparent Credit Economy",
    description: "Every operation has a visible cost in NEURONS. No subscriptions. No surprises. You see exactly what you pay — down to 0.01 USD.",
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
];

const CONTENT_TYPES = [
  { icon: Mic, label: "Podcasts" },
  { icon: Users, label: "Interviews" },
  { icon: BookOpen, label: "Courses" },
  { icon: FileText, label: "Articles" },
  { icon: Globe, label: "Webinars" },
  { icon: Bot, label: "AI Conversations" },
];

const DELIVERABLES = [
  "Marketing frameworks", "Sales scripts", "Social media posts", "Course outlines",
  "Copywriting formulas", "Psychological profiles", "JTBD patterns", "Persuasion frameworks",
  "Narrative structures", "Guest profiles", "Knowledge reports", "Decision models",
];

const PROVEN_RESULTS = [
  { value: "11+", label: "Content categories", icon: Layers },
  { value: "44+", label: "AI templates", icon: FileText },
  { value: "50+", label: "Deliverables per run", icon: Sparkles },
  { value: "500", label: "Free credits on signup", icon: Gem },
];

const WHO_IS_THIS_FOR = [
  { icon: Mic, title: "Podcasters & Creators", description: "Turn every episode into a library of reusable frameworks, guest profiles, and content assets." },
  { icon: Target, title: "Marketers & Consultants", description: "Extract decision patterns from client conversations. Generate campaigns from real buyer psychology." },
  { icon: BookOpen, title: "Coaches & Educators", description: "Transform your methodology into structured courses, frameworks, and sellable knowledge products." },
  { icon: TrendingUp, title: "Founders & Researchers", description: "Build a compounding knowledge base from market conversations, interviews, and field research." },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const ctaAction = () => navigate(user ? "/home" : "/auth");
  const ctaLabel = user ? "Go to Dashboard" : "Start Free — 500 Credits";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="AI-IDEI — Knowledge Extraction Operating System"
        description="Transform expertise into digital assets. Upload content once, generate dozens of professional outputs automatically. The magic marketing button."
        canonical="https://ai-idei-os.lovable.app"
      />

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow" />
            <span className="text-base font-serif font-bold">AI-IDEI</span>
            <span className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
              Knowledge OS
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "How It Works", to: "#pipeline" },
              { label: "Capabilities", to: "#capabilities" },
              { label: "Use Cases", to: "#use-cases" },
              { label: "Docs", to: "/docs" },
            ].map(link => (
              <button
                key={link.label}
                onClick={() => link.to.startsWith("#") ? document.querySelector(link.to)?.scrollIntoView({ behavior: "smooth" }) : navigate(link.to)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button size="sm" onClick={() => navigate("/home")} className="gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs">
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
                  Start Free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[150px]" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.04] rounded-full blur-[120px]" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mx-auto mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-violet-500/30 blur-2xl animate-pulse" style={{ animationDuration: "3s" }} />
              <img src={logo} alt="AI-IDEI" className="relative h-24 w-24 rounded-full border-2 border-primary/20 shadow-2xl shadow-primary/30" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-6"
          >
            Knowledge Extraction Operating System
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-6 leading-[1.1] tracking-tight"
          >
            Your expertise disappears
            <br />
            <span className="relative">
              in conversations.
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8C50 2 250 2 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              </svg>
            </span>
            <br />
            <span className="text-primary">We extract it forever.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Upload one podcast. Get 50+ professional outputs — articles, frameworks, scripts, 
            courses, psychological profiles, marketing funnels. Automatically. Every time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Button size="lg" onClick={ctaAction} className="gap-2 text-sm px-10 h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/architecture")} className="gap-2 text-sm h-12">
              <Play className="h-4 w-4" />
              See How It Works
            </Button>
          </motion.div>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            {[
              { icon: CheckCircle2, text: "No credit card required" },
              { icon: Zap, text: "500 free credits" },
              { icon: Lock, text: "GDPR compliant" },
            ].map(t => (
              <span key={t.text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <t.icon className="h-3.5 w-3.5 text-status-validated" />
                {t.text}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section className="relative border-y border-border">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-1 w-6 rounded-full bg-destructive" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">The Problem</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4 leading-tight">
                The internet produces infinite information.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                But almost none of it becomes <strong className="text-foreground">usable knowledge</strong>. 
                Insights disappear in podcast episodes, client calls, interviews, and unstructured notes. 
                You repeat yourself. You forget what you said. You can't find that one framework you explained brilliantly… three months ago.
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(t => (
                  <span key={t.label} className="flex items-center gap-1.5 text-[11px] bg-destructive/5 border border-destructive/10 px-3 py-1.5 rounded-full text-muted-foreground">
                    <t.icon className="h-3 w-3 text-destructive/60" />
                    {t.label}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm text-destructive/80 font-medium italic">
                Most insights disappear. Forever.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-1 w-6 rounded-full bg-status-validated" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-status-validated">The Solution</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4 leading-tight">
                Extract ideas.<br />Build decision systems.
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                AI-IDEI doesn't summarize. It <strong className="text-foreground">structures</strong>. Every conversation becomes atomic knowledge units — neurons — 
                connected through semantic relations into a navigable graph of your expertise. Then it generates products from that graph. Automatically.
              </p>
              <div className="space-y-2">
                {["Upload once → generate forever", "Atomic ideas, not vague summaries", "50+ deliverables per content piece", "Knowledge compounds over time"].map(line => (
                  <div key={line} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-status-validated shrink-0" />
                    <span className="text-sm text-foreground">{line}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ PIPELINE ═══ */}
      <section id="pipeline" className="bg-card">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-1 w-6 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">How It Works</span>
              <div className="h-1 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3">From Raw Content to Monetizable Assets</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Five deterministic steps. No guessing. No prompt engineering. Press the button.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
            {PIPELINE.map((step, i) => (
              <motion.div
                key={step.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="h-16 w-16 rounded-2xl bg-background border border-border flex items-center justify-center mb-3 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                  <step.icon className={cn("h-7 w-7", step.color)} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Step {i + 1}</span>
                <span className="text-sm font-semibold">{step.label}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{step.sub}</span>
                {i < PIPELINE.length - 1 && (
                  <ChevronRight className="hidden sm:block absolute -right-3 top-6 h-5 w-5 text-border" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Deliverables ticker */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={5} variants={fadeUp} className="mt-14">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">One upload generates</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DELIVERABLES.map(d => (
                <span key={d} className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-background text-muted-foreground hover:border-primary/20 hover:text-foreground transition-all cursor-default">
                  {d}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ CAPABILITIES ═══ */}
      <section id="capabilities" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-1 w-6 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Capabilities</span>
            <div className="h-1 w-6 rounded-full bg-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
            Explore the Structure of Ideas,<br />Not Just the Content Around Them
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CAPABILITIES.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="relative p-6 rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", f.accent)} />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {PROVEN_RESULTS.map((p, i) => (
              <motion.div
                key={p.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-3xl sm:text-4xl font-bold font-mono text-primary block">{p.value}</span>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">{p.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section id="use-cases" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-1 w-6 rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Who Is This For</span>
            <div className="h-1 w-6 rounded-full bg-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
            Built for People Who Create Knowledge
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            If you speak, write, teach, or consult — your expertise is leaking. We capture it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WHO_IS_THIS_FOR.map((item, i) => (
            <motion.div
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
              variants={fadeUp}
              className="flex gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ ECONOMICS STRIP ═══ */}
      <section className="border-y border-border bg-gradient-to-r from-primary/[0.03] via-transparent to-violet-500/[0.03]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-1 w-6 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">The Economics</span>
              <div className="h-1 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-3">
              The Real Margin Comes From Reuse
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">
              A framework extracted once can be reused 10,000 times. That's not a subscription — that's a knowledge multiplication engine.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Cost per extraction", value: "~$0.35", sub: "35 NEURONS credits" },
              { label: "Deliverables generated", value: "50+", sub: "Per content piece" },
              { label: "Cost per deliverable", value: "$0.007", sub: "Seven thousandths" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center p-6 rounded-2xl border border-border bg-card"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{item.label}</p>
                <p className="text-3xl font-mono font-bold text-primary">{item.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <PublicTestimonials />

      {/* ═══ EXPLORE KNOWLEDGE (like cusnirvadim.com) ═══ */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-1 w-6 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Explore Knowledge</span>
              <div className="h-1 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-3">Navigate the Structure of Ideas</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">Public knowledge infrastructure — browse insights, patterns, and frameworks extracted by the platform.</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Lightbulb, label: "Insights", sub: "Structured ideas", to: "/insights" },
              { icon: Eye, label: "Patterns", sub: "Behavior models", to: "/patterns" },
              { icon: Cpu, label: "Formulas", sub: "Conversion tools", to: "/formulas" },
              { icon: Flame, label: "Contradictions", sub: "Tension maps", to: "/contradictions" },
              { icon: Target, label: "Applications", sub: "Use cases", to: "/applications" },
              { icon: Users, label: "Profiles", sub: "Expert maps", to: "/profiles" },
            ].map((item, i) => (
              <motion.button
                key={item.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                onClick={() => navigate(item.to)}
                className="flex flex-col items-center text-center p-4 rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-semibold">{item.label}</span>
                <span className="text-[10px] text-muted-foreground">{item.sub}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.04] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.06] rounded-full blur-[150px]" />

        <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4 leading-tight">
              Stop Losing Your Best Ideas.
              <br />
              <span className="text-primary">Start Extracting Them.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Create your free account. Get 500 NEURONS credits. Upload your first content and watch the magic happen — in under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={ctaAction} className="gap-2 px-10 h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/docs")} className="gap-2 h-12">
                <BookOpen className="h-4 w-4" />
                Read the Docs
              </Button>
            </div>
            <p className="mt-6 text-[11px] text-muted-foreground">
              No credit card • No commitment • GDPR compliant
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <Footer />
    </div>
  );
}
