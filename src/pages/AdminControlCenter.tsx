import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

const TABS = [
  { key: "decisions", label: "Decisions", table: "mcl_decisions" },
  { key: "priority", label: "Priority", table: "mcl_priority_rules" },
  { key: "temporal", label: "Temporal", table: "mcl_temporal_policies" },
  { key: "memory", label: "Memory", table: "mcl_memory_records" },
  { key: "trust", label: "Trust", table: "mcl_trust_profiles" },
  { key: "recovery", label: "Recovery", table: "mcl_recovery_events" },
  { key: "selection", label: "Selection", table: "mcl_selection_events" },
  { key: "economics", label: "Economics", table: "mcl_economic_units" },
  { key: "progression", label: "Progression", table: "mcl_user_progression" },
  { key: "control", label: "Control Log", table: "mcl_control_actions" },
  { key: "simulation", label: "Simulation", table: "mcl_simulation_runs" },
  { key: "meta", label: "Meta Metrics", table: "mcl_meta_metric_reports" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminControlCenter() {
  const [tab, setTab] = useState<TabKey>("decisions");
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const current = TABS.find((t) => t.key === tab)!;

  async function loadCounts() {
    const results = await Promise.all(
      TABS.map(async (t) => {
        const { count } = await (supabase as any)
          .from(t.table)
          .select("*", { count: "exact", head: true });
        return [t.key, count ?? 0] as const;
      })
    );
    setCounts(Object.fromEntries(results));
  }

  async function loadRows() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from(current.table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    loadRows();
  }, [tab]);

  async function handleOverride(id: string) {
    const rationale = prompt("Rationale for override (min 5 chars):");
    if (!rationale || rationale.length < 5) return;
    const { error } = await supabase.rpc("mcl_override_decision" as any, {
      _decision_id: id,
      _new_status: "rejected",
      _rationale: rationale,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Decision overridden");
      loadRows();
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SEOHead title="Control Center — Missing Layers" description="Decision · Priority · Trust · Recovery · Selection · Economics" />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Control Center</h1>
        <p className="text-muted-foreground">
          Sistemul de control paralel: 12 layers care decid, prioritizează, supraviețuiesc și se optimizează.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {TABS.map((t) => (
          <Card key={t.key} className="cursor-pointer hover:bg-accent" onClick={() => setTab(t.key)}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground">{t.label}</div>
              <div className="text-xl font-bold">{counts[t.key] ?? "—"}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="flex flex-wrap h-auto">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {t.label}
                  <Badge variant="outline">{rows.length} rows</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : rows.length === 0 ? (
                  <div className="text-muted-foreground">
                    No records yet. Layer is active but empty — seed via RPC or hooks.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(rows[0])
                            .filter((k) => !["metadata", "raw_metrics", "weighting_definition", "decay_rule", "feature_usage_summary", "commercial_behavior_summary", "effect_summary", "assumptions", "projected_impact", "evidence_summary", "retained_signal", "key_failures", "key_recommendations"].includes(k))
                            .slice(0, 7)
                            .map((k) => (
                              <TableHead key={k}>{k}</TableHead>
                            ))}
                          {t.key === "decisions" && <TableHead>Action</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.id}>
                            {Object.keys(r)
                              .filter((k) => !["metadata", "raw_metrics", "weighting_definition", "decay_rule", "feature_usage_summary", "commercial_behavior_summary", "effect_summary", "assumptions", "projected_impact", "evidence_summary", "retained_signal", "key_failures", "key_recommendations"].includes(k))
                              .slice(0, 7)
                              .map((k) => (
                                <TableCell key={k} className="text-xs max-w-[200px] truncate">
                                  {typeof r[k] === "object" ? JSON.stringify(r[k]) : String(r[k] ?? "—")}
                                </TableCell>
                              ))}
                            {t.key === "decisions" && r.status === "pending" && (
                              <TableCell>
                                <Button size="sm" variant="destructive" onClick={() => handleOverride(r.id)}>
                                  Reject
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
