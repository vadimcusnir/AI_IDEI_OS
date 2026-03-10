import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";
import {
  MessageSquarePlus, Star, ThumbsUp, AlertTriangle,
  Lightbulb, Quote, Loader2, Filter, Clock, CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";

interface FeedbackItem {
  id: string;
  type: string;
  title: string;
  message: string;
  rating: number | null;
  status: string;
  admin_response: string | null;
  is_public: boolean;
  created_at: string;
  context_page: string | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  feedback: { icon: ThumbsUp, color: "text-primary", label: "Feedback" },
  testimonial: { icon: Quote, color: "text-emerald-500", label: "Testimonial" },
  review: { icon: Star, color: "text-amber-500", label: "Recenzie" },
  proposal: { icon: Lightbulb, color: "text-amber-500", label: "Propunere" },
  complaint: { icon: AlertTriangle, color: "text-destructive", label: "Plângere" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "În așteptare", color: "bg-muted text-muted-foreground" },
  reviewed: { label: "Revizuit", color: "bg-primary/10 text-primary" },
  resolved: { label: "Rezolvat", color: "bg-emerald-500/10 text-emerald-600" },
  published: { label: "Publicat", color: "bg-amber-500/10 text-amber-600" },
};

export default function Feedback() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    loadFeedback();
  }, [user]);

  const loadFeedback = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setItems((data as unknown as FeedbackItem[]) || []);
    setLoading(false);
  };

  const filtered = items.filter((i) => {
    if (filter === "all") return true;
    return i.type === filter;
  });

  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    responded: items.filter((i) => i.admin_response).length,
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Feedback-ul meu
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.total} trimise · {stats.pending} în așteptare · {stats.responded} cu răspuns
          </p>
        </div>
        <FeedbackDialog
          trigger={
            <Button size="sm" className="gap-1.5 text-xs">
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Feedback nou
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {[
          { key: "all", label: "Toate" },
          ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Niciun feedback trimis încă</p>
          <FeedbackDialog
            trigger={
              <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs">
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Trimite primul feedback
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.feedback;
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ro });

            return (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded-lg bg-background border border-border shrink-0", config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-medium", statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.message}</p>

                    {/* Rating */}
                    {item.rating && (
                      <div className="flex items-center gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "h-3 w-3",
                              s <= item.rating! ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
                            )}
                          />
                        ))}
                      </div>
                    )}

                    {/* Admin response */}
                    {item.admin_response && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mt-2">
                        <p className="text-[10px] font-semibold text-primary mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Răspuns admin
                        </p>
                        <p className="text-xs text-muted-foreground">{item.admin_response}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
                      {item.context_page && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {item.context_page}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
