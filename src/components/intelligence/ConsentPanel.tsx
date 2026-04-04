import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, CheckCircle2, XCircle, Clock, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ConsentRecord {
  id: string;
  profile_id: string;
  consent_status: string;
  granted_at: string | null;
  revoked_at: string | null;
  doc_ref: string | null;
  user_id: string | null;
  created_at: string;
}

interface ConsentPanelProps {
  profileId: string;
  consentRequired: boolean;
}

export function ConsentPanel({ profileId, consentRequired }: ConsentPanelProps) {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [docRef, setDocRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await (supabase.from("intelligence_profile_consent") as any)
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    setRecords((data as ConsentRecord[]) || []);
    setLoading(false);
  }, [profileId]);

  useEffect(() => { load(); }, [load]);

  const currentStatus = records[0]?.consent_status || "none";

  const grantConsent = async () => {
    setSubmitting(true);
    const { error } = await (supabase.from("intelligence_profile_consent") as any).insert({
      profile_id: profileId,
      consent_status: "granted",
      granted_at: new Date().toISOString(),
      doc_ref: docRef.trim() || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Consent granted"); setDocRef(""); }
    setSubmitting(false);
    load();
  };

  const revokeConsent = async () => {
    setSubmitting(true);
    const { error } = await (supabase.from("intelligence_profile_consent") as any).insert({
      profile_id: profileId,
      consent_status: "revoked",
      revoked_at: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else toast.success("Consent revoked");
    setSubmitting(false);
    load();
  };

  if (!consentRequired) {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1.5 py-2">
        <Shield className="h-3 w-3" /> Consent not required for this profile type
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-primary" /> Consent Status
        </h4>
        <span className={cn(
          "text-micro px-2 py-0.5 rounded-full font-medium",
          currentStatus === "granted" ? "bg-status-validated/10 text-status-validated" :
          currentStatus === "revoked" ? "bg-destructive/10 text-destructive" :
          "bg-muted text-muted-foreground"
        )}>
          {currentStatus}
        </span>
      </div>

      {/* Grant / Revoke actions */}
      <div className="space-y-2">
        {currentStatus !== "granted" && (
          <div className="flex gap-2">
            <Input
              placeholder="Doc reference (optional)"
              value={docRef}
              onChange={e => setDocRef(e.target.value)}
              className="text-xs h-7"
            />
            <Button size="sm" variant="outline" onClick={grantConsent} disabled={submitting} className="h-7 text-xs shrink-0">
              <Plus className="h-3 w-3 mr-1" /> Grant
            </Button>
          </div>
        )}
        {currentStatus === "granted" && (
          <Button size="sm" variant="destructive" onClick={revokeConsent} disabled={submitting} className="h-7 text-xs w-full">
            <XCircle className="h-3 w-3 mr-1" /> Revoke Consent
          </Button>
        )}
      </div>

      {/* History */}
      {records.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {records.map(r => (
            <div key={r.id} className="flex items-center gap-2 text-micro text-muted-foreground">
              {r.consent_status === "granted" 
                ? <CheckCircle2 className="h-3 w-3 text-status-validated shrink-0" /> 
                : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
              <span className="font-medium">{r.consent_status}</span>
              <span className="text-muted-foreground/50">
                {format(new Date(r.created_at), "dd MMM yyyy HH:mm")}
              </span>
              {r.doc_ref && (
                <span className="flex items-center gap-0.5 text-primary">
                  <FileText className="h-2.5 w-2.5" /> {r.doc_ref}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
