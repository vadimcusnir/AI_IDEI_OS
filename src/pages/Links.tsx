import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import logo from "@/assets/logo.gif";
import {
  Brain, Plus, Shield, BookOpen, Link2, Github,
  FileText, Sparkles, Network, Podcast,
  ExternalLink, ArrowRight, Zap, Globe,
  BarChart3, Users, Mail, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkItem {
  title: string;
  description: string;
  icon: React.ElementType;
  to?: string;
  href?: string;
  color: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  badge?: string;
}

interface LinkSection {
  title: string;
  links: LinkItem[];
}

const SECTIONS: LinkSection[] = [
  {
    title: "Platform",
    links: [
      {
        title: "Dashboard",
        description: "Manage your neurons and knowledge assets",
        icon: Brain,
        to: "/",
        color: "text-primary",
        requiresAuth: true,
      },
      {
        title: "Create Neuron",
        description: "Start a new knowledge atom from scratch or template",
        icon: Plus,
        to: "/n/new",
        color: "text-status-validated",
        requiresAuth: true,
      },
      {
        title: "Architecture",
        description: "System design, data models and API documentation",
        icon: BookOpen,
        to: "/architecture",
        color: "text-ai-accent",
      },
      {
        title: "Admin Dashboard",
        description: "Global monitoring, stats and user management",
        icon: Shield,
        to: "/admin",
        color: "text-destructive",
        requiresAdmin: true,
        badge: "Admin",
      },
    ],
  },
  {
    title: "AI Services",
    links: [
      {
        title: "Knowledge Extraction",
        description: "Extract insights, frameworks and questions from content",
        icon: Sparkles,
        to: "/",
        color: "text-ai-accent",
        badge: "Core",
      },
      {
        title: "AI Chat",
        description: "Contextual AI assistant for every neuron",
        icon: MessageCircle,
        to: "/",
        color: "text-primary",
        badge: "Live",
      },
      {
        title: "Content Transformation",
        description: "Convert neurons into articles, threads, scripts",
        icon: Zap,
        to: "/",
        color: "text-status-published",
        badge: "Soon",
      },
      {
        title: "Graph Analysis",
        description: "Discover related neurons and idea clusters",
        icon: Network,
        to: "/",
        color: "text-graph-highlight",
        badge: "Soon",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        title: "GitHub Repository",
        description: "Source code, issues and contributions",
        icon: Github,
        href: "https://github.com/vadimcusnir/AI_IDEI_OS",
        color: "text-foreground",
      },
      {
        title: "API Documentation",
        description: "REST endpoints, schemas and authentication",
        icon: FileText,
        to: "/architecture",
        color: "text-primary",
      },
      {
        title: "Knowledge Graph",
        description: "Explore the public neuron graph",
        icon: Globe,
        to: "/",
        color: "text-status-validated",
        badge: "Soon",
      },
    ],
  },
  {
    title: "About",
    links: [
      {
        title: "AI-IDEI Concept",
        description: "Knowledge extraction and monetization platform",
        icon: Brain,
        href: "https://ai-idei-os.lovable.app/architecture",
        color: "text-ai-accent",
      },
      {
        title: "Podcast & Content",
        description: "Audio and video content about KOS",
        icon: Podcast,
        href: "#",
        color: "text-primary",
      },
    ],
  },
];

function LinkCard({ item, onClick }: { item: LinkItem; onClick: () => void }) {
  const isExternal = !!item.href;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-border bg-card
        hover:border-primary/30 hover:shadow-md hover:shadow-primary/5
        transition-all duration-200 text-left group"
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
        "bg-muted group-hover:bg-primary/10"
      )}>
        <item.icon className={cn("h-5 w-5 transition-colors", item.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium group-hover:text-primary transition-colors">
            {item.title}
          </span>
          {item.badge && (
            <span className={cn(
              "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
              item.badge === "Admin" ? "bg-destructive/10 text-destructive" :
              item.badge === "Live" ? "bg-status-validated/15 text-status-validated" :
              item.badge === "Core" ? "bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            )}>
              {item.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
      </div>
      {isExternal ? (
        <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" />
      ) : (
        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-all group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

export default function Links() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();

  const handleClick = (item: LinkItem) => {
    if (item.href) {
      window.open(item.href, "_blank", "noopener");
    } else if (item.to) {
      navigate(item.to);
    }
  };

  const filteredSections = SECTIONS.map(section => ({
    ...section,
    links: section.links.filter(link => {
      if (link.requiresAdmin && !isAdmin) return false;
      if (link.requiresAuth && !user) return false;
      return true;
    }),
  })).filter(section => section.links.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-ai-accent/3 to-transparent" />
        <div className="relative max-w-lg mx-auto px-6 pt-16 pb-10 text-center">
          <img src={logo} alt="AI-IDEI" className="h-16 w-16 mx-auto mb-5 rounded-2xl shadow-lg shadow-primary/20" />
          <h1 className="text-2xl font-serif mb-2">AI-IDEI.com</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Knowledge Operating System — Extrage, structurează și monetizează expertiza umană prin neuroni atomici și AI.
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Brain className="h-3 w-3 text-primary" />
              Knowledge Extraction
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Sparkles className="h-3 w-3 text-ai-accent" />
              AI-Powered
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Network className="h-3 w-3 text-graph-highlight" />
              Graph Relations
            </span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-lg mx-auto px-6 pb-16">
        {filteredSections.map(section => (
          <div key={section.title} className="mb-8">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.links.map(link => (
                <LinkCard key={link.title} item={link} onClick={() => handleClick(link)} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {[
              { icon: Github, href: "https://github.com/vadimcusnir/AI_IDEI_OS" },
            ].map(social => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <social.icon className="h-4 w-4" />
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
