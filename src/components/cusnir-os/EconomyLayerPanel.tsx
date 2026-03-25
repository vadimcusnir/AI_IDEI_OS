/**
 * EconomyLayerPanel — Power Unlocks, Internal Marketplace preview, Intelligence Feed
 * Spec sections 7 (Game + Economy Layer)
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Zap, ShoppingBag, Eye, Lock, Unlock, Trophy, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

interface PowerUnlock {
  id: string;
  capability_key: string;
  capability_name: string;
  unlocked_at: string;
  xp_cost: number;
  tier: string;
}

interface SupStats {
  total_otos: number;
  total_mms: number;
  total_lcss: number;
  total_agents: number;
  active_agents: number;
  total_executions: number;
  total_patterns: number;
  unlocked_capabilities: number;
}

// All capabilities available for unlock
const ALL_CAPABILITIES = [
  { key: "multi_agent", name: "Multi-Agent Orchestration", tier: "operator", xp: 500 },
  { key: "private_neurons", name: "Private Neuron Layer", tier: "operator", xp: 300 },
  { key: "funnel_auto", name: "Funnel Autogenerator", tier: "advanced", xp: 800 },
  { key: "pricing_intel", name: "Pricing Intelligence", tier: "advanced", xp: 600 },
  { key: "narrative_dom", name: "Narrative Domination", tier: "elite", xp: 1200 },
  { key: "knowledge_arb", name: "Knowledge Arbitrage", tier: "elite", xp: 1000 },
  { key: "viral_gen", name: "Viral Structure Generator", tier: "advanced", xp: 700 },
  { key: "identity_sim", name: "Identity Simulation", tier: "elite", xp: 1500 },
];

const TIER_COLORS: Record<string, string> = {
  base: "text-muted-foreground",
  operator: "text-primary",
  advanced: "text-semantic-amber",
  elite: "text-purple-400",
};

interface EconomyLayerPanelProps {
  unlocks: PowerUnlock[];
  stats: SupStats | null;
}

export function EconomyLayerPanel({ unlocks, stats }: EconomyLayerPanelProps) {
  const unlockedKeys = new Set(unlocks.map(u => u.capability_key));

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Zap} label="OTOS" value={stats.total_otos} />
          <StatCard icon={ArrowUpRight} label="MMS" value={stats.total_mms} />
          <StatCard icon={Trophy} label="LCSS" value={stats.total_lcss} />
          <StatCard icon={Unlock} label="Unlocked" value={stats.unlocked_capabilities} />
        </div>
      )}

      {/* Power Unlock System */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Power Unlock System
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {ALL_CAPABILITIES.map((cap) => {
              const unlocked = unlockedKeys.has(cap.key);
              const unlock = unlocks.find(u => u.capability_key === cap.key);
              return (
                <div key={cap.key} className="px-4 py-3 flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                    unlocked ? "bg-primary/10" : "bg-muted/20"
                  )}>
                    {unlocked
                      ? <Unlock className="h-4 w-4 text-primary" />
                      : <Lock className="h-4 w-4 text-muted-foreground/30" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-xs font-semibold", unlocked ? "text-foreground" : "text-muted-foreground/50")}>
                        {cap.name}
                      </p>
                      <Badge className={cn("text-[9px]", TIER_COLORS[cap.tier] || "")}>
                        {cap.tier}
                      </Badge>
                    </div>
                    {unlocked && unlock ? (
                      <p className="text-[10px] text-muted-foreground">
                        Deblocat {format(new Date(unlock.unlocked_at), "dd MMM yyyy")}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/30">
                        Necesită {cap.xp} XP
                      </p>
                    )}
                  </div>
                  {unlocked && (
                    <Badge variant="outline" className="text-[9px] text-status-validated">
                      ACTIV
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Internal Marketplace Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" /> Internal Marketplace
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/30 p-6 text-center space-y-2">
            <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">
              Marketplace-ul intern va permite tranzacționarea de assets, sisteme și output-uri
              între operatorii Cusnir_OS.
            </p>
            <Badge variant="outline" className="text-[9px] text-muted-foreground/30">
              În Dezvoltare
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Private Intelligence Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" /> Private Intelligence Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border/30 p-6 text-center space-y-2">
            <Eye className="h-8 w-8 mx-auto text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground/50">
              Feed-ul de inteligență privată filtrează datele de sistem de înaltă valoare
              și le transformă în insight-uri acționabile exclusiv pentru operatori.
            </p>
            <Badge variant="outline" className="text-[9px] text-muted-foreground/30">
              În Dezvoltare
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Zap; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-[10px] font-medium">{label}</span>
      </div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
