/**
 * ProductivityTimeline — 7-day activity heatmap for the user.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DayActivity {
  date: string;
  neurons: number;
  artifacts: number;
  services: number;
}

export function ProductivityTimeline() {
  const { user } = useAuth();
  const [days, setDays] = useState<DayActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();

      const [neurons, artifacts, jobs] = await Promise.all([
        supabase.from("neurons").select("created_at").eq("user_id", user.id).gte("created_at", since),
        supabase.from("artifacts").select("created_at").eq("author_id", user.id).gte("created_at", since),
        supabase.from("neuron_jobs").select("created_at").eq("user_id", user.id).gte("created_at", since),
      ]);

      const dayMap = new Map<string, DayActivity>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        dayMap.set(d, { date: d, neurons: 0, artifacts: 0, services: 0 });
      }

      (neurons.data || []).forEach(n => {
        const d = n.created_at.slice(0, 10);
        const entry = dayMap.get(d);
        if (entry) entry.neurons++;
      });
      (artifacts.data || []).forEach(a => {
        const d = a.created_at.slice(0, 10);
        const entry = dayMap.get(d);
        if (entry) entry.artifacts++;
      });
      (jobs.data || []).forEach(j => {
        const d = j.created_at.slice(0, 10);
        const entry = dayMap.get(d);
        if (entry) entry.services++;
      });

      setDays(Array.from(dayMap.values()));
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxTotal = Math.max(...days.map(d => d.neurons + d.artifacts + d.services), 1);

  const intensityClass = (total: number) => {
    const pct = total / maxTotal;
    if (pct === 0) return "bg-muted";
    if (pct < 0.25) return "bg-primary/20";
    if (pct < 0.5) return "bg-primary/40";
    if (pct < 0.75) return "bg-primary/60";
    return "bg-primary";
  };

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("ro-RO", { weekday: "short" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Activitate 7 zile</h3>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-3">
        {days.map(d => {
          const total = d.neurons + d.artifacts + d.services;
          return (
            <div key={d.date} className="text-center">
              <p className="text-nano text-muted-foreground mb-1">{dayLabel(d.date)}</p>
              <div
                className={cn(
                  "h-8 rounded-md flex items-center justify-center transition-colors",
                  intensityClass(total)
                )}
              >
                <span className="text-nano font-mono font-bold text-foreground">{total}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-nano text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary/20" /> Puțin
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary/60" /> Mediu
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-primary" /> Intens
        </span>
      </div>
    </motion.div>
  );
}
