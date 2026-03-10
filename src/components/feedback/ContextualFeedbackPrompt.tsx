import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackDialog } from "./FeedbackDialog";
import { MessageSquarePlus } from "lucide-react";

/**
 * Listens for completed jobs via realtime and prompts feedback after first completion.
 * Shows a subtle prompt — not intrusive.
 */
export function ContextualFeedbackPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [contextLabel, setContextLabel] = useState("După job completat");

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
            // Check if user has given feedback before
            const dismissed = sessionStorage.getItem("feedback-prompt-dismissed");
            if (!dismissed) {
              setContextLabel(`Job finalizat: ${payload.new?.worker_type?.replace(/-/g, " ") || "serviciu"}`);
              setShowPrompt(true);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!showPrompt) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("feedback-prompt-dismissed", "true");
    setShowPrompt(false);
  };

  return (
    <div className="fixed bottom-20 right-6 z-40 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card border border-primary/20 shadow-lg rounded-xl p-4 max-w-xs">
        <p className="text-sm font-medium mb-1">Job finalizat! 🎉</p>
        <p className="text-xs text-muted-foreground mb-3">
          Cum a fost experiența? Feedback-ul tău ne ajută să îmbunătățim platforma.
        </p>
        <div className="flex items-center gap-2">
          <FeedbackDialog
            defaultType="review"
            contextLabel={contextLabel}
            trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Trimite feedback
              </button>
            }
          />
          <button
            onClick={handleDismiss}
            className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1"
          >
            Mai târziu
          </button>
        </div>
      </div>
    </div>
  );
}
