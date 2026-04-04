import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  MessageSquarePlus, Star, Send, Loader2,
  ThumbsUp, AlertTriangle, Lightbulb, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FEEDBACK_TYPES = [
  { key: "feedback", label: "Feedback", icon: ThumbsUp, color: "text-primary" },
  { key: "testimonial", label: "Testimonial", icon: Quote, color: "text-success" },
  { key: "proposal", label: "Proposal", icon: Lightbulb, color: "text-semantic-amber" },
  { key: "complaint", label: "Complaint", icon: AlertTriangle, color: "text-destructive" },
  { key: "review", label: "Review", icon: Star, color: "text-primary" },
] as const;

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  defaultType?: string;
  contextLabel?: string;
}

export function FeedbackDialog({ trigger, defaultType = "feedback", contextLabel }: FeedbackDialogProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation(["common", "errors", "forms"]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const needsRating = type === "review" || type === "testimonial";

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

    setLoading(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      type,
      title: title.trim().slice(0, 200),
      message: message.trim().slice(0, 2000),
      rating: needsRating ? rating : null,
      context_page: contextLabel || location.pathname,
    } as any);

    if (error) {
      toast.error(t("errors:submit_error", { message: error.message }));
    } else {
      toast.success(t("common:feedback_thanks") + " 🙏");
      setOpen(false);
      setTitle("");
      setMessage("");
      setRating(null);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            {t("common:feedback")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{t("common:submit_feedback")}</DialogTitle>
        </DialogHeader>

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
            <span className="text-xs text-muted-foreground mr-2">{t("common:rating")}:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-5 w-5 transition-colors",
                    rating && s <= rating ? "text-tier-vip fill-tier-vip" : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>
        )}

        {/* Form */}
        <Input
          placeholder={t("forms:short_title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="text-sm"
        />
        <Textarea
          placeholder={
            type === "testimonial" ? t("forms:feedback_placeholder.testimonial") :
            type === "complaint" ? t("forms:feedback_placeholder.complaint") :
            type === "proposal" ? t("forms:feedback_placeholder.proposal") :
            t("forms:feedback_placeholder.default")
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={4}
          className="text-sm resize-none"
        />
        <p className="text-micro text-muted-foreground text-right">{message.length}/2000</p>

        <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t("common:submit")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}