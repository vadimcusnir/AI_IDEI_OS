import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { RegistryCard, type RegistryServiceItem } from "./RegistryCard";

const DOMAIN_LABELS: Record<string, { label: string; emoji: string }> = {
  hooks: { label: "Hooks & Openers", emoji: "🎣" },
  headlines: { label: "Headlines & Titles", emoji: "📰" },
  cta: { label: "Calls to Action", emoji: "🎯" },
  copy: { label: "Copywriting & Sales", emoji: "✍️" },
  email: { label: "Email & Sequences", emoji: "📧" },
  social: { label: "Social Media", emoji: "📱" },
  strategy: { label: "Strategy & Frameworks", emoji: "🧠" },
  psychology: { label: "Psychology & Triggers", emoji: "🔬" },
  storytelling: { label: "Storytelling & Narrative", emoji: "📖" },
  content: { label: "Content & SEO", emoji: "📝" },
  video: { label: "Video & YouTube", emoji: "🎬" },
  pricing: { label: "Pricing & Revenue", emoji: "💰" },
  branding: { label: "Branding & Positioning", emoji: "🏷️" },
  leadgen: { label: "Lead Generation", emoji: "🧲" },
  systems: { label: "Systems & Automation", emoji: "⚙️" },
};

interface DomainGroupProps {
  domain: string;
  services: RegistryServiceItem[];
  defaultOpen?: boolean;
  onServiceClick: (service: RegistryServiceItem) => void;
}

export function DomainGroup({ domain, services, defaultOpen = false, onServiceClick }: DomainGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = DOMAIN_LABELS[domain] || { label: domain, emoji: "📦" };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <span className="text-base">{meta.emoji}</span>
        <span className="text-sm font-semibold flex-1 text-left">{meta.label}</span>
        <span className="text-micro font-mono text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {services.length}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1">
          {services.map(s => (
            <RegistryCard key={s.id} service={s} onClick={onServiceClick} />
          ))}
        </div>
      )}
    </div>
  );
}
