import { useNavigate } from "react-router-dom";
import {
  GraduationCap, Briefcase, Flame, BarChart3, Lock, Coins, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface MonetizationItem {
  title: string;
  description: string;
  icon: React.ElementType;
  priceUsd: string;
  priceNeurons: string;
  color: string;
  badge: string;
  accessLevel: "public" | "auth" | "paid";
  link: string;
}

const MONETIZATION_ITEMS: MonetizationItem[] = [
  { title: "Curs: Codul Cușnir Masterclass", description: "Toate formulele de copywriting într-un singur curs", icon: GraduationCap, priceUsd: "$92", priceNeurons: "46,000 NEURONS", color: "text-ai-accent", badge: "Curs", accessLevel: "public", link: "/marketplace" },
  { title: "Consultanță AI-Powered", description: "Sesiune 1:1 de knowledge extraction cu AI", icon: Briefcase, priceUsd: "$146", priceNeurons: "73,000 NEURONS", color: "text-primary", badge: "Service", accessLevel: "auth", link: "/services" },
  { title: "Pachet Neuroni Premium", description: "5,500 neuroni structurați din conținutul tău", icon: Flame, priceUsd: "$11", priceNeurons: "5,500 NEURONS", color: "text-status-validated", badge: "Pachet", accessLevel: "auth", link: "/credits" },
  { title: "Knowledge Audit", description: "Analiză completă a cunoștințelor tale cu raport detaliat", icon: BarChart3, priceUsd: "$200", priceNeurons: "100,000 NEURONS", color: "text-destructive", badge: "Service", accessLevel: "paid", link: "/services" },
];

export function MonetizationBlock() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const visibleItems = MONETIZATION_ITEMS.filter(item => {
    if (item.accessLevel === "public") return true;
    if (item.accessLevel === "auth") return !!user;
    if (item.accessLevel === "paid") return !!user;
    return false;
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Monetizare
        </h2>
        <Coins className="h-3 w-3 text-muted-foreground/40" />
      </div>
      <div className="space-y-2">
        {visibleItems.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              if (!user && item.accessLevel !== "public") {
                navigate("/auth");
              } else {
                navigate(item.link);
              }
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all group cursor-pointer text-left"
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors">
              <item.icon className={cn("h-4 w-4 transition-colors", item.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{item.title}</span>
                <span className="text-nano font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
            </div>
            <div className="flex flex-col items-end shrink-0 gap-0.5">
              <span className="text-sm font-bold text-primary">{item.priceUsd}</span>
              <span className="text-nano text-muted-foreground/60">{item.priceNeurons}</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors shrink-0" />
          </button>
        ))}

        {/* Paywall hint for non-auth users */}
        {!user && (
          <button
            onClick={() => navigate("/auth")}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border bg-muted/30 text-center hover:border-primary/20 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <p className="text-dense text-muted-foreground">
              Autentifică-te pentru a vedea toate serviciile disponibile
            </p>
          </button>
        )}
      </div>
    </div>
  );
}