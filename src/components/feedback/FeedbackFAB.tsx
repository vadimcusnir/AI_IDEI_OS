import { MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

export function FeedbackFAB() {
  return (
    <div className="fixed bottom-6 right-6 z-40">
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
