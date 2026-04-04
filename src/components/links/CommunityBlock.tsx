import {
  MessageCircle, Send, Users, Headphones, Hash, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityChannel {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  members?: string;
}

const CHANNELS: CommunityChannel[] = [
  {
    title: "Discord",
    description: "Discuții în timp real, Q&A, networking",
    icon: MessageCircle,
    href: "#",
    color: "text-primary",
    members: "150+",
  },
  {
    title: "Telegram",
    description: "Anunțuri rapide și updates zilnice",
    icon: Send,
    href: "#",
    color: "text-status-validated",
    members: "300+",
  },
];

export function CommunityBlock() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Comunitate
        </h2>
        <Users className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {/* Join banner */}
      <div className="px-4 py-4 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/5 to-ai-accent/5 mb-3">
        <p className="text-xs text-foreground font-medium mb-1">
          Alătură-te comunității AI-IDEI 🧠
        </p>
        <p className="text-dense text-muted-foreground leading-relaxed">
          Conectează-te cu alți knowledge builders, primește feedback pe neuronii tăi și participă la sesiuni live.
        </p>
      </div>

      <div className="space-y-2">
        {CHANNELS.map(ch => (
          <a
            key={ch.title}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border bg-card
              hover:border-primary/25 hover:shadow-md hover:shadow-primary/5
              transition-all group"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors">
              <ch.icon className={cn("h-4 w-4 transition-colors", ch.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{ch.title}</span>
                {ch.members && (
                  <span className="text-nano text-muted-foreground/50 flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {ch.members}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{ch.description}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
