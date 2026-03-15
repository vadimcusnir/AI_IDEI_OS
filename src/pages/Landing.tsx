import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { OrganizationJsonLd, WebApplicationJsonLd, FAQJsonLd } from "@/components/seo/JsonLd";
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
import { PageTransition } from "@/components/motion/PageTransition";
import { PublicTestimonials } from "@/components/landing/PublicTestimonials";
import { Footer } from "@/components/global/Footer";
import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

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

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation("landing");
  const currentLang = LANG_OPTIONS.find(l => l.code === i18n.language) || LANG_OPTIONS[0];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const ctaAction = () => navigate(user ? "/home" : "/auth");
  const ctaLabel = user ? t("hero.cta_dashboard") : t("hero.cta_start");

  const PIPELINE = [
    { icon: Upload, label: t("pipeline.upload"), sub: t("pipeline.upload_sub"), color: "text-blue-500" },
    { icon: Brain, label: t("pipeline.extract"), sub: t("pipeline.extract_sub"), color: "text-primary" },
    { icon: Network, label: t("pipeline.connect"), sub: t("pipeline.connect_sub"), color: "text-violet-500" },
    { icon: Sparkles, label: t("pipeline.generate"), sub: t("pipeline.generate_sub"), color: "text-amber-500" },
    { icon: BarChart3, label: t("pipeline.monetize"), sub: t("pipeline.monetize_sub"), color: "text-emerald-500" },
  ];

  const CAPABILITIES = [
    { icon: Brain, title: t("capabilities.extraction_title"), description: t("capabilities.extraction_desc"), accent: "from-primary/20 to-primary/5" },
    { icon: Zap, title: t("capabilities.services_title"), description: t("capabilities.services_desc"), accent: "from-amber-500/20 to-amber-500/5" },
    { icon: Network, title: t("capabilities.graph_title"), description: t("capabilities.graph_desc"), accent: "from-violet-500/20 to-violet-500/5" },
    { icon: Shield, title: t("capabilities.economy_title"), description: t("capabilities.economy_desc"), accent: "from-emerald-500/20 to-emerald-500/5" },
  ];

  const CONTENT_TYPES = [
    { icon: Mic, label: t("problem.podcasts") },
    { icon: Users, label: t("problem.interviews") },
    { icon: BookOpen, label: t("problem.courses") },
    { icon: FileText, label: t("problem.articles") },
    { icon: Globe, label: t("problem.webinars") },
    { icon: Bot, label: t("problem.ai_conversations") },
  ];

  const DELIVERABLES = [
    t("pipeline.d_marketing"), t("pipeline.d_sales"), t("pipeline.d_social"), t("pipeline.d_course"),
    t("pipeline.d_copy"), t("pipeline.d_psych"), t("pipeline.d_jtbd"), t("pipeline.d_persuasion"),
    t("pipeline.d_narrative"), t("pipeline.d_guest"), t("pipeline.d_knowledge"), t("pipeline.d_decision"),
  ];

  const PROVEN_RESULTS = [
    { value: "11+", label: t("social_proof.categories"), icon: Layers },
    { value: "44+", label: t("social_proof.templates"), icon: FileText },
    { value: "50+", label: t("social_proof.deliverables"), icon: Sparkles },
    { value: "500", label: t("social_proof.free_credits"), icon: Gem },
  ];

  const WHO_IS_THIS_FOR = [
    { icon: Mic, title: t("use_cases.podcasters_title"), description: t("use_cases.podcasters_desc") },
    { icon: Target, title: t("use_cases.marketers_title"), description: t("use_cases.marketers_desc") },
    { icon: BookOpen, title: t("use_cases.coaches_title"), description: t("use_cases.coaches_desc") },
    { icon: TrendingUp, title: t("use_cases.founders_title"), description: t("use_cases.founders_desc") },
  ];

  const NAV_LINKS = [
    { label: t("nav.how_it_works"), to: "#pipeline" },
    { label: t("nav.capabilities"), to: "#capabilities" },
    { label: t("nav.use_cases"), to: "#use-cases" },
    { label: t("nav.docs"), to: "/docs" },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <SEOHead
        title={t("seo.title")}
        description={t("seo.description")}
        canonical="https://ai-idei-os.lovable.app"
      />

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full group-hover:shadow-lg group-hover:shadow-primary/20 transition-shadow" />
            <span className="text-base font-serif font-bold">AI-IDEI</span>
            <span className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold hidden sm:inline">
              {t("nav.knowledge_os")}
            </span>
          </button>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="Language">
                  <span className="text-sm leading-none">{currentLang.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {LANG_OPTIONS.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => i18n.changeLanguage(lang.code)}
                    className={cn("gap-2 text-xs", i18n.language === lang.code && "bg-accent")}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            {user ? (
              <Button size="sm" onClick={() => navigate("/home")} className="gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                {t("nav.dashboard")}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs">
                  {t("nav.login")}
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5">
                  {t("nav.start_free")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative overflow-hidden gradient-bg-animated noise-overlay">
        <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/[0.06] rounded-full blur-[150px] animate-float" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.04] rounded-full blur-[120px] animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-primary/[0.03] rounded-full blur-[100px]" />

        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative max-w-4xl mx-auto px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="mx-auto mb-6 sm:mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-violet-500/30 blur-2xl animate-glow-pulse" />
              <img src={logo} alt="AI-IDEI" className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-2 border-primary/20 shadow-2xl shadow-primary/30" />
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-primary mb-4 sm:mb-6">
            {t("hero.tagline")}
          </motion.p>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4 sm:mb-6 leading-[1.1] tracking-tight">
            {t("hero.title_line1")}
            <br />
            <span className="relative inline-block">
              {t("hero.title_line2")}
              <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <motion.path
                  d="M2 8C50 2 250 2 298 8"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
                />
              </svg>
            </span>
            <br />
            <span className="text-gradient-primary">{t("hero.title_line3")}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="text-sm sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            {t("hero.subtitle")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-12">
            <Button size="lg" onClick={ctaAction} className="btn-glow gap-2 text-sm px-10 h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/architecture")} className="gap-2 text-sm h-12">
              <Play className="h-4 w-4" />
              {t("hero.cta_how")}
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }} className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            {[
              { icon: CheckCircle2, text: t("hero.trust_no_card") },
              { icon: Zap, text: t("hero.trust_credits") },
              { icon: Lock, text: t("hero.trust_gdpr") },
            ].map(item => (
              <span key={item.text} className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                <item.icon className="h-3.5 w-3.5 text-status-validated" />
                {item.text}
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
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-destructive">{t("problem.label")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4 leading-tight">
                {t("problem.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t("problem.desc") }} />
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(ct => (
                  <span key={ct.label} className="flex items-center gap-1.5 text-[11px] bg-destructive/5 border border-destructive/10 px-3 py-1.5 rounded-full text-muted-foreground">
                    <ct.icon className="h-3 w-3 text-destructive/60" />
                    {ct.label}
                  </span>
                ))}
              </div>
              <p className="mt-6 text-sm text-destructive/80 font-medium italic">
                {t("problem.footnote")}
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}>
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="h-1 w-6 rounded-full bg-status-validated" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-status-validated">{t("solution.label")}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4 leading-tight">
                {t("solution.title_line1")}<br />{t("solution.title_line2")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t("solution.desc") }} />
              <div className="space-y-2">
                {[t("solution.bullet1"), t("solution.bullet2"), t("solution.bullet3"), t("solution.bullet4")].map(line => (
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
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("pipeline.label")}</span>
              <div className="h-1 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3">{t("pipeline.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("pipeline.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
            {PIPELINE.map((step, i) => (
              <motion.div key={step.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="relative flex flex-col items-center text-center group">
                <div className="h-16 w-16 rounded-2xl bg-background border border-border flex items-center justify-center mb-3 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                  <step.icon className={cn("h-7 w-7", step.color)} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{t("pipeline.step", { number: i + 1 })}</span>
                <span className="text-sm font-semibold">{step.label}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">{step.sub}</span>
                {i < PIPELINE.length - 1 && (
                  <ChevronRight className="hidden sm:block absolute -right-3 top-6 h-5 w-5 text-border" />
                )}
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={5} variants={fadeUp} className="mt-14">
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">{t("pipeline.ticker_label")}</p>
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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("capabilities.label")}</span>
            <div className="h-1 w-6 rounded-full bg-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3">
            {t("capabilities.title_line1")}<br />{t("capabilities.title_line2")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CAPABILITIES.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="relative p-6 rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
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
              <motion.div key={p.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="text-center group">
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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("use_cases.label")}</span>
            <div className="h-1 w-6 rounded-full bg-primary" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-3">{t("use_cases.title")}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t("use_cases.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {WHO_IS_THIS_FOR.map((item, i) => (
            <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="flex gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-md transition-all">
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
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("economics.label")}</span>
              <div className="h-1 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-3">{t("economics.title")}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">{t("economics.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: t("economics.cost_label"), value: t("economics.cost_value"), sub: t("economics.cost_sub") },
              { label: t("economics.deliverables_label"), value: t("economics.deliverables_value"), sub: t("economics.deliverables_sub") },
              { label: t("economics.per_label"), value: t("economics.per_value"), sub: t("economics.per_sub") },
            ].map((item, i) => (
              <motion.div key={item.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} className="text-center p-6 rounded-2xl border border-border bg-card">
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

      {/* ═══ EXPLORE KNOWLEDGE ═══ */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-1 w-6 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t("explore.label")}</span>
              <div className="h-1 w-6 rounded-full bg-primary" />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-3">{t("explore.title")}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm">{t("explore.subtitle")}</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { icon: Lightbulb, label: t("explore.insights"), sub: t("explore.insights_sub"), to: "/insights" },
              { icon: Eye, label: t("explore.patterns"), sub: t("explore.patterns_sub"), to: "/patterns" },
              { icon: Cpu, label: t("explore.formulas"), sub: t("explore.formulas_sub"), to: "/formulas" },
              { icon: Flame, label: t("explore.contradictions"), sub: t("explore.contradictions_sub"), to: "/contradictions" },
              { icon: Target, label: t("explore.applications"), sub: t("explore.applications_sub"), to: "/applications" },
              { icon: Users, label: t("explore.profiles"), sub: t("explore.profiles_sub"), to: "/profiles" },
            ].map((item, i) => (
              <motion.button key={item.label} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp} onClick={() => navigate(item.to)} className="flex flex-col items-center text-center p-4 rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-md transition-all group">
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
              {t("final_cta.title_line1")}
              <br />
              <span className="text-primary">{t("final_cta.title_line2")}</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">{t("final_cta.subtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={ctaAction} className="gap-2 px-10 h-12 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/docs")} className="gap-2 h-12">
                <BookOpen className="h-4 w-4" />
                {t("final_cta.read_docs")}
              </Button>
            </div>
            <p className="mt-6 text-[11px] text-muted-foreground">{t("final_cta.footer")}</p>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Structured Data */}
      <OrganizationJsonLd />
      <WebApplicationJsonLd />
      <FAQJsonLd items={[
        { question: "What is AI-IDEI?", answer: "AI-IDEI is an AI-driven expertise capitalization platform that transforms raw knowledge (podcasts, interviews, texts) into structured intellectual assets called Neurons." },
        { question: "How does the extraction pipeline work?", answer: "Upload content → Automatic transcription → AI-powered deep knowledge extraction → Neuron generation → Multiple deliverables. One podcast can generate 50+ professional outputs." },
        { question: "What are NEURONS credits?", answer: "NEURONS are compute credits that power service execution. 1000 credits = $10 USD. New users receive 500 free NEURONS as a welcome bonus." },
        { question: "What types of content can I upload?", answer: "You can upload YouTube videos, MP3/MP4 files, Zoom recordings, podcast transcripts, and written text. The platform supports multiple input formats." },
        { question: "What deliverables can AI-IDEI generate?", answer: "Articles, marketing frameworks, courses, copywriting formulas, scripts, social media posts, psychological profiles, marketing funnels, and many more structured knowledge outputs." },
      ]} />
    </div>
    </PageTransition>
  );
}