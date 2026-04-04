import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { VIPProgressTimeline } from "@/components/vip/VIPProgressTimeline";
import { useVIPTier } from "@/hooks/useVIPTier";
import { useCusnirOS } from "@/hooks/useCusnirOS";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Crown, Shield, Users, Gift, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface WarRoom {
  id: string;
  name: string;
  description: string;
  min_month: number;
  max_members: number;
}

export default function VIPDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isVIP, currentMonth, milestones, loading: vipLoading, reload } = useVIPTier();
  const { eligible: cusnirEligible, reason: cusnirReason, tokenBalance, loading: cusnirLoading } = useCusnirOS();
  const [warRooms, setWarRooms] = useState<WarRoom[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { t } = useTranslation("pages");

  useEffect(() => {
    if (!user) return;
    supabase.from("vip_war_rooms").select("*").eq("is_active", true)
      .then(({ data }) => { if (data) setWarRooms(data as WarRoom[]); });
  }, [user]);

  const handleClaim = async (milestoneId: string) => {
    if (!user) return;
    setClaimingId(milestoneId);
    try {
      const { data, error } = await supabase.rpc("claim_vip_reward", {
        _user_id: user.id,
        _milestone_id: milestoneId,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.ok) {
        toast.success(`+${result.reward_neurons} NEURONS! ${result.milestone}`);
        reload();
      } else {
        toast.error(result?.reason || "Could not claim reward");
      }
    } catch (e: any) {
      toast.error(e.message || "Claim failed");
    } finally {
      setClaimingId(null);
    }
  };

  if (authLoading || vipLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title="CusnirOS VIP — AI-IDEI" description="Programul exclusiv de 11 luni CusnirOS — acces progresiv la tot ecosistemul." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("vip.title")}</h1>
              <p className="text-micro text-muted-foreground">{t("vip.subtitle")}</p>
            </div>
            {isVIP && (
              <Badge className="ml-auto text-micro bg-primary/10 text-primary border-0">
                {t("vip.month_progress", { current: currentMonth })}
              </Badge>
            )}
          </div>

          {/* Timeline */}
          <VIPProgressTimeline />

          {/* Milestone Rewards */}
          {milestones.length > 0 && (
            <div>
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Gift className="h-3 w-3" /> Milestone Rewards
              </h2>
              <div className="grid gap-2">
                {milestones.map(m => {
                  const locked = !m.unlocked;
                  return (
                    <div key={m.id} className={cn(
                      "bg-card border border-border rounded-xl p-3 flex items-center gap-3 transition-opacity",
                      locked && "opacity-40"
                    )}>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-sm",
                        locked ? "bg-muted" : m.claimed ? "bg-primary/10" : "bg-accent"
                      )}>
                        {locked ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> :
                         m.claimed ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> :
                         <span>{m.icon || "🎯"}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{m.title}</p>
                        <p className="text-micro text-muted-foreground truncate">{m.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {m.reward_neurons > 0 && (
                          <span className="text-micro font-mono text-primary">+{m.reward_neurons}</span>
                        )}
                        {m.unlocked && !m.claimed ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-micro h-7 px-2"
                            disabled={claimingId === m.id}
                            onClick={() => handleClaim(m.id)}
                          >
                            {claimingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Claim"}
                          </Button>
                        ) : m.claimed ? (
                          <Badge variant="secondary" className="text-nano">Claimed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-nano">Luna {m.month_number}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CusnirOS Eligibility Panel */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">CusnirOS Access</h2>
            </div>
            {cusnirLoading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Verificare eligibilitate...</span>
              </div>
            ) : cusnirEligible ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Ești eligibil pentru CusnirOS!</span>
                </div>
                <p className="text-micro text-muted-foreground">
                  Ai completat cele 11 luni și deții {tokenBalance} NOTA2 tokens. Accesul CusnirOS este activ.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {cusnirReason === "NO_VIP_SUBSCRIPTION" && "Trebuie să ai un abonament VIP activ pentru CusnirOS."}
                  {cusnirReason === "INSUFFICIENT_MONTHS" && `Ai nevoie de 11 luni VIP. Progres actual: luna ${currentMonth}/11.`}
                  {cusnirReason === "NO_TOKENS" && "Trebuie să deții NOTA2 tokens pentru acces CusnirOS."}
                  {!cusnirReason && "Înscrie-te în programul VIP de 11 luni."}
                </p>
                <div className="flex items-center gap-4 text-micro text-muted-foreground">
                  <span>Luna: {currentMonth}/11</span>
                  <span>NOTA2: {tokenBalance}</span>
                </div>
              </div>
            )}
          </div>

          {/* War Rooms */}
          {warRooms.length > 0 && (
            <div>
              <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> {t("vip.war_rooms")}
              </h2>
              <div className="grid gap-3">
                {warRooms.map(wr => {
                  const locked = currentMonth < wr.min_month;
                  return (
                    <div key={wr.id} className={cn(
                      "bg-card border border-border rounded-xl p-4 transition-opacity",
                      locked && "opacity-40"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center",
                          locked ? "bg-muted" : "bg-primary/10"
                        )}>
                          <Users className={cn("h-4 w-4", locked ? "text-muted-foreground" : "text-primary")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{wr.name}</p>
                          <p className="text-micro text-muted-foreground truncate">{wr.description}</p>
                        </div>
                        {locked ? (
                          <Badge variant="outline" className="text-nano shrink-0">{t("vip.month_required", { month: wr.min_month })}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-nano shrink-0">{t("vip.access_active")}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
