import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WhatsNewWidget } from "@/components/home/WhatsNewWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Upload, Brain, Sparkles, Briefcase, Coins, ArrowRight,
  Loader2, Clock, Zap, TrendingUp, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentNeuron {
  id: number;
  number: number;
  title: string;
  status: string;
  updated_at: string;
}

interface RecentJob {
  id: string;
  worker_type: string;
  status: string;
  created_at: string;
}

const QUICK_ACTIONS = [
  { label: "Încarcă conținut", icon: Upload, path: "/extractor", color: "text-primary" },
  { label: "Neuron nou", icon: Plus, path: "/n/new", color: "text-primary" },
  { label: "Rulează serviciu", icon: Sparkles, path: "/services", color: "text-primary" },
  { label: "Vezi joburi", icon: Briefcase, path: "/jobs", color: "text-primary" },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const [neurons, setNeurons] = useState<RecentNeuron[]>([]);
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [stats, setStats] = useState({ neurons: 0, episodes: 0, jobs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    const [neuronsRes, jobsRes, episodesRes] = await Promise.all([
      supabase.from("neurons").select("id, number, title, status, updated_at")
        .eq("author_id", user!.id).order("updated_at", { ascending: false }).limit(5),
      supabase.from("neuron_jobs").select("id, worker_type, status, created_at")
        .eq("author_id", user!.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("episodes").select("id").eq("author_id", user!.id),
    ]);

    setNeurons(neuronsRes.data as RecentNeuron[] || []);
    setJobs(jobsRes.data as RecentJob[] || []);
    setStats({
      neurons: neuronsRes.data?.length ?? 0,
      episodes: episodesRes.data?.length ?? 0,
      jobs: jobsRes.data?.length ?? 0,
    });
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isNewUser = neurons.length === 0 && jobs.length === 0;

  return (
    <div className="flex-1">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-serif font-bold mb-1">
            {isNewUser ? "Bine ai venit în AI-IDEI" : "Bine ai revenit"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNewUser
              ? "Începe prin a încărca primul tău conținut în Extractor."
              : "Continuă de unde ai rămas."
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Brain} label="Neuroni" value={stats.neurons} />
          <StatCard icon={Upload} label="Episoade" value={stats.episodes} />
          <StatCard icon={Briefcase} label="Jobs" value={stats.jobs} />
          <StatCard icon={Coins} label="Credite" value={balance} color="text-primary" />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* New user CTA */}
        {isNewUser && (
          <div className="mb-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center">
            <Upload className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-lg font-serif font-bold mb-2">Primul pas: încarcă conținut</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Încarcă un text, un podcast sau un video. Sistemul va extrage automat neuroni de cunoaștere din conținutul tău.
            </p>
            <Button onClick={() => navigate("/extractor")} className="gap-2">
              Deschide Extractorul
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Recent Neurons + Jobs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Recent Neurons */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Brain className="h-3 w-3" /> Neuroni recenți
              </h3>
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => navigate("/neurons")}>
                Toți
              </Button>
            </div>
            {neurons.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Niciun neuron încă.</p>
            ) : (
              <div className="space-y-1">
                {neurons.map(n => (
                  <button
                    key={n.id}
                    onClick={() => navigate(`/n/${n.number}`)}
                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-xs truncate flex-1">{n.title}</span>
                    <span className={cn(
                      "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ml-2",
                      n.status === "published" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    )}>{n.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Joburi recente
              </h3>
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => navigate("/jobs")}>
                Toate
              </Button>
            </div>
            {jobs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Niciun job rulat.</p>
            ) : (
              <div className="space-y-1">
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between py-1.5 px-2">
                    <span className="text-xs truncate flex-1">{job.worker_type.replace(/-/g, " ")}</span>
                    <span className={cn(
                      "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ml-2",
                      job.status === "completed" ? "bg-primary/10 text-primary" :
                      job.status === "failed" ? "bg-destructive/15 text-destructive" :
                      "bg-muted text-muted-foreground"
                    )}>{job.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* What's New */}
        <div className="mt-4">
          <WhatsNewWidget />
        </div>
        {/* Pipeline hint */}
        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Upload className="h-3 w-3" /> Încarcă</span>
          <ArrowRight className="h-3 w-3" />
          <span className="flex items-center gap-1"><Brain className="h-3 w-3" /> Extrage</span>
          <ArrowRight className="h-3 w-3" />
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Execută</span>
          <ArrowRight className="h-3 w-3" />
          <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Monetizează</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", color)}>{value}</p>
    </div>
  );
}
