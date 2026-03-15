import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { VIPProgressTimeline } from "@/components/vip/VIPProgressTimeline";
import { useVIPTier } from "@/hooks/useVIPTier";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Crown, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WarRoom {
  id: string;
  name: string;
  description: string;
  min_month: number;
  max_members: number;
}

export default function VIPDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isVIP, currentMonth, loading: vipLoading } = useVIPTier();
  const [warRooms, setWarRooms] = useState<WarRoom[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("vip_war_rooms").select("*").eq("is_active", true)
      .then(({ data }) => { if (data) setWarRooms(data as WarRoom[]); });
  }, [user]);

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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-tight">CusnirOS VIP</h1>
              <p className="text-[10px] text-muted-foreground">Programul de 11 luni — acces progresiv la ecosistem</p>
            </div>
            {isVIP && (
              <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-0">
                Luna {currentMonth}/11
              </Badge>
            )}
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <VIPProgressTimeline />
          </div>

          {/* War Rooms */}
          {warRooms.length > 0 && (
            <div>
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> War Rooms
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
                          <p className="text-[10px] text-muted-foreground truncate">{wr.description}</p>
                        </div>
                        {locked ? (
                          <Badge variant="outline" className="text-[9px] shrink-0">Luna {wr.min_month}+</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[9px] shrink-0">Acces activ</Badge>
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
