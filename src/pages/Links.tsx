import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import logo from "@/assets/logo.gif";
import {
  Brain, Plus, Shield, Upload, Sparkles, Network,
  ExternalLink, ArrowRight, Globe, Play,
  BookOpen, GraduationCap, Crown, Wand2, UserCheck,
  LayoutDashboard, Coins, Lock,
  ClipboardList, BarChart3, Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentHub } from "@/components/links/ContentHub";
import { CommunityBlock } from "@/components/links/CommunityBlock";
import { SocialProofBlock } from "@/components/links/SocialProofBlock";
import { MonetizationBlock } from "@/components/links/MonetizationBlock";
import { FavoritesBlock } from "@/components/links/FavoritesBlock";
import { PopularNeuronsBlock, RecommendedTemplatesBlock, LatestVersionsBlock } from "@/components/links/DynamicSections";
import { LiveStatsBlock } from "@/components/links/LiveStatsBlock";


/* ─── Types ─── */
interface LinkItem {
  title: string;
  description?: string;
  icon: React.ElementType;
  to?: string;
  href?: string;
  color: string;
  accessLevel: "public" | "auth" | "paid" | "admin";
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
  accessLevel: "auth",
};

const SECTIONS: Section[] = [
  {
    id: "actions",
    title: "Acțiuni principale",
    items: [
      { title: "Dashboard", description: "Monitorizează KPI-urile tale", icon: LayoutDashboard, to: "/dashboard", color: "text-primary", accessLevel: "auth" },
      { title: "Extractor", description: "Încarcă și ingestează conținut", icon: Upload, to: "/extractor", color: "text-status-validated", accessLevel: "auth", badge: "New" },
      { title: "Service Catalog", description: "Servicii AI cu costuri fixe", icon: Sparkles, to: "/services", color: "text-ai-accent", accessLevel: "auth" },
      { title: "Profile Extractor", description: "Generează conținut pentru profilul tău", icon: UserCheck, to: "/profile-extractor", color: "text-primary", accessLevel: "auth", badge: "New" },
      { title: "Prompt Forge", description: "Creează prompturi specializate", icon: Wand2, to: "/prompt-forge", color: "text-ai-accent", accessLevel: "auth", badge: "New" },
      { title: "Documentație", description: "Arhitectura și API", icon: BookOpen, to: "/architecture", color: "text-muted-foreground", accessLevel: "public" },
    ],
  },
  {
    id: "products",
    title: "Produse & Servicii",
    items: [
      { title: "Cursuri AI", description: "Învață să extragi cunoștințe cu AI", icon: GraduationCap, href: "#", color: "text-ai-accent", badge: "Soon", accessLevel: "public" },
      { title: "Membership Premium", description: "Acces complet + credite lunare", icon: Crown, href: "#", color: "text-primary", badge: "Soon", accessLevel: "public" },
      { title: "Intelligence", description: "Analiză avansată a neuronilor", icon: BarChart3, to: "/intelligence", color: "text-status-validated", accessLevel: "auth" },
      { title: "Credits", description: "Cumpără și gestionează credite", icon: Coins, to: "/credits", color: "text-primary", accessLevel: "auth" },
    ],
  },
  {
    id: "admin",
    title: "Administrare",
    items: [
      { title: "Admin Dashboard", description: "Monitorizare globală", icon: Shield, to: "/admin", color: "text-destructive", accessLevel: "admin", badge: "Admin" },
      { title: "Jobs", description: "Joburi AI în procesare", icon: ClipboardList, to: "/jobs", color: "text-muted-foreground", accessLevel: "auth" },
    ],
  },
];

/* ─── Access Engine ─── */
function resolveAccess(
  level: "public" | "auth" | "paid" | "admin",
  user: any,
  isAdmin: boolean,
): "allow" | "paywall" | "hidden" {
  if (level === "public") return "allow";
  if (level === "admin") return isAdmin ? "allow" : "hidden";
  if (level === "auth") return user ? "allow" : "paywall";
  if (level === "paid") return user ? "allow" : "paywall";
  return "hidden";
}

/* ─── Sub-components ─── */
function HeroBlock() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-ai-accent/4 to-transparent" />
      <div className="relative max-w-lg mx-auto px-6 pt-10 pb-6 text-center">
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

function LinkCard({ item, onClick, locked }: { item: LinkItem; onClick: () => void; locked?: boolean }) {
  const isExternal = !!item.href;
  return (
    <button
      onClick={locked ? undefined : onClick}
      className={cn(
        "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border bg-card transition-all duration-200 text-left group",
        locked
          ? "border-dashed border-border opacity-60 cursor-default"
          : "border-border hover:border-primary/25 hover:shadow-md hover:shadow-primary/5"
      )}
    >
      <div className={cn(
        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
        "bg-muted group-hover:bg-primary/10 transition-colors"
      )}>
        {locked
          ? <Lock className="h-4 w-4 text-muted-foreground/50" />
          : <item.icon className={cn("h-4 w-4 transition-colors", item.color)} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium transition-colors",
            locked ? "text-muted-foreground" : "group-hover:text-primary"
          )}>
            {item.title}
          </span>
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
          {locked && (
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              Login
            </span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
        )}
      </div>
      {!locked && (
        isExternal ? (
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0" />
        ) : (
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-transform group-hover:translate-x-0.5" />
        )
      )}
    </button>
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

  const processedSections = SECTIONS
    .map(s => ({
      ...s,
      items: s.items.map(item => ({
        ...item,
        _access: resolveAccess(item.accessLevel, user, isAdmin),
      })).filter(item => item._access !== "hidden"),
    }))
    .filter(s => s.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <HeroBlock />

      <div className="max-w-lg mx-auto px-6 pb-16">
        {/* Primary CTA */}
        {user ? (
          <CTAButton item={CTA_PRIMARY} onClick={() => handleClick(CTA_PRIMARY)} />
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
              shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
              hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200 mb-6"
          >
            🔐 Înregistrează-te gratuit
          </button>
        )}

        {/* Live Stats */}
        <LiveStatsBlock />

        {/* Sections with role-based access */}
        {processedSections.map(section => (
          <div key={section.id} className="mb-8">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map(item => (
                <LinkCard
                  key={item.title}
                  item={item}
                  locked={item._access === "paywall"}
                  onClick={() => item._access === "paywall" ? navigate("/auth") : handleClick(item)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Favorites (auth only) */}
        <FavoritesBlock />

        {/* Dynamic sections */}
        <PopularNeuronsBlock />
        <RecommendedTemplatesBlock />
        <LatestVersionsBlock />

        {/* Content Hub */}
        <ContentHub />

        {/* Monetization */}
        <MonetizationBlock />

        {/* Community */}
        <CommunityBlock />

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
