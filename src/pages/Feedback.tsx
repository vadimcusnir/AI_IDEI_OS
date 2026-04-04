import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Star, ThumbsUp, AlertTriangle, Lightbulb, Quote,
  Loader2, Filter, Clock, CheckCircle2, MessageCircle,
  Send, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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

const FEEDBACK_TYPES = [
  { key: "feedback", label: "Feedback", icon: ThumbsUp, color: "text-primary" },
  { key: "testimonial", label: "Testimonial", icon: Quote, color: "text-emerald-500" },
  { key: "proposal", label: "Proposal", icon: Lightbulb, color: "text-amber-500" },
  { key: "complaint", label: "Complaint", icon: AlertTriangle, color: "text-destructive" },
  { key: "review", label: "Review", icon: Star, color: "text-primary" },
] as const;

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  feedback: { icon: ThumbsUp, color: "text-primary", label: "Feedback" },
  testimonial: { icon: Quote, color: "text-emerald-500", label: "Testimonial" },
  review: { icon: Star, color: "text-amber-500", label: "Review" },
  proposal: { icon: Lightbulb, color: "text-amber-500", label: "Proposal" },
  complaint: { icon: AlertTriangle, color: "text-destructive", label: "Complaint" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
  reviewed: { label: "Reviewed", color: "bg-primary/10 text-primary" },
  resolved: { label: "Resolved", color: "bg-semantic-emerald/10 text-semantic-emerald" },
  published: { label: "Published", color: "bg-semantic-amber/10 text-semantic-amber" },
};

export default function Feedback() {
  const { t } = useTranslation(["pages", "errors"]);
  const { user } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // Inline form state — open by default
  const [formOpen, setFormOpen] = useState(true);
  const [type, setType] = useState("feedback");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const needsRating = type === "review" || type === "testimonial";

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

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim() || !message.trim()) {
      toast.error(t("errors:fill_title_message"));
      return;
    }
    if (needsRating && !rating) {
      toast.error(t("errors:select_rating"));
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      type,
      title: title.trim().slice(0, 200),
      message: message.trim().slice(0, 2000),
      rating: needsRating ? rating : null,
      context_page: location.pathname,
    } as any);

    if (error) {
      toast.error(t("errors:submit_error", { message: error.message }));
    } else {
      toast.success(t("pages:feedback.thank_you"));
      trackInternalEvent({ event: AnalyticsEvents.FEEDBACK_SUBMITTED, params: { type, rating } });
      setTitle("");
      setMessage("");
      setRating(null);
      loadFeedback();
    }
    setSending(false);
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
      <SEOHead title="Feedback — AI-IDEI" description="Submit and track your feedback, reviews and feature proposals." />
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          {t("feedback.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {stats.total} {t("feedback.submitted")} · {stats.pending} {t("feedback.pending")} · {stats.responded} {t("feedback.with_response")}
        </p>
      </div>

      {/* Inline Form — collapsible, open by default */}
      <div className="mb-6 bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <span className="text-sm font-medium flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {t("feedback.submit_new")}
          </span>
          <ChevronUp className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            !formOpen && "rotate-180"
          )} />
        </button>

        {formOpen && (
          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
            {/* Type selector */}
            <div className="flex flex-wrap gap-1.5">
              {FEEDBACK_TYPES.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.key}
                    onClick={() => setType(ft.key)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-dense font-medium transition-colors",
                      type === ft.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {ft.label}
                  </button>
                );
              })}
            </div>

            {/* Rating */}
            {needsRating && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-2">Rating:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        rating && s <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
                      )}
                    />
                  </button>
                ))}
              </div>
            )}

            <Input
              placeholder={t("common:feedback_form.short_title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="text-sm"
            />
            <Textarea
              placeholder={
                type === "testimonial" ? t("common:feedback_form.testimonial_placeholder") :
                type === "complaint" ? t("common:feedback_form.complaint_placeholder") :
                type === "proposal" ? t("common:feedback_form.proposal_placeholder") :
                t("common:feedback_form.default_placeholder")
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={3}
              className="text-sm resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-micro text-muted-foreground">{message.length}/2000</span>
              <Button onClick={handleSubmit} disabled={sending} size="sm" className="gap-1.5">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {[
          { key: "all", label: "All" },
          ...Object.entries(TYPE_CONFIG).map(([k, v]) => ({ key: k, label: v.label })),
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1 rounded-full text-dense font-medium transition-colors whitespace-nowrap",
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
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? t("feedback.no_feedback") : t("feedback.no_filter_results")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.feedback;
            const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            const Icon = config.icon;
            const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded-lg bg-background border border-border shrink-0", config.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <span className={cn("text-nano px-1.5 py-0.5 rounded font-medium", statusCfg.color)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.message}</p>

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

                    {item.admin_response && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mt-2">
                        <p className="text-micro font-semibold text-primary mb-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {t("feedback.admin_response")}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.admin_response}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground/50" />
                      <span className="text-micro text-muted-foreground/60">{timeAgo}</span>
                      {item.context_page && (
                        <span className="text-micro px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
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
