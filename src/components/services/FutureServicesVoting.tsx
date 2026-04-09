/**
 * FutureServicesVoting — Shows upcoming services with voting.
 * Users vote once per service. Vote count updates in real-time.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Clock, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface FutureService {
  id: string;
  service_key: string;
  title: string;
  description: string;
  category: string;
  estimated_credits: number;
  status: string;
  availability_timeframe: string | null;
  vote_count: number;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-primary/15 text-primary" },
  proposed: { label: "Proposed", className: "bg-muted text-muted-foreground" },
  "under-consideration": { label: "Under Review", className: "bg-accent/50 text-accent-foreground" },
};

export function FutureServicesVoting() {
  const { user } = useAuth();
  const [services, setServices] = useState<FutureService[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("future_services")
        .select("*")
        .order("vote_count", { ascending: false });
      if (data) setServices(data as FutureService[]);

      if (user) {
        const { data: votes } = await supabase
          .from("service_votes")
          .select("future_service_id")
          .eq("user_id", user.id);
        if (votes) setUserVotes(new Set(votes.map((v: any) => v.future_service_id)));
      }
      setLoading(false);
    })();
  }, [user]);

  const toggleVote = useCallback(async (serviceId: string) => {
    if (!user) {
      toast.error("Sign in to vote");
      return;
    }
    setVoting(serviceId);
    const hasVoted = userVotes.has(serviceId);

    if (hasVoted) {
      await supabase
        .from("service_votes")
        .delete()
        .eq("user_id", user.id)
        .eq("future_service_id", serviceId);
      setUserVotes(prev => { const n = new Set(prev); n.delete(serviceId); return n; });
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, vote_count: s.vote_count - 1 } : s));
    } else {
      await supabase
        .from("service_votes")
        .insert({ user_id: user.id, future_service_id: serviceId });
      setUserVotes(prev => new Set(prev).add(serviceId));
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, vote_count: s.vote_count + 1 } : s));
    }
    setVoting(null);
  }, [user, userVotes]);

  if (loading || services.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider">Coming Soon</h3>
          <p className="text-micro text-muted-foreground">Vote to prioritize upcoming services</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((service, i) => {
          const badge = STATUS_BADGE[service.status] || STATUS_BADGE.proposed;
          const voted = userVotes.has(service.id);
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/60 bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate">{service.title}</h4>
                  <p className="text-micro text-muted-foreground line-clamp-2 mt-0.5">{service.description}</p>
                </div>
                <span className={cn("text-nano px-2 py-0.5 rounded-full font-medium shrink-0", badge.className)}>
                  {badge.label}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-micro text-muted-foreground">
                  <span className="font-mono">{service.estimated_credits}N</span>
                  {service.availability_timeframe && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {service.availability_timeframe}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-muted text-nano">{service.category}</span>
                </div>
                <Button
                  size="sm"
                  variant={voted ? "default" : "outline"}
                  className={cn("h-7 text-xs gap-1.5 min-w-[70px]", voted && "bg-primary")}
                  disabled={voting === service.id}
                  onClick={() => toggleVote(service.id)}
                >
                  {voting === service.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <ThumbsUp className={cn("h-3 w-3", voted && "fill-current")} />
                      {service.vote_count}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
