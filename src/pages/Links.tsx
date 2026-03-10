import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import logo from "@/assets/logo.gif";
import {
  Brain, Plus, Shield, Upload, Sparkles, Network,
  ExternalLink, ArrowRight, Zap, Globe, Play,
  BookOpen, Mail, MessageCircle, Users, Podcast,
  GraduationCap, Crown, Star, Quote, Handshake,
  Send, Radio, Newspaper, LayoutDashboard, Coins,
  ClipboardList, BarChart3, Github, DollarSign, ShoppingCart,
  Briefcase, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface LinkItem {
  title: string;
  description?: string;
  icon: React.ElementType;
  to?: string;
  href?: string;
  color: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  badge?: string;
}

interface Section {
  id: string;
  title: string;
  items: LinkItem[];
}

/* ─── Data ─── */
const HERO = {
  name: "AI-IDEI.com",
  tagline: "Knowledge Operating System — Extrage, structurează și monetizează expertiza umană prin neuroni atomici și AI.",
  pills: [
    { icon: Brain, label: "Knowledge Extraction" },
    { icon: Sparkles, label: "AI-Powered" },
    { icon: Network, label: "Graph Relations" },
  ],
};

const CTA_PRIMARY: LinkItem = {
  title: "🚀 Start aici — Creează primul Neuron",
  icon: Plus,
  to: "/n/new",
  color: "text-primary-foreground",
  requiresAuth: true,
};

const SECTIONS: Section[] = [
  {
    id: "actions",
    title: "Acțiuni principale",
    items: [
      { title: "Dashboard", description: "Monitorizează KPI-urile tale", icon: LayoutDashboard, to: "/dashboard", color: "text-primary", requiresAuth: true },
      { title: "Extractor", description: "Încarcă și ingestează conținut", icon: Upload, to: "/extractor", color: "text-status-validated", requiresAuth: true, badge: "New" },
      { title: "Service Catalog", description: "Servicii AI cu costuri fixe", icon: Sparkles, to: "/services", color: "text-ai-accent", requiresAuth: true },
      { title: "Documentație", description: "Arhitectura și API", icon: BookOpen, to: "/architecture", color: "text-muted-foreground" },
    ],
  },
  {
    id: "products",
    title: "Produse & Servicii",
    items: [
      { title: "Cursuri AI", description: "Învață să extragi cunoștințe cu AI", icon: GraduationCap, href: "#", color: "text-ai-accent", badge: "Soon" },
      { title: "Membership Premium", description: "Acces complet + credite lunare", icon: Crown, href: "#", color: "text-primary", badge: "Soon" },
      { title: "Intelligence", description: "Analiză avansată a neuronilor", icon: BarChart3, to: "/intelligence", color: "text-status-validated", requiresAuth: true },
      { title: "Credits", description: "Cumpără și gestionează credite", icon: Coins, to: "/credits", color: "text-primary", requiresAuth: true },
    ],
  },
  {
    id: "content",
    title: "Hub de Conținut",
    items: [
      { title: "YouTube", description: "Tutoriale și demo-uri KOS", icon: Play, href: "https://youtube.com/@ai-idei", color: "text-destructive" },
      { title: "Podcast", description: "Conversații despre knowledge extraction", icon: Podcast, href: "#", color: "text-primary" },
      { title: "Blog", description: "Articole și studii de caz", icon: Newspaper, href: "#", color: "text-muted-foreground", badge: "Soon" },
      { title: "Newsletter", description: "Actualizări săptămânale", icon: Mail, href: "#", color: "text-ai-accent" },
    ],
  },
  {
    id: "community",
    title: "Comunitate",
    items: [
      { title: "Discord", description: "Discuții în timp real", icon: MessageCircle, href: "#", color: "text-primary" },
      { title: "Telegram", description: "Anunțuri și updates", icon: Send, href: "#", color: "text-status-validated" },
    ],
  },
  {
    id: "admin",
    title: "Administrare",
    items: [
      { title: "Admin Dashboard", description: "Monitorizare globală", icon: Shield, to: "/admin", color: "text-destructive", requiresAdmin: true, badge: "Admin" },
      { title: "Jobs", description: "Joburi AI în procesare", icon: ClipboardList, to: "/jobs", color: "text-muted-foreground", requiresAuth: true },
    ],
  },
];

const TESTIMONIALS = [
  { quote: "AI-IDEI a transformat modul în care îmi structurez cunoștințele.", author: "Early Adopter" },
  { quote: "Cel mai intuitiv knowledge OS pe care l-am folosit.", author: "Beta Tester" },
];

const PARTNERS = ["Lovable", "Supabase"];

/* ─── Components ─── */
function HeroBlock() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-ai-accent/4 to-transparent" />
      <div className="relative max-w-lg mx-auto px-6 pt-16 pb-8 text-center">
        <div className="relative mx-auto mb-5 h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-ai-accent/20 blur-xl" />
          <img src={logo} alt="AI-IDEI" className="relative h-20 w-20 rounded-full border-2 border-primary/20 shadow-lg shadow-primary/20 object-cover" />
        </div>
        <h1 className="text-2xl font-serif font-bold mb-2">{HERO.name}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {HERO.tagline}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {HERO.pills.map(p => (
            <span key={p.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <p.icon className="h-3 w-3 text-primary" />
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTAButton({ item, onClick }: { item: LinkItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
        shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
        hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-200 mb-6"
    >
      {item.title}
    </button>
  );
}

function LinkCard({ item, onClick }: { item: LinkItem; onClick: () => void }) {
  const isExternal = !!item.href;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border bg-card
        hover:border-primary/25 hover:shadow-md hover:shadow-primary/5
        transition-all duration-200 text-left group"
    >
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
        "bg-muted group-hover:bg-primary/10 transition-colors"
      )}>
        <item.icon className={cn("h-4 w-4 transition-colors", item.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.title}</span>
          {item.badge && (
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
              item.badge === "Admin" ? "bg-destructive/10 text-destructive" :
              item.badge === "New" ? "bg-status-validated/15 text-status-validated" :
              "bg-muted text-muted-foreground"
            )}>
              {item.badge}
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
        )}
      </div>
      {isExternal ? (
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

function MonetizationBlock() {
  const MONETIZATION_ITEMS = [
    { title: "Curs: Codul Cușnir Masterclass", description: "Toate formulele de copywriting într-un singur curs", icon: GraduationCap, priceUsd: "$97", priceNeurons: "500 NEURONS", color: "text-ai-accent", badge: "Curs" },
    { title: "Consultanță AI-Powered", description: "Sesiune 1:1 de knowledge extraction cu AI", icon: Briefcase, priceUsd: "$149", priceNeurons: "750 NEURONS", color: "text-primary", badge: "Service" },
    { title: "Pachet Neuroni Premium", description: "100 neuroni structurați din conținutul tău", icon: Flame, priceUsd: "$49", priceNeurons: "250 NEURONS", color: "text-status-validated", badge: "Pachet" },
    { title: "Knowledge Audit", description: "Analiză completă a cunoștințelor tale cu raport detaliat", icon: BarChart3, priceUsd: "$199", priceNeurons: "1000 NEURONS", color: "text-destructive", badge: "Service" },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
        Monetizare
      </h2>
      <div className="space-y-2">
        {MONETIZATION_ITEMS.map((item, i) => (
          <div
            key={i}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all group cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors">
              <item.icon className={cn("h-4 w-4 transition-colors", item.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.title}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span className="text-sm font-bold text-primary">{item.priceUsd}</span>
              <span className="text-[9px] text-muted-foreground/60">{item.priceNeurons}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialProofBlock() {
  return (
    <div className="mb-8">
      <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
        Social Proof
      </h2>
      <div className="space-y-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="px-4 py-3.5 rounded-xl border border-border bg-card">
            <div className="flex gap-2 items-start">
              <Quote className="h-4 w-4 text-primary/40 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground italic leading-relaxed">"{t.quote}"</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">— {t.author}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {PARTNERS.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
          <Handshake className="h-3.5 w-3.5 text-muted-foreground/50" />
          {PARTNERS.map(p => (
            <span key={p} className="text-[10px] text-muted-foreground font-medium bg-muted/50 px-2.5 py-1 rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function Links() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();

  const handleClick = (item: LinkItem) => {
    if (item.href) window.open(item.href, "_blank", "noopener");
    else if (item.to) navigate(item.to);
  };

  const filteredSections = SECTIONS
    .map(s => ({
      ...s,
      items: s.items.filter(item => {
        if (item.requiresAdmin && !isAdmin) return false;
        if (item.requiresAuth && !user) return false;
        return true;
      }),
    }))
    .filter(s => s.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <HeroBlock />

      <div className="max-w-lg mx-auto px-6 pb-16">
        {/* Primary CTA */}
        {user && <CTAButton item={CTA_PRIMARY} onClick={() => handleClick(CTA_PRIMARY)} />}

        {/* Sections */}
        {filteredSections.map(section => (
          <div key={section.id} className="mb-8">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map(item => (
                <LinkCard key={item.title} item={item} onClick={() => handleClick(item)} />
              ))}
            </div>
          </div>
        ))}

        {/* Monetization */}
        <MonetizationBlock />

        {/* Social Proof */}
        <SocialProofBlock />

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            {[
              { icon: Github, href: "https://github.com/vadimcusnir/AI_IDEI_OS" },
              { icon: Globe, href: "https://ai-idei-os.lovable.app" },
            ].map(s => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50">
            AI-IDEI OS · Knowledge Operating System · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
