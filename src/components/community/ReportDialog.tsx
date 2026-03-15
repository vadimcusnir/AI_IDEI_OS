import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Flag } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "offensive", label: "Offensive or abusive" },
  { value: "off-topic", label: "Off-topic content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  targetType: "post" | "thread";
  targetId: string;
}

export function ReportDialog({ targetType, targetId }: ReportDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason) { toast.error("Please select a reason."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("forum_flags").insert({
      target_type: targetType,
      target_id: targetId,
      reporter_id: user.id,
      reason: `${REASONS.find(r => r.value === reason)?.label || reason}${details ? ': ' + details : ''}`,
    });

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.info("You already reported this.");
      else toast.error(error.message);
      return;
    }

    toast.success("Report submitted. Thank you!");
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[10px] h-6 text-muted-foreground hover:text-destructive">
          <Flag className="h-3 w-3 mr-0.5" />Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Report {targetType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Select a reason..." />
            </SelectTrigger>
            <SelectContent>
              {REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value} className="text-xs">
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Additional details (optional)..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="text-xs"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="w-full"
            size="sm"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
