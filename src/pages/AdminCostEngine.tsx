import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Calculator, TrendingUp, AlertTriangle, Database, Zap, RefreshCw } from "lucide-react";


interface Category { id: string; category_key: string; display_name: string; domain: string; cost_type: string; }
interface LedgerEntry { id: string; category_key: string; source: string; amount_eur: number; quantity: number; service_key: string | null; occurred_at: string; }
interface Liability { id: string; credits_outstanding: number; estimated_redemption_cost_eur: number; redemption_rate_30d: number; expected_burn_rate_per_day: number; days_to_full_burn: number | null; snapshot_at: string; }
interface BreakEven { id: string; period_month: string; total_fixed_cost_eur: number; total_variable_cost_eur: number; total_revenue_eur: number; contribution_margin_pct: number; break_even_units: number | null; break_even_revenue_eur: number | null; margin_of_safety_pct: number | null; computed_at: string; }
interface Scenario { id: string; scenario_key: string; display_name: string; scenario_type: string; assumptions: any; }
interface ScenarioResult { id: string; scenario_key: string; period_month: string; total_cost_eur: number; total_revenue_eur: number; margin_eur: number; margin_pct: number; computed_at: string; }
interface UnitEcon { service_key: string; period_month: string; units_sold: number; total_cost_eur: number; revenue_eur: number; cost_per_unit_eur: number; contribution_margin_pct: number; }

export default function AdminCostEngine() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [liability, setLiability] = useState<Liability[]>([]);
  const [breakEven, setBreakEven] = useState<BreakEven[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioResults, setScenarioResults] = useState<ScenarioResult[]>([]);
  const [unitEcon, setUnitEcon] = useState<UnitEcon[]>([]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cats, led, liab, be, scn, scnRes, ue] = await Promise.all([
        supabase.from("mcl_cost_categories").select("*").order("domain"),
        supabase.from("mcl_cost_ledger").select("*").order("occurred_at", { ascending: false }).limit(50),
        supabase.from("mcl_internal_liability").select("*").order("snapshot_at", { ascending: false }).limit(10),
        supabase.from("mcl_break_even_state").select("*").order("computed_at", { ascending: false }).limit(10),
        supabase.from("mcl_cost_scenarios").select("*").order("scenario_type"),
        supabase.from("mcl_cost_scenario_results").select("*").order("computed_at", { ascending: false }).limit(20),
        supabase.from("mcl_unit_economics").select("*").order("computed_at", { ascending: false }).limit(20),
      ]);
      setCategories(cats.data || []);
      setLedger(led.data || []);
      setLiability(liab.data || []);
      setBreakEven(be.data || []);
      setScenarios(scn.data || []);
      setScenarioResults(scnRes.data || []);
      setUnitEcon(ue.data || []);
    } catch (e: any) {
      toast.error("Failed to load cost data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const runRpc = async (name: "mcl_compute_liability" | "mcl_compute_break_even" | "mcl_compute_unit_economics", label: string) => {
    setBusy(name);
    try {
      const { error } = await supabase.rpc(name as any);
      if (error) throw error;
      toast.success(`${label} computed`);
      await loadAll();
    } catch (e: any) {
      toast.error(`${label} failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const runScenario = async (key: string) => {
    setBusy(key);
    try {
      const { error } = await supabase.rpc("mcl_run_scenario" as any, { _scenario_key: key });
      if (error) throw error;
      toast.success(`Scenario "${key}" simulated`);
      await loadAll();
    } catch (e: any) {
      toast.error(`Scenario failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  const latestLiab = liability[0];
  const latestBE = breakEven[0];
  const totalLedger30d = ledger
    .filter(l => new Date(l.occurred_at) > new Date(Date.now() - 30 * 86400000))
    .reduce((s, l) => s + Number(l.amount_eur), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" /> Cost Engine
          </h1>
          <p className="text-muted-foreground text-sm">Internal economic infrastructure — 14 cost models, break-even, scenarios, liability</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={loadAll} disabled={busy !== null}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => runRpc("mcl_compute_liability", "Liability")} disabled={busy !== null}>
            {busy === "mcl_compute_liability" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
            Snapshot Liability
          </Button>
          <Button size="sm" onClick={() => runRpc("mcl_compute_break_even", "Break-even")} disabled={busy !== null}>
            {busy === "mcl_compute_break_even" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
            Compute Break-Even
          </Button>
          <Button size="sm" onClick={() => runRpc("mcl_compute_unit_economics", "Unit economics")} disabled={busy !== null}>
            {busy === "mcl_compute_unit_economics" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Recompute Unit Econ
          </Button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Cost (last 30d)</CardDescription><CardTitle className="text-2xl">€{totalLedger30d.toFixed(2)}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">{ledger.length} ledger events</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Outstanding Credits</CardDescription><CardTitle className="text-2xl">{latestLiab ? Number(latestLiab.credits_outstanding).toLocaleString() : "—"}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Liability: €{latestLiab ? Number(latestLiab.estimated_redemption_cost_eur).toFixed(2) : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Contribution Margin</CardDescription><CardTitle className="text-2xl">{latestBE ? Number(latestBE.contribution_margin_pct).toFixed(1) + "%" : "—"}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">{latestBE ? `BE: ${Number(latestBE.break_even_units || 0).toLocaleString()} units` : "Compute break-even"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Margin of Safety</CardDescription><CardTitle className="text-2xl">{latestBE?.margin_of_safety_pct != null ? Number(latestBE.margin_of_safety_pct).toFixed(1) + "%" : "—"}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Revenue vs break-even</CardContent>
        </Card>
      </div>

      <CostEngineAdvisor
        snapshot={{
          breakEven: latestBE || null,
          liability: latestLiab || null,
          unitEcon: unitEcon.slice(0, 10),
          totalLedger30d,
        }}
      />

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
          <TabsTrigger value="break_even">Break-Even</TabsTrigger>
          <TabsTrigger value="liability">Liability</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="unit_econ">Unit Econ</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader><CardTitle>Cost Categories ({categories.length})</CardTitle><CardDescription>14 canonical economic domains</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Display</TableHead><TableHead>Domain</TableHead><TableHead>Type</TableHead></TableRow></TableHeader>
                <TableBody>
                  {categories.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.category_key}</TableCell>
                      <TableCell>{c.display_name}</TableCell>
                      <TableCell><Badge variant="secondary">{c.domain}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{c.cost_type}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ledger">
          <Card>
            <CardHeader><CardTitle>Cost Ledger ({ledger.length} recent)</CardTitle><CardDescription>Every measurable cost event</CardDescription></CardHeader>
            <CardContent>
              {ledger.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No cost events yet. Triggers will populate as users spend credits.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Category</TableHead><TableHead>Source</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">EUR</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ledger.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">{new Date(l.occurred_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{l.category_key}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{l.source}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-xs">{Number(l.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(l.amount_eur).toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="break_even">
          <Card>
            <CardHeader><CardTitle>Break-Even Snapshots</CardTitle><CardDescription>Fixed + variable cost vs revenue</CardDescription></CardHeader>
            <CardContent>
              {breakEven.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No snapshots yet. Click "Compute Break-Even".</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Period</TableHead><TableHead className="text-right">Fixed €</TableHead><TableHead className="text-right">Variable €</TableHead><TableHead className="text-right">Revenue €</TableHead><TableHead className="text-right">CM %</TableHead><TableHead className="text-right">BE Units</TableHead><TableHead className="text-right">MoS %</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {breakEven.map(b => (
                      <TableRow key={b.id}>
                        <TableCell>{b.period_month}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(b.total_fixed_cost_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(b.total_variable_cost_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(b.total_revenue_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{Number(b.contribution_margin_pct).toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono">{b.break_even_units ? Number(b.break_even_units).toLocaleString(undefined, {maximumFractionDigits: 0}) : "—"}</TableCell>
                        <TableCell className="text-right font-mono">{b.margin_of_safety_pct != null ? Number(b.margin_of_safety_pct).toFixed(1) + "%" : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liability">
          <Card>
            <CardHeader><CardTitle>Internal Liability</CardTitle><CardDescription>Sold-but-unconsumed credits = latent obligation</CardDescription></CardHeader>
            <CardContent>
              {liability.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No snapshots. Click "Snapshot Liability".</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>When</TableHead><TableHead className="text-right">Outstanding</TableHead><TableHead className="text-right">Est. Cost €</TableHead><TableHead className="text-right">Redemption %</TableHead><TableHead className="text-right">Burn/day</TableHead><TableHead className="text-right">Days to Burn</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {liability.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">{new Date(l.snapshot_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{Number(l.credits_outstanding).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(l.estimated_redemption_cost_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{(Number(l.redemption_rate_30d) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-mono">{Number(l.expected_burn_rate_per_day).toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono">{l.days_to_full_burn ? Number(l.days_to_full_burn).toFixed(0) : "∞"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {scenarios.map(s => (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{s.display_name}</CardTitle>
                      <CardDescription className="text-xs font-mono">{s.scenario_key}</CardDescription>
                    </div>
                    <Badge variant={s.scenario_type === "stress" ? "destructive" : s.scenario_type === "high" ? "default" : "secondary"}>{s.scenario_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted/50 p-2 rounded mb-3 overflow-x-auto">{JSON.stringify(s.assumptions, null, 2)}</pre>
                  <Button size="sm" className="w-full" onClick={() => runScenario(s.scenario_key)} disabled={busy !== null}>
                    {busy === s.scenario_key ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                    Run Simulation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle>Recent Scenario Results</CardTitle></CardHeader>
            <CardContent>
              {scenarioResults.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No results yet. Run a scenario above.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Scenario</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Cost €</TableHead><TableHead className="text-right">Revenue €</TableHead><TableHead className="text-right">Margin €</TableHead><TableHead className="text-right">Margin %</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {scenarioResults.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.scenario_key}</TableCell>
                        <TableCell>{r.period_month}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(r.total_cost_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(r.total_revenue_eur).toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-mono ${Number(r.margin_eur) < 0 ? "text-destructive" : "text-primary"}`}>€{Number(r.margin_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{Number(r.margin_pct).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unit_econ">
          <Card>
            <CardHeader><CardTitle>Unit Economics per Service</CardTitle><CardDescription>P&L breakdown by service_key</CardDescription></CardHeader>
            <CardContent>
              {unitEcon.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No unit economics yet. Click "Recompute Unit Econ" above.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right">Cost €</TableHead><TableHead className="text-right">Revenue €</TableHead><TableHead className="text-right">€/unit</TableHead><TableHead className="text-right">CM %</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {unitEcon.map((u, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{u.service_key}</TableCell>
                        <TableCell>{u.period_month}</TableCell>
                        <TableCell className="text-right font-mono">{Number(u.units_sold).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(u.total_cost_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(u.revenue_eur).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">€{Number(u.cost_per_unit_eur).toFixed(4)}</TableCell>
                        <TableCell className="text-right font-mono">{Number(u.contribution_margin_pct).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
