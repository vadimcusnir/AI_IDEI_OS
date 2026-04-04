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
import { useTranslation } from "react-i18next";

const REASON_KEYS = ["spam", "offensive", "off_topic", "misinformation", "other"] as const;

interface ReportDialogProps {
  targetType: "post" | "thread";
  targetId: string;
}

export function ReportDialog({ targetType, targetId }: ReportDialogProps) {
  const { user } = useAuth();
  const { t } = useTranslation(["common", "errors"]);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    if (!reason) { toast.error(t("errors:select_report_reason")); return; }
    setSubmitting(true);

    const reasonLabel = t(`common:report_reasons.${reason}`);
    const { error } = await supabase.from("forum_flags").insert({
      target_type: targetType,
      target_id: targetId,
      reporter_id: user.id,
      reason: `${reasonLabel}${details ? ': ' + details : ''}`,
    });

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") toast.info(t("common:already_reported"));
      else toast.error(error.message);
      return;
    }

    toast.success(t("common:report_submitted"));
    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-micro h-6 text-muted-foreground hover:text-destructive">
          <Flag className="h-3 w-3 mr-0.5" />{t("common:report")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{t("common:report_target", { target: targetType })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder={t("common:select_reason")} />
            </SelectTrigger>
            <SelectContent>
              {REASON_KEYS.map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {t(`common:report_reasons.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder={t("common:additional_details")}
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
            {submitting ? t("common:submitting") : t("common:submit_report")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}