import { MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

export function FeedbackFAB() {
  return (
    <div
      className="fixed right-4 sm:right-6 z-40"
      style={{
        // Lift above the mobile bottom-nav (h-14 = 56px) + safe-area; on md+ use 1.5rem
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)",
      }}
    >
      <FeedbackDialog
        trigger={
          <button className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group">
            <MessageSquarePlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        }
      />
    </div>
  );
}
