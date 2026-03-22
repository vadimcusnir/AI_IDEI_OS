/**
 * Landing Page — AI-IDEI Knowledge Extraction Engine
 * Clean modular architecture. Every section is a dedicated component.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { OrganizationJsonLd, WebApplicationJsonLd, FAQJsonLd } from "@/components/seo/JsonLd";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.gif";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/motion/PageTransition";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Section components ── */
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProofBand } from "@/components/landing/LandingProofBand";
import { LandingProblem } from "@/components/landing/LandingProblem";
import { LandingMechanism } from "@/components/landing/LandingMechanism";
import { TransformationDiagram } from "@/components/landing/TransformationDiagram";
import { LandingWhatYouGet } from "@/components/landing/LandingWhatYouGet";
import { LandingOutputGalaxy } from "@/components/landing/LandingOutputGalaxy";
import { LandingControlSurface } from "@/components/landing/LandingControlSurface";
import { LandingWhoFor } from "@/components/landing/LandingWhoFor";
import { LandingWhyDifferent } from "@/components/landing/LandingWhyDifferent";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { EcosystemMap } from "@/components/landing/EcosystemMap";
import { LandingTranscribeCTA } from "@/components/landing/LandingTranscribeCTA";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFAQ, FAQ_ITEMS } from "@/components/landing/LandingFAQ";
import { LandingFinalCTA } from "@/components/landing/LandingFinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

const LANG_OPTIONS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ro", label: "Română", flag: "🇷🇴" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

const NAV_LINKS = [
  { label: "Mechanism", to: "#mechanism" },
  { label: "Outputs", to: "#outputs" },
  { label: "Control", to: "#control" },
  { label: "Access", to: "#access" },
];

/* ── Extraction Spine — recurring vertical signature ── */
function ExtractionSpine({ labels }: { labels: string[] }) {
  return (
    <div className="hidden lg:flex flex-col items-center gap-0 fixed left-6 top-1/2 -translate-y-1/2 z-40" aria-hidden="true">
      <div className="w-px h-8 bg-[hsl(var(--gold-oxide)/0.2)]" />
      {labels.map((l, i) => (
        <div key={l} className="flex flex-col items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold-oxide)/0.4)] my-1" />
          <span className="text-[7px] font-mono tracking-[0.2em] text-[hsl(var(--ivory-dim)/0.4)] -rotate-90 whitespace-nowrap origin-center" style={{ writingMode: "vertical-lr" }}>
            {l}
          </span>
          {i < labels.length - 1 && <div className="w-px h-12 bg-[hsl(var(--gold-oxide)/0.1)]" />}
        </div>
      ))}
      <div className="w-px h-8 bg-[hsl(var(--gold-oxide)/0.2)]" />
    </div>
  );
}

/* ── Scroll Progress Bar ── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[hsl(var(--gold-oxide)/0.6)] origin-left z-[60]"
      style={{ scaleX }}
    />
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const currentLang = LANG_OPTIONS.find(l => l.code === i18n.language) || LANG_OPTIONS[0];
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
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
    <div className="min-h-screen bg-[hsl(var(--obsidian))] text-[hsl(var(--ivory))] noise-overlay relative">
      <SEOHead
        title="AI-IDEI — AI Copywriting & Marketing Execution System"
        description="Turn one rough idea into persuasive copy, stronger offers, content assets, and real marketing execution with practical AI frameworks, prompts, and assistants."
        canonical="https://ai-idei-os.lovable.app"
      />

      <ScrollProgress />
      <ExtractionSpine labels={["CAPTURE", "DISTILL", "STRUCTURE", "MULTIPLY", "DEPLOY"]} />

      {/* ═══ TOP BAR ═══ */}
      <div className="border-b border-[hsl(var(--ivory-dim)/0.08)]">
        <p className="text-center text-[10px] font-mono tracking-[0.15em] text-[hsl(var(--ivory-dim)/0.5)] py-2.5 px-4">
          Turn rough ideas into copy, content, offers, and campaigns — faster.
        </p>
      </div>

      {/* ═══ NAV ═══ */}
      <header className="sticky top-0 z-50 border-b border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian)/0.92)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group shrink-0">
            <img src={logo} alt="AI-IDEI" className="h-8 w-8 rounded-full" />
            <span className="text-sm font-serif font-bold tracking-tight text-[hsl(var(--ivory))]">AI-IDEI</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.to)}
                className={cn(
                  "text-[10px] font-mono tracking-[0.12em] transition-colors relative",
                  activeSection === link.to
                    ? "text-[hsl(var(--gold-oxide))]"
                    : "text-[hsl(var(--ivory-dim)/0.5)] hover:text-[hsl(var(--gold-oxide))]"
                )}
              >
                {link.label.toUpperCase()}
                {activeSection === link.to && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-[18px] left-0 right-0 h-[2px] bg-[hsl(var(--gold-oxide))]"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--ivory-dim)/0.5)]" title="Language">
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
              <Button size="sm" onClick={() => navigate("/home")} className="gap-2 text-xs h-8 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))]">
                Dashboard
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-xs h-8 hidden sm:inline-flex text-[hsl(var(--ivory-dim)/0.6)]">
                  Log in
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")} className="gap-1.5 text-xs h-8 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))] hidden sm:inline-flex">
                  Start Free
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-8 w-8 flex items-center justify-center text-[hsl(var(--ivory-dim)/0.6)]"
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
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-[hsl(var(--ivory-dim)/0.06)] bg-[hsl(var(--obsidian)/0.98)] overflow-hidden"
            >
              <div className="px-5 py-4 space-y-1">
                {NAV_LINKS.map(link => (
                  <button
                    key={link.label}
                    onClick={() => scrollTo(link.to)}
                    className="block w-full text-left text-xs font-mono tracking-[0.1em] text-[hsl(var(--ivory-dim)/0.6)] hover:text-[hsl(var(--gold-oxide))] transition-colors py-2.5 border-b border-[hsl(var(--ivory-dim)/0.04)]"
                  >
                    {link.label.toUpperCase()}
                  </button>
                ))}
                {!user && (
                  <div className="flex gap-3 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="text-xs h-9 flex-1 text-[hsl(var(--ivory-dim)/0.6)]">
                      Log in
                    </Button>
                    <Button size="sm" onClick={() => { setMobileMenuOpen(false); navigate("/auth"); }} className="gap-1.5 text-xs h-9 flex-1 bg-[hsl(var(--gold-oxide))] hover:bg-[hsl(var(--gold-oxide)/0.85)] text-[hsl(var(--obsidian))]">
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
      <LandingHero heroRef={heroRef} heroOpacity={heroOpacity} ctaAction={ctaAction} />
      <LandingProofBand />
      <LandingProblem />
      <div className="gold-divider" />
      <LandingMechanism />
      <TransformationDiagram />
      <LandingWhatYouGet />
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
      <LandingFooter />

      <OrganizationJsonLd />
      <WebApplicationJsonLd />
      <FAQJsonLd items={FAQ_ITEMS.map(f => ({ question: f.q, answer: f.a }))} />
    </div>
    </PageTransition>
  );
}
