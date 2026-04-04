import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackDialog } from "./FeedbackDialog";
import { MessageSquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ContextualFeedbackPrompt() {
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const [showPrompt, setShowPrompt] = useState(false);
  const [contextLabel, setContextLabel] = useState(t("after_job_completed"));

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("contextual-feedback")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "neuron_jobs",
          filter: `author_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newStatus = payload.new?.status;
          const oldStatus = payload.old?.status;
          if (newStatus === "completed" && oldStatus !== "completed") {
            const dismissed = sessionStorage.getItem("feedback-prompt-dismissed");
            if (!dismissed) {
              setContextLabel(t("job_completed_context", { service: payload.new?.worker_type?.replace(/-/g, " ") || "service" }));
              setShowPrompt(true);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, t]);

  if (!showPrompt) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("feedback-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-20 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card border border-primary/20 shadow-lg rounded-xl p-4 max-w-xs">
        <p className="text-sm font-medium mb-1">{t("job_completed_title")}</p>
        <p className="text-xs text-muted-foreground mb-3">
          {t("job_completed_feedback")}
        </p>
        <div className="flex items-center gap-2">
          <FeedbackDialog
            defaultType="review"
            contextLabel={contextLabel}
            trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {t("send_feedback")}
              </button>
            }
          />
          <button
            onClick={handleDismiss}
            className="text-micro text-muted-foreground hover:text-foreground px-2 py-1"
          >
            {t("later")}
          </button>
        </div>
      </div>
    </div>
  );
}