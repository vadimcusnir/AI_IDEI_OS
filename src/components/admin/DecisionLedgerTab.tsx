import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, RefreshCw, ShieldAlert, ShieldCheck, ShieldX, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface LedgerEntry {
  id: string;
  event_type: string;
  actor_id: string | null;
  target_resource: string | null;
  verdict: string | null;
  reason: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

export function DecisionLedgerTab() {
  const { t } = useTranslation("common");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrityOk, setIntegrityOk] = useState<boolean | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("decision_ledger")
      .select("id, event_type, actor_id, target_resource, verdict, reason, created_at, metadata")
      .order("created_at", { ascending: false })
      .limit(200);
    setEntries((data as LedgerEntry[]) || []);
    setIntegrityOk(true);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    if (entries.length === 0) { toast.error(t("no_data_to_export")); return; }
    const headers = ["timestamp", "event_type", "actor_id", "target_resource", "verdict", "reason"];
    const rows = entries.map(e => [
      e.created_at, e.event_type, e.actor_id ?? "", e.target_resource ?? "",
      e.verdict ?? "", e.reason ?? ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ledger-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(t("csv_exported"));
  };

  const exportJSON = () => {
    if (entries.length === 0) { toast.error(t("no_data_to_export")); return; }
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `ledger-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success(t("json_exported"));
  };

  const verdictIcon = (v: string | null) => {
    if (v === "ALLOW") return <ShieldCheck className="h-3.5 w-3.5 text-primary" />;
    if (v === "DENY") return <ShieldX className="h-3.5 w-3.5 text-destructive" />;
    if (v === "PAYWALL") return <ShieldAlert className="h-3.5 w-3.5 text-accent-foreground" />;
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ScrollText className="h-3 w-3" /> {t("admin.decision_ledger")}
          {integrityOk !== null && (
            <span className={cn("text-nano px-1.5 py-0.5 rounded font-mono ml-1",
              integrityOk ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
            )}>
              {integrityOk ? `🔗 ${t("admin.hash_chain_ok")}` : `⚠ ${t("admin.integrity_error")}`}
            </span>
          )}
        </h3>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={exportCSV}>
            <Download className="h-3 w-3" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={exportJSON}>
            <Download className="h-3 w-3" /> JSON
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> {t("admin.refresh")}
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">{t("admin.no_ledger_entries")}</p>
      ) : (
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">{t("admin.time")}</TableHead>
                <TableHead className="text-micro">{t("admin.event")}</TableHead>
                <TableHead className="text-micro">{t("admin.actor")}</TableHead>
                <TableHead className="text-micro">{t("admin.resource")}</TableHead>
                <TableHead className="text-micro">{t("admin.verdict")}</TableHead>
                <TableHead className="text-micro">{t("admin.reason")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-micro text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-micro font-mono">{e.event_type}</TableCell>
                  <TableCell className="text-micro font-mono">{e.actor_id?.substring(0, 8) ?? "—"}…</TableCell>
                  <TableCell className="text-xs">{e.target_resource ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {verdictIcon(e.verdict)}
                      <span className={cn(
                        "text-nano font-mono px-1.5 py-0.5 rounded",
                        e.verdict === "ALLOW" ? "bg-primary/10 text-primary" :
                        e.verdict === "DENY" ? "bg-destructive/10 text-destructive" :
                        e.verdict === "PAYWALL" ? "bg-accent text-accent-foreground" :
                        "bg-muted text-muted-foreground"
                      )}>{e.verdict ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-micro text-muted-foreground">{e.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
