/**
 * PurchaseHistory — Purchase history with spending analytics.
 */
import { useState } from "react";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Search, Loader2, Zap, Layers, Server, Coins, TrendingUp, CheckCircle2,
  XCircle, Clock, BarChart3, ArrowRight, Package,
} from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const LEVEL_META: Record<string, { icon: typeof Zap; color: string; label: string }> = {
  L3: { icon: Zap, color: "text-emerald-500", label: "Quick" },
  L2: { icon: Layers, color: "text-blue-500", label: "Pack" },
  L1: { icon: Server, color: "text-purple-500", label: "Master" },
};

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2,
  running: Clock,
  failed: XCircle,
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--primary) / 0.7)", "hsl(var(--primary) / 0.4)"];

export default function PurchaseHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading } = usePurchaseHistory(200);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Trebuie să fii autentificat.</p>
        <Button onClick={() => navigate("/auth")}>Autentificare</Button>
      </div>
    );
  }

  const { purchases = [], stats } = data || { purchases: [], stats: { totalSpent: 0, totalPurchases: 0, byLevel: {}, byMonth: [] } };

  const filtered = search.trim()
    ? purchases.filter(p => p.service_name?.toLowerCase().includes(search.toLowerCase()))
    : purchases;

  const levelData = Object.entries(stats.byLevel).map(([level, v]) => ({
    name: LEVEL_META[level]?.label || level,
    spent: v.spent,
    count: v.count,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Istoric Achiziții</h1>
          <p className="text-sm text-muted-foreground mt-1">Toate serviciile executate și cheltuielile</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total cheltuieli", value: `${stats.totalSpent}N`, icon: Coins, color: "text-primary" },
            { label: "Achiziții", value: stats.totalPurchases, icon: Package },
            { label: "Nivel preferat", value: Object.entries(stats.byLevel).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || "—", icon: TrendingUp },
            { label: "Cost mediu", value: stats.totalPurchases > 0 ? `${Math.round(stats.totalSpent / stats.totalPurchases)}N` : "—", icon: BarChart3 },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <k.icon className={cn("h-3.5 w-3.5", k.color || "text-muted-foreground")} />
                <span className="text-nano text-muted-foreground">{k.label}</span>
              </div>
              <p className="text-lg font-bold">{k.value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        {(stats.byMonth.length > 1 || levelData.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Monthly spending chart */}
            {stats.byMonth.length > 1 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-3">Cheltuieli lunare (N)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stats.byMonth}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} width={40} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value: number) => [`${value}N`, "Cheltuieli"]}
                    />
                    <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                      {stats.byMonth.map((_, i) => (
                        <Cell key={i} fill="hsl(var(--primary))" fillOpacity={0.7 + (i / stats.byMonth.length) * 0.3} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Level distribution */}
            {levelData.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-3">Distribuție pe nivel</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={levelData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={50} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(value: number, name: string) => [name === "spent" ? `${value}N` : value, name === "spent" ? "Cheltuieli" : "Execuții"]}
                    />
                    <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                      {levelData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Caută serviciu..." className="h-8 text-xs pl-8" />
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length} rezultate</span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {purchases.length === 0 ? "Nu ai nicio achiziție încă." : "Niciun rezultat pentru căutare."}
            </p>
            {purchases.length === 0 && (
              <Button variant="outline" onClick={() => navigate("/services-catalog")} className="gap-1.5">
                Explorează servicii <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">Serviciu</TableHead>
                  <TableHead className="text-micro">Nivel</TableHead>
                  <TableHead className="text-micro text-right">Cost</TableHead>
                  <TableHead className="text-micro">Execuție</TableHead>
                  <TableHead className="text-micro">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => {
                  const meta = LEVEL_META[p.service_level] || { icon: Zap, color: "text-muted-foreground", label: p.service_level };
                  const LevelIcon = meta.icon;
                  const StatusIcon = STATUS_ICON[p.execution_status] || Clock;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">{p.service_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-nano gap-1", meta.color)}>
                          <LevelIcon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-right">{p.neuroni_cost_snapshot}N</TableCell>
                      <TableCell>
                        <Badge
                          variant={p.execution_status === "completed" ? "default" : p.execution_status === "failed" ? "destructive" : "secondary"}
                          className="text-nano gap-1"
                        >
                          <StatusIcon className="h-3 w-3" /> {p.execution_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), "dd MMM yyyy, HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
