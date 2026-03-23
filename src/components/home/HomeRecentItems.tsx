/**
 * HomeRecentItems — Recent neurons and jobs panels for the Home dashboard.
 */
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Brain, Clock, Upload, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

interface HomeRecentItemsProps {
  neurons: RecentNeuron[];
  jobs: RecentJob[];
}

export function HomeRecentItems({ neurons, jobs }: HomeRecentItemsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");

  return (
    <div className="lg:col-span-2 space-y-5">
      {/* Recent Neurons */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Brain className="h-3.5 w-3.5" /> {t("home.recent_neurons")}
          </h3>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/neurons")}>
            {t("common:view_all", "All")} <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {neurons.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Brain className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("home.no_neurons")}</p>
            <p className="text-xs text-muted-foreground/60 mb-3">{t("home.first_step_desc")}</p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/extractor")}>
              <Upload className="h-3.5 w-3.5" />
              {t("home.open_extractor")}
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {neurons.map(n => (
              <button
                key={n.id}
                onClick={() => navigate(`/n/${n.number}`)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <span className="text-sm truncate flex-1 group-hover:text-primary transition-colors">{n.title}</span>
                <span className={cn(
                  "text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ml-3 shrink-0",
                  n.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>{n.status}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> {t("home.recent_jobs")}
          </h3>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => navigate("/jobs")}>
            {t("common:view_all", "All")} <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Sparkles className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("home.no_jobs")}</p>
            <p className="text-xs text-muted-foreground/60 mb-3">{t("home.no_jobs_hint", "Run an AI service to generate deliverables")}</p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/services")}>
              <Sparkles className="h-3.5 w-3.5" />
              {t("home.browse_services", "Browse Services")}
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {jobs.map(job => (
              <div key={job.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                <span className="text-sm truncate flex-1">{job.worker_type.replace(/-/g, " ")}</span>
                <span className={cn(
                  "text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ml-3 shrink-0",
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
  );
}
