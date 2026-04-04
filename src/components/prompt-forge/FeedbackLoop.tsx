import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RatingStars } from "./RatingStars";

interface FeedbackLoopProps {
  historyId?: string;
  result: string;
  goal: string;
  onRatingChange?: (rating: number) => void;
}

export function FeedbackLoop({ historyId, result, goal, onRatingChange }: FeedbackLoopProps) {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleRate = useCallback(async (newRating: number) => {
    setRating(newRating);
    onRatingChange?.(newRating);
    if (newRating >= 1) setShowFeedback(true);

    if (historyId && user) {
      await supabase
        .from("prompt_history")
        .update({ rating: newRating })
        .eq("id", historyId)
        .eq("user_id", user.id);
    }
  }, [historyId, user, onRatingChange]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!feedback.trim() || !historyId || !user) return;
    setSaving(true);

    await supabase
      .from("prompt_history")
      .update({ feedback: feedback.trim(), rating })
      .eq("id", historyId)
      .eq("user_id", user.id);

    toast.success(t("prompt_forge.feedback_saved", { defaultValue: "Feedback salvat! Va îmbunătăți generările viitoare." }));
    setSaving(false);
    setShowFeedback(false);
  }, [feedback, historyId, user, rating, t]);

  if (!result) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-micro font-medium text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3" />
          {t("prompt_forge.rate_result", { defaultValue: "Evaluează rezultatul" })}
        </span>
        <RatingStars value={rating} onChange={handleRate} />
      </div>

      {showFeedback && (
        <div className="space-y-2">
          <Textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder={t("prompt_forge.feedback_placeholder", {
              defaultValue: "Ce ar fi putut fi mai bine? Ce lipsește?"
            })}
            rows={2}
            className="text-xs resize-none"
          />
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleSubmitFeedback}
            disabled={saving || !feedback.trim()}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            {t("prompt_forge.send_feedback", { defaultValue: "Trimite feedback" })}
          </Button>
        </div>
      )}
    </div>
  );
}
