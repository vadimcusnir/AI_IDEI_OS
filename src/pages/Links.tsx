import { SEOHead } from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Logo } from "@/components/shared/Logo";
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
import { useTranslation } from "react-i18next";

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
function HeroBlock({ t }: { t: (k: string) => string }) {
  const pills = [
    { icon: Brain, label: t("links.knowledge_extraction") },
    { icon: Sparkles, label: t("links.ai_powered") },
    { icon: Network, label: t("links.graph_relations") },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-ai-accent/4 to-transparent" />
      <div className="relative max-w-lg mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-6 text-center">
        <div className="relative mx-auto mb-5 h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-ai-accent/20 blur-xl" />
          <Logo animated size="h-20 w-20" className="relative border-2 border-primary/20 shadow-lg shadow-primary/20 object-cover" loading="eager" />
        </div>
        <h1 className="text-2xl font-bold mb-2">AI-IDEI.com</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          {t("links.tagline")}
        </p>
        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          {pills.map(p => (
            <span key={p.label} className="flex items-center gap-1.5 text-micro text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <p.icon className="h-3 w-3 text-primary" />
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CTAButton({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
        shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30
        hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-200 mb-6"
    >
      {title}
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
              "text-nano font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
              item.badge === "Admin" ? "bg-destructive/10 text-destructive" :
              item.badge === "New" ? "bg-status-validated/15 text-status-validated" :
              item.badge === "Core" ? "bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            )}>
              {item.badge}
            </span>
          )}
          {locked && (
            <span className="text-nano font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
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
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();

  const SECTIONS: Section[] = [
    {
      id: "product",
      title: t("links.section_product"),
      items: [
        { title: t("links.doc_title"), description: t("links.doc_desc"), icon: BookOpen, to: "/docs", color: "text-primary", accessLevel: "public" },
        { title: t("links.arch_title"), description: t("links.arch_desc"), icon: Layers, to: "/architecture", color: "text-muted-foreground", accessLevel: "public" },
        { title: t("links.kg_title"), description: t("links.kg_desc"), icon: Network, to: "/intelligence", color: "text-status-validated", accessLevel: "auth" },
        { title: t("links.services_title"), description: t("links.services_desc"), icon: Sparkles, to: "/services", color: "text-ai-accent", accessLevel: "auth" },
        { title: t("links.changelog_title"), description: t("links.changelog_desc"), icon: Newspaper, to: "/changelog", color: "text-muted-foreground", accessLevel: "public" },
      ],
    },
    {
      id: "platform",
      title: t("links.section_platform"),
      items: [
        { title: t("links.dashboard_title"), description: t("links.dashboard_desc"), icon: LayoutDashboard, to: "/dashboard", color: "text-primary", accessLevel: "auth" },
        { title: t("links.extractor_title"), description: t("links.extractor_desc"), icon: Upload, to: "/extractor", color: "text-status-validated", accessLevel: "auth", badge: "Core" },
        { title: t("links.neurons_title"), description: t("links.neurons_desc"), icon: Brain, to: "/neurons", color: "text-primary", accessLevel: "auth" },
        { title: t("links.library_title"), description: t("links.library_desc"), icon: FileText, to: "/library", color: "text-muted-foreground", accessLevel: "auth" },
        { title: t("links.jobs_title"), description: t("links.jobs_desc"), icon: ClipboardList, to: "/jobs", color: "text-muted-foreground", accessLevel: "auth" },
        { title: t("links.credits_title"), description: t("links.credits_desc"), icon: Coins, to: "/credits", color: "text-primary", accessLevel: "auth" },
      ],
    },
    {
      id: "tools",
      title: t("links.section_tools"),
      items: [
        { title: t("links.profile_extractor_title"), description: t("links.profile_extractor_desc"), icon: UserCheck, to: "/profile-extractor", color: "text-primary", accessLevel: "auth", badge: "New" },
        { title: t("links.prompt_forge_title"), description: t("links.prompt_forge_desc"), icon: Wand2, to: "/prompt-forge", color: "text-ai-accent", accessLevel: "auth", badge: "New" },
        { title: t("links.onboarding_title"), description: t("links.onboarding_desc"), icon: Rocket, to: "/onboarding", color: "text-status-validated", accessLevel: "auth" },
      ],
    },
    {
      id: "resources",
      title: t("links.section_resources"),
      items: [
        { title: t("links.getting_started_title"), description: t("links.getting_started_desc"), icon: Rocket, to: "/docs/getting-started/introduction", color: "text-status-validated", accessLevel: "public" },
        { title: t("links.faq_title"), description: t("links.faq_desc"), icon: HelpCircle, to: "/docs/reference/faq", color: "text-muted-foreground", accessLevel: "public" },
        { title: t("links.feedback_title"), description: t("links.feedback_desc"), icon: MessageSquare, to: "/feedback", color: "text-ai-accent", accessLevel: "auth" },
      ],
    },
    {
      id: "explore",
      title: t("links.section_explore"),
      items: [
        { title: t("links.insights_title"), description: t("links.insights_desc"), icon: Brain, to: "/library", color: "text-primary", accessLevel: "public" },
        { title: t("links.patterns_title"), description: t("links.patterns_desc"), icon: Map, to: "/library", color: "text-status-validated", accessLevel: "public" },
        { title: t("links.formulas_title"), description: t("links.formulas_desc"), icon: Sparkles, to: "/library", color: "text-ai-accent", accessLevel: "public" },
        { title: t("links.topics_title"), description: t("links.topics_desc"), icon: Globe, to: "/topics", color: "text-muted-foreground", accessLevel: "public" },
      ],
    },
    {
      id: "admin",
      title: t("links.section_admin"),
      items: [
        { title: t("links.admin_title"), description: t("links.admin_desc"), icon: Shield, to: "/admin", color: "text-destructive", accessLevel: "admin", badge: "Admin" },
      ],
    },
  ];

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
      <SEOHead title={t("links.seo_title")} description={t("links.seo_desc")} />
      <HeroBlock t={t} />

      <div className="max-w-lg mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        {/* Primary CTA */}
        {user ? (
          <CTAButton title={`🚀 ${t("links.cta_start")}`} onClick={() => navigate("/n/new")} />
        ) : (
          <CTAButton title={`🔐 ${t("links.cta_signup")}`} onClick={() => navigate("/auth")} />
        )}

        {/* Live Stats */}
        <LiveStatsBlock />

        {/* Sections with role-based access */}
        {processedSections.map(section => (
          <div key={section.id} className="mb-8">
            <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
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
