import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import logo from "@/assets/logo.gif";
import {
  Brain, Plus, Shield, Upload, Sparkles, Network,
  ExternalLink, ArrowRight, Globe,
  BookOpen, GraduationCap, Crown, Wand2, UserCheck,
  LayoutDashboard, Coins, Lock,
  ClipboardList, BarChart3, MessageSquare, Map,
  FileText, Layers, HelpCircle, Newspaper, Rocket,
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
  tagline: "Knowledge Operating System — Extract, structure, and capitalize human expertise through atomic neurons and AI.",
  pills: [
    { icon: Brain, label: "Knowledge Extraction" },
    { icon: Sparkles, label: "AI-Powered" },
    { icon: Network, label: "Graph Relations" },
  ],
};

const CTA_PRIMARY: LinkItem = {
  title: "🚀 Start here — Create your first Neuron",
  icon: Plus,
  to: "/n/new",
  color: "text-primary-foreground",
  accessLevel: "auth",
};

const SECTIONS: Section[] = [
  {
    id: "product",
    title: "Product",
    items: [
      { title: "Documentation", description: "Learn how AI-IDEI works — from first upload to advanced services", icon: BookOpen, to: "/docs", color: "text-primary", accessLevel: "public" },
      { title: "Architecture", description: "Technical architecture, database schema, and system design", icon: Layers, to: "/architecture", color: "text-muted-foreground", accessLevel: "public" },
      { title: "Knowledge Graph", description: "Explore how neurons connect and form intelligence networks", icon: Network, to: "/intelligence", color: "text-status-validated", accessLevel: "auth" },
      { title: "Service Catalog", description: "AI services with fixed credit costs — articles, strategies, copy", icon: Sparkles, to: "/services", color: "text-ai-accent", accessLevel: "auth" },
      { title: "Changelog", description: "Latest updates, new features, and improvements", icon: Newspaper, to: "/changelog", color: "text-muted-foreground", accessLevel: "public" },
    ],
  },
  {
    id: "platform",
    title: "Platform",
    items: [
      { title: "Dashboard", description: "Monitor your KPIs and pipeline health", icon: LayoutDashboard, to: "/dashboard", color: "text-primary", accessLevel: "auth" },
      { title: "Extractor", description: "Upload and ingest content — audio, video, text, URLs", icon: Upload, to: "/extractor", color: "text-status-validated", accessLevel: "auth", badge: "Core" },
      { title: "Neurons", description: "Browse and manage your knowledge library", icon: Brain, to: "/neurons", color: "text-primary", accessLevel: "auth" },
      { title: "Library", description: "All your generated artifacts in one place", icon: FileText, to: "/library", color: "text-muted-foreground", accessLevel: "auth" },
      { title: "Jobs", description: "Monitor AI service executions in real-time", icon: ClipboardList, to: "/jobs", color: "text-muted-foreground", accessLevel: "auth" },
      { title: "Credits", description: "Check balance, buy credits, view transaction history", icon: Coins, to: "/credits", color: "text-primary", accessLevel: "auth" },
    ],
  },
  {
    id: "tools",
    title: "Tools",
    items: [
      { title: "Profile Extractor", description: "Generate guest profiles from podcast transcripts", icon: UserCheck, to: "/profile-extractor", color: "text-primary", accessLevel: "auth", badge: "New" },
      { title: "Prompt Forge", description: "Create and test specialized AI prompts", icon: Wand2, to: "/prompt-forge", color: "text-ai-accent", accessLevel: "auth", badge: "New" },
      { title: "Onboarding", description: "Step-by-step guide to get started with the platform", icon: Rocket, to: "/onboarding", color: "text-status-validated", accessLevel: "auth" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    items: [
      { title: "Getting Started", description: "5-minute intro to using the platform", icon: Rocket, to: "/docs/getting-started/introduction", color: "text-status-validated", accessLevel: "public" },
      { title: "FAQ", description: "Answers to common questions", icon: HelpCircle, to: "/docs/reference/faq", color: "text-muted-foreground", accessLevel: "public" },
      { title: "Feedback", description: "Share ideas, report issues, suggest improvements", icon: MessageSquare, to: "/feedback", color: "text-ai-accent", accessLevel: "auth" },
    ],
  },
  {
    id: "explore",
    title: "Explore Knowledge",
    items: [
      { title: "Insights", description: "Non-obvious mechanisms extracted from content", icon: Brain, to: "/insights", color: "text-primary", accessLevel: "public" },
      { title: "Patterns", description: "Recurring cognitive and strategic structures", icon: Map, to: "/patterns", color: "text-status-validated", accessLevel: "public" },
      { title: "Formulas", description: "Actionable rules you can apply immediately", icon: Sparkles, to: "/formulas", color: "text-ai-accent", accessLevel: "public" },
      { title: "Topics", description: "Browse knowledge by subject area", icon: Globe, to: "/topics", color: "text-muted-foreground", accessLevel: "public" },
    ],
  },
  {
    id: "admin",
    title: "Administration",
    items: [
      { title: "Admin Dashboard", description: "Global monitoring and platform control", icon: Shield, to: "/admin", color: "text-destructive", accessLevel: "admin", badge: "Admin" },
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
              item.badge === "Core" ? "bg-primary/10 text-primary" :
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
      <SEOHead title="Links — AI-IDEI" description="Your AI-IDEI hub: quick links, resources, community and knowledge assets." />
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
            🔐 Sign up for free
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
      </div>
    </div>
  );
}
