/**
 * Landing Page — AI-IDEI Knowledge Extraction Engine
 * Clean modular architecture. Below-the-fold sections are lazy-loaded.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLocale } from "@/hooks/useLocale";
import { SEOHead } from "@/components/SEOHead";
import { OrganizationJsonLd, WebApplicationJsonLd, FAQJsonLd } from "@/components/seo/JsonLd";
import { LLMDiscoveryMeta } from "@/components/seo/LLMDiscoveryMeta";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { useRef, useState, useCallback, useEffect, lazy, Suspense } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Above-the-fold (eager) ── */
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProofBand } from "@/components/landing/LandingProofBand";
import { LandingProblem } from "@/components/landing/LandingProblem";

/* ── Below-the-fold (lazy-loaded for smaller initial bundle) ── */
const LandingMechanism = lazy(() => import("@/components/landing/LandingMechanism").then(m => ({ default: m.LandingMechanism })));
const TransformationDiagram = lazy(() => import("@/components/landing/TransformationDiagram").then(m => ({ default: m.TransformationDiagram })));
const LandingWhatYouGet = lazy(() => import("@/components/landing/LandingWhatYouGet").then(m => ({ default: m.LandingWhatYouGet })));
const LandingOutputGalaxy = lazy(() => import("@/components/landing/LandingOutputGalaxy").then(m => ({ default: m.LandingOutputGalaxy })));
const LandingControlSurface = lazy(() => import("@/components/landing/LandingControlSurface").then(m => ({ default: m.LandingControlSurface })));
const LandingWhoFor = lazy(() => import("@/components/landing/LandingWhoFor").then(m => ({ default: m.LandingWhoFor })));
const LandingWhyDifferent = lazy(() => import("@/components/landing/LandingWhyDifferent").then(m => ({ default: m.LandingWhyDifferent })));
const LandingBenefits = lazy(() => import("@/components/landing/LandingBenefits").then(m => ({ default: m.LandingBenefits })));
const LandingSocialProof = lazy(() => import("@/components/landing/LandingSocialProof").then(m => ({ default: m.LandingSocialProof })));
const EcosystemMap = lazy(() => import("@/components/landing/EcosystemMap").then(m => ({ default: m.EcosystemMap })));
const LandingTranscribeCTA = lazy(() => import("@/components/landing/LandingTranscribeCTA").then(m => ({ default: m.LandingTranscribeCTA })));
const LandingPricing = lazy(() => import("@/components/landing/LandingPricing").then(m => ({ default: m.LandingPricing })));
const LandingFinalCTA = lazy(() => import("@/components/landing/LandingFinalCTA").then(m => ({ default: m.LandingFinalCTA })));
const LandingKnowledgeShowcase = lazy(() => import("@/components/landing/LandingKnowledgeShowcase").then(m => ({ default: m.LandingKnowledgeShowcase })));
const LandingFAQ = lazy(() => import("@/components/landing/LandingFAQ").then(m => ({ default: m.LandingFAQ })));
const Footer = lazy(() => import("@/components/global/Footer").then(m => ({ default: m.Footer })));

// FAQ items needed for JSON-LD — extracted statically to avoid loading the component
const FAQ_ITEMS = [
  { q: "What is AI-IDEI?", a: "AI-IDEI is a Knowledge Extraction OS that transforms your expertise into structured digital assets." },
  { q: "How does it work?", a: "Upload content, AI extracts atomic knowledge units (neurons), then generates professional outputs automatically." },
  { q: "Is it free?", a: "Yes, you can start free with 50 neurons. Premium plans unlock unlimited extraction and advanced features." },
];

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

const NAV_LINK_KEYS = [
  { key: "mechanism", to: "#mechanism" },
  { key: "outputs", to: "#outputs" },
  { key: "control", to: "#control" },
  { key: "access", to: "#access" },
];

/* ── Extraction Spine — recurring vertical signature ── */
function ExtractionSpine({ labels }: { labels: string[] }) {
  return (
    <div className="hidden xl:flex flex-col items-center gap-0 fixed left-8 top-1/2 -translate-y-1/2 z-40" aria-hidden="true">
      <div className="w-px h-10 bg-gold/12" />
      {labels.map((l, i) => (
        <div key={l} className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-gold/25 my-1.5" />
          <span className="text-nano font-mono tracking-[0.25em] text-ivory-dim/25 -rotate-90 whitespace-nowrap origin-center" style={{ writingMode: "vertical-lr" }}>
            {l}
          </span>
          {i < labels.length - 1 && <div className="w-px h-14 bg-gold/[0.06]" />}
        </div>
      ))}
      <div className="w-px h-10 bg-gold/12" />
    </div>
  );
}

/* ── Scroll Progress Bar ── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[hsl(var(--gold-oxide)/0.45)] origin-left z-[60]"
      style={{ scaleX }}
    />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation("landing");
  const { currentLanguage, changeLanguage } = useLocale();
  const currentLang = LANG_OPTIONS.find(l => l.code === currentLanguage) || LANG_OPTIONS[0];
  const heroRef = useRef<HTMLDivElement>(null);
  // Hero opacity fade removed — headlines and CTAs must remain stable
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const ctaAction = () => navigate(user ? "/home" : "/auth");

  const scrollTo = useCallback((selector: string) => {
    setMobileMenuOpen(false);
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Track active nav section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-80px 0px -50% 0px" }
    );

    const sections = ["mechanism", "outputs", "control", "access"].map(
      (id) => document.getElementById(id)
    );
    sections.forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <PageTransition>
    <div className="min-h-screen bg-background text-foreground noise-overlay relative">
      {/* Skip-to-content — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[hsl(var(--gold-oxide))] focus:text-[hsl(var(--obsidian))] focus:rounded-md focus:text-sm focus:font-semibold focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold-oxide))]"
      >
        Skip to content
      </a>
      <SEOHead
        title="AI-IDEI — AI Copywriting & Marketing Execution System"
        description="Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and execution agents."
        canonical="https://ai-idei.com/"
      />
      <LLMDiscoveryMeta
        pageName="Knowledge Extraction OS"
        pageDescription="Transform expertise into digital assets. Upload content once, generate dozens of professional outputs automatically. AI-powered copywriting and marketing execution system."
        capabilities={[
          "Audio/Video Transcription",
          "Knowledge Extraction",
          "AI Copywriting",
          "Marketing Execution",
          "Content Strategy",
          "Offer Creation",
          "Funnel Building",
          "Knowledge Monetization",
        ]}
      />

      <ScrollProgress />
      <ExtractionSpine labels={["CAPTURE", "DISTILL", "STRUCTURE", "MULTIPLY", "DEPLOY"]} />

      {/* ═══ TOP BAR — Marquee ═══ */}
      <div className="relative overflow-hidden bg-foreground/95 border-b border-border/50">
        <div className="flex whitespace-nowrap animate-[marquee_14s_linear_infinite] py-2.5">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="flex items-center gap-8 px-8 text-dense sm:text-xs font-mono tracking-[0.15em] text-background/90 shrink-0">
              <span className="h-1 w-1 rounded-full bg-[hsl(var(--gold-oxide))] shrink-0" />
              Turn rough ideas into copy, content, offers, and campaigns — faster.
            </span>
          ))}
        </div>
      </div>

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-2xl" role="banner">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group shrink-0 focus-ring rounded-md" aria-label="AI-IDEI home">
            <Logo size="h-7 w-7" loading="eager" />
            <span className="text-sm font-bold tracking-tight text-foreground">AI-IDEI</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-10" aria-label="Main navigation">
            {NAV_LINK_KEYS.map(link => (
              <button
                key={link.key}
                onClick={() => scrollTo(link.to)}
                className={cn(
                  "text-dense font-mono tracking-[0.12em] transition-colors relative py-1.5 focus-ring rounded-sm",
                  activeSection === link.to
                    ? "text-[hsl(var(--gold-oxide))]"
                    : "text-muted-foreground hover:text-[hsl(var(--gold-oxide))]"
                )}
              >
                {t(`nav.${link.key}`).toUpperCase()}
                {activeSection === link.to && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-[hsl(var(--gold-oxide))]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" title="Language">
                  <span className="text-sm leading-none">{currentLang.flag}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {LANG_OPTIONS.map(lang => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code as any)}
                    className={cn("gap-2 text-xs", currentLanguage === lang.code && "bg-accent")}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
            {user ? (
              <Button size="sm" onClick={() => navigate("/home")} className="gap-2 text-xs h-8 bg-gold hover:bg-gold/85 text-obsidian transition-all duration-200">
                Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs h-8 hidden sm:inline-flex text-muted-foreground">
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5 text-xs h-8 bg-gold hover:bg-gold/85 text-obsidian transition-all duration-200">
                  Start Free
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-11 w-11 flex items-center justify-center text-muted-foreground rounded-md hover:bg-accent/10 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-border/50 bg-background/98 overflow-hidden"
            >
              <div className="px-5 py-5 space-y-1">
                {NAV_LINK_KEYS.map(link => (
                  <button
                    key={link.key}
                    onClick={() => scrollTo(link.to)}
                    className="block w-full text-left text-sm font-mono tracking-[0.1em] text-muted-foreground hover:text-gold transition-colors py-3.5 min-h-[44px] flex items-center border-b border-border/30"
                  >
                    {t(`nav.${link.key}`).toUpperCase()}
                  </button>
                ))}
                {!user && (
                  <div className="flex gap-3 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="text-sm h-11 min-h-[44px] flex-1 text-muted-foreground">
                      Log in
                    </Button>
                    <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="gap-1.5 text-sm h-11 min-h-[44px] flex-1 bg-gold hover:bg-gold/85 text-obsidian">
                      Start Free
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══ SECTIONS ═══ */}
      <main id="main-content" role="main">
      <LandingHero heroRef={heroRef} ctaAction={ctaAction} />
      <LandingProofBand />
      <LandingProblem />
      <div className="gold-divider" />
      <Suspense fallback={<div className="min-h-[2400px]" />}>
        <LandingMechanism />
        <TransformationDiagram />
        <LandingWhatYouGet />
        <LandingKnowledgeShowcase />
        <LandingOutputGalaxy />
        <LandingControlSurface />
        <LandingWhoFor />
        <div className="gold-divider" />
        <LandingWhyDifferent />
        <LandingBenefits />
        <LandingSocialProof />
        <EcosystemMap />
        <LandingTranscribeCTA />
        <LandingPricing ctaAction={ctaAction} />
        <LandingFAQ />
        <LandingFinalCTA ctaAction={ctaAction} />
      </Suspense>
      </main>
      <Suspense fallback={<div className="h-64 bg-background" />}>
        <Footer variant="landing" />
      </Suspense>
      </main>
      <Footer variant="landing" />

      <OrganizationJsonLd />
      <WebApplicationJsonLd />
      <FAQJsonLd items={FAQ_ITEMS.map(f => ({ question: f.q, answer: f.a }))} />
    </div>
    </PageTransition>
  );
}
