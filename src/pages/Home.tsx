import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { WhatsNewWidget } from "@/components/home/WhatsNewWidget";
import { TrendingIdeasWidget } from "@/components/home/TrendingIdeasWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Upload, Brain, Sparkles, Briefcase, Coins, ArrowRight,
  Loader2, Clock, Plus, Zap, TrendingUp, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineIndicator } from "@/components/PipelineIndicator";
import { TopUpDialog } from "@/components/credits/TopUpDialog";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { motion } from "framer-motion";

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
  {
    label: "Upload Content",
    desc: "Transcripts, podcasts, texts",
    icon: Upload,
    path: "/extractor",
    gradient: "from-primary/15 to-primary/5",
  },
  {
    label: "New Neuron",
    desc: "Create a neuron manually",
    icon: Plus,
    path: "/n/new",
    gradient: "from-primary/10 to-accent/5",
  },
  {
    label: "Run Service",
    desc: "Generate AI deliverables",
    icon: Sparkles,
    path: "/services",
    gradient: "from-accent/15 to-primary/5",
  },
  {
    label: "View Jobs",
    desc: "Monitor executions",
    icon: Briefcase,
    path: "/jobs",
    gradient: "from-muted to-card",
  },
];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { balance } = useCreditBalance();
  const navigate = useNavigate();
  const [neurons, setNeurons] = useState<RecentNeuron[]>([]);
  const [jobs, setJobs] = useState<RecentJob[]>([]);
  const [totalNeurons, setTotalNeurons] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    const [neuronsRes, jobsRes, episodesRes, neuronsCount, jobsCount] = await Promise.all([
      supabase.from("neurons").select("id, number, title, status, updated_at")
        .eq("author_id", user!.id).order("updated_at", { ascending: false }).limit(5),
      supabase.from("neuron_jobs").select("id, worker_type, status, created_at")
        .eq("author_id", user!.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("episodes").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
      supabase.from("neurons").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
      supabase.from("neuron_jobs").select("id", { count: "exact", head: true }).eq("author_id", user!.id),
    ]);

    setNeurons(neuronsRes.data as RecentNeuron[] || []);
    setJobs(jobsRes.data as RecentJob[] || []);
    setTotalNeurons(neuronsCount.count ?? 0);
    setTotalEpisodes(episodesRes.count ?? 0);
    setTotalJobs(jobsCount.count ?? 0);
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

  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <div className="flex-1 overflow-auto">
      <SEOHead title="Cockpit — AI-IDEI" description="Your AI-IDEI command center. Monitor neurons, episodes, jobs and credits." />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif font-bold mb-1">
            {isNewUser ? "Welcome to AI-IDEI" : "Cockpit"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isNewUser
              ? "Your expertise capitalization platform. Start by uploading your first content."
              : "Your command center for the knowledge pipeline."
            }
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-4 gap-2 sm:gap-3 mb-6">
          <motion.div variants={fadeUp}><StatCard icon={Brain} label="Neurons" value={totalNeurons} /></motion.div>
          <motion.div variants={fadeUp}><StatCard icon={FileText} label="Episodes" value={totalEpisodes} /></motion.div>
          <motion.div variants={fadeUp}><StatCard icon={Zap} label="Jobs" value={totalJobs} /></motion.div>
          <motion.div variants={fadeUp}>
            <div className={cn(
              "rounded-xl p-3 border transition-colors h-full",
              "bg-primary/5 border-primary/20"
            )}>
              <div className="flex items-center gap-1.5 mb-1">
                <Coins className="h-3 w-3 text-primary" />
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Credits</span>
              </div>
              <p className="text-lg font-bold font-mono text-primary">{balance.toLocaleString()}</p>
              <div className="mt-1.5">
                <TopUpDialog onSuccess={loadData} />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions — large cards */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {QUICK_ACTIONS.map(action => (
            <motion.button
              key={action.label}
              variants={fadeUp}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={cn(
                "group relative flex flex-col items-start gap-3 p-4 rounded-xl border border-border",
                "bg-gradient-to-br hover:border-primary/30 hover:shadow-md transition-all duration-200",
                action.gradient
              )}
            >
              <div className="h-10 w-10 rounded-xl bg-background/80 border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:shadow-sm transition-all">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold mb-0.5">{action.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{action.desc}</p>
              </div>
              <ArrowRight className="absolute top-3 right-3 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            </motion.button>
          ))}
        </motion.div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* New user onboarding CTA */}
        {isNewUser && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-6 p-5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-center"
          >
            <Upload className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-base font-serif font-bold mb-1.5">First step: upload content</h2>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Upload a podcast, text, or video. The system will automatically extract knowledge neurons.
            </p>
            <Button onClick={() => navigate("/extractor")} size="sm" className="gap-2">
              Open Extractor
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}

        {/* Main content grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column: Recent items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Recent Neurons */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Brain className="h-3 w-3" /> Recent Neurons
                </h3>
                <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => navigate("/neurons")}>
                  All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              {neurons.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No neurons yet.</p>
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
                  <Clock className="h-3 w-3" /> Recent Jobs
                </h3>
                <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={() => navigate("/jobs")}>
                  All <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No jobs run yet.</p>
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

          {/* Right column: Pipeline + What's New */}
          <div className="space-y-4">
            {/* Pipeline Progress */}
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
                <TrendingUp className="h-3 w-3" /> Pipeline
              </h3>
              <PipelineIndicator />
            </div>

            {/* Trending Ideas */}
            <TrendingIdeasWidget />

            {/* What's New */}
            <WhatsNewWidget />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType; label: string; value: number; highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl p-3 border transition-colors",
      highlight
        ? "bg-primary/5 border-primary/20"
        : "bg-card border-border"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3 w-3", highlight ? "text-primary" : "text-muted-foreground")} />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-bold font-mono", highlight && "text-primary")}>{value.toLocaleString()}</p>
    </div>
  );
}
