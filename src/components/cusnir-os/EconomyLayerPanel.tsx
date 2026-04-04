/**
 * EconomyLayerPanel — Power Unlocks with real activation/deactivation, Marketplace, Intelligence Feed
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Zap, ShoppingBag, Eye, Lock, Unlock, Trophy, ArrowUpRight,
  Loader2, AlertCircle, Undo2, Bot,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const ALL_CAPABILITIES = [
  { key: "multi_agent", name: "Multi-Agent Orchestration", tier: "operator", xp: 500, desc: "Orchestrare paralelă a mai multor agenți AI", linkedAgent: "agent_swarm" },
  { key: "private_neurons", name: "Private Neuron Layer", tier: "operator", xp: 300, desc: "Stratul privat de neuroni pentru date sensibile", linkedAgent: null },
  { key: "funnel_auto", name: "Funnel Autogenerator", tier: "advanced", xp: 800, desc: "Generare automată de funnel-uri complete", linkedAgent: "funnel_auto" },
  { key: "pricing_intel", name: "Pricing Intelligence", tier: "advanced", xp: 600, desc: "Optimizare inteligentă a prețurilor în timp real", linkedAgent: "pricing_intel" },
  { key: "narrative_dom", name: "Narrative Domination", tier: "elite", xp: 1200, desc: "Engine de dominare narativă și poziționare", linkedAgent: "narrative_dom" },
  { key: "knowledge_arb", name: "Knowledge Arbitrage", tier: "elite", xp: 1000, desc: "Arbitraj de cunoștințe și oportunități ascunse", linkedAgent: "knowledge_arb" },
  { key: "viral_gen", name: "Viral Structure Generator", tier: "advanced", xp: 700, desc: "Generare de structuri virale optimizate", linkedAgent: "viral_gen" },
  { key: "identity_sim", name: "Identity Simulation", tier: "elite", xp: 1500, desc: "Simulare completă de identitate și comportament", linkedAgent: "identity_sim" },
];

const TIER_COLORS: Record<string, string> = {
  base: "text-muted-foreground",
  operator: "text-primary",
  advanced: "text-semantic-amber",
  elite: "text-purple-400",
};

const TIER_ORDER = ["operator", "advanced", "elite"];

interface EconomyLayerPanelProps {
  unlocks: PowerUnlock[];
  stats: SupStats | null;
  userXP: number;
  onActivate: (capKey: string, capName: string, xpCost: number, tier: string) => Promise<any>;
  onRevoke: (capKey: string) => Promise<any>;
  toggling: string | null;
}

export function EconomyLayerPanel({ unlocks, stats, userXP, onActivate, onRevoke, toggling }: EconomyLayerPanelProps) {
  const unlockedKeys = new Set(unlocks.map(u => u.capability_key));
  const [confirmAction, setConfirmAction] = useState<{ type: "activate" | "revoke"; cap: typeof ALL_CAPABILITIES[0] } | null>(null);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, cap } = confirmAction;
    setConfirmAction(null);

    if (type === "activate") {
      const result = await onActivate(cap.key, cap.name, cap.xp, cap.tier);
      if (result?.success) {
        toast.success(`${cap.name} activat!`, { description: `XP rămas: ${result.xp_remaining}` });
      } else if (result?.error === "insufficient_xp") {
        toast.error("XP insuficient", { description: `Necesită ${cap.xp} XP, ai ${result.current_xp}` });
      } else {
        toast.error("Activare eșuată", { description: result?.error || "Eroare necunoscută" });
      }
    } else {
      const result = await onRevoke(cap.key);
      if (result?.success) {
        toast.success(`${cap.name} dezactivat`, { description: `XP restituit: ${result.xp_refunded} (50%)` });
      } else {
        toast.error("Dezactivare eșuată", { description: result?.error || "Eroare necunoscută" });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* XP + Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={Zap} label="XP Disponibil" value={userXP} highlight />
        {stats && (
          <>
            <StatCard icon={Zap} label="OTOS" value={stats.total_otos} />
            <StatCard icon={ArrowUpRight} label="MMS" value={stats.total_mms} />
            <StatCard icon={Trophy} label="LCSS" value={stats.total_lcss} />
            <StatCard icon={Unlock} label="Deblocate" value={stats.unlocked_capabilities} />
          </>
        )}
      </div>

      {/* Power Unlock System */}
      {TIER_ORDER.map(tier => {
        const tierCaps = ALL_CAPABILITIES.filter(c => c.tier === tier);
        return (
          <Card key={tier}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm flex items-center gap-2 capitalize", TIER_COLORS[tier])}>
                <Zap className="h-4 w-4" /> {tier} Tier
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                {tierCaps.map((cap) => {
                  const unlocked = unlockedKeys.has(cap.key);
                  const unlock = unlocks.find(u => u.capability_key === cap.key);
                  const isToggling = toggling === cap.key;
                  const canAfford = userXP >= cap.xp;

                  return (
                    <div key={cap.key} className="px-4 py-3 flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        unlocked ? "bg-primary/10" : "bg-muted/20"
                      )}>
                        {isToggling
                          ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          : unlocked
                            ? <Unlock className="h-4 w-4 text-primary" />
                            : <Lock className="h-4 w-4 text-muted-foreground/30" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold", unlocked ? "text-foreground" : "text-muted-foreground/60")}>
                          {cap.name}
                        </p>
                        <p className="text-micro text-muted-foreground/50">{cap.desc}</p>
                        {cap.linkedAgent && (
                          <p className={cn("text-nano mt-0.5 flex items-center gap-1", unlocked ? "text-primary" : "text-muted-foreground/30")}>
                            <Bot className="h-2.5 w-2.5" />
                            Agent: {unlocked ? "Activ" : "Standby"}
                          </p>
                        )}
                        {unlocked && unlock && (
                          <p className="text-micro text-status-validated mt-0.5">
                            Activ din {format(new Date(unlock.unlocked_at), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("text-micro font-mono tabular-nums", canAfford || unlocked ? "text-muted-foreground" : "text-destructive")}>
                          {cap.xp} XP
                        </span>
                        {unlocked ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-micro text-muted-foreground hover:text-destructive"
                            disabled={isToggling}
                            onClick={() => setConfirmAction({ type: "revoke", cap })}
                          >
                            <Undo2 className="h-3 w-3 mr-1" /> Dezactivează
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-micro"
                            disabled={isToggling || !canAfford}
                            onClick={() => setConfirmAction({ type: "activate", cap })}
                          >
                            {canAfford ? "Activează" : "XP insuficient"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

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
            <Badge variant="outline" className="text-nano text-muted-foreground/30">
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
            <Badge variant="outline" className="text-nano text-muted-foreground/30">
              În Dezvoltare
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">
              {confirmAction?.type === "activate" ? "Activează Capabilitate" : "Dezactivează Capabilitate"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs space-y-2">
              {confirmAction?.type === "activate" ? (
                <>
                  <span className="block">
                    Activarea <strong>{confirmAction.cap.name}</strong> va costa <strong>{confirmAction.cap.xp} XP</strong>.
                  </span>
                  <span className="block text-muted-foreground">
                    XP disponibil: {userXP}. După activare: {userXP - confirmAction.cap.xp} XP.
                  </span>
                </>
              ) : (
                <>
                  <span className="block">
                    Dezactivarea <strong>{confirmAction?.cap.name}</strong> va restitui <strong>50%</strong> din XP ({Math.floor((confirmAction?.cap.xp || 0) / 2)} XP).
                  </span>
                  <span className="flex items-center gap-1 text-warning">
                    <AlertCircle className="h-3 w-3" /> Această acțiune nu poate fi anulată.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="text-xs">
              {confirmAction?.type === "activate" ? "Confirmă Activare" : "Confirmă Dezactivare"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: typeof Zap; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("border border-border rounded-xl p-3 space-y-1", highlight ? "bg-primary/5" : "bg-card")}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span className="text-micro font-medium">{label}</span>
      </div>
      <div className={cn("text-sm font-bold tabular-nums", highlight && "text-primary")}>{value}</div>
    </div>
  );
}
