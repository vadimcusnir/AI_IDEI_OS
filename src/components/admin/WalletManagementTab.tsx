import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface WalletRow {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  updated_at: string;
  email?: string;
}

interface RecentTx {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export function WalletManagementTab() {
  const { t } = useTranslation("common");
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [recentTx, setRecentTx] = useState<RecentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ circulating: 0, spent: 0, earned: 0, users: 0 });

  const load = async () => {
    setLoading(true);
    const [walletsRes, txRes, profilesRes] = await Promise.all([
      supabase.from("user_credits").select("*").order("balance", { ascending: false }).limit(50),
      supabase.from("credit_transactions").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("profiles").select("id, email"),
    ]);

    const emailMap = new Map<string, string>();
    (profilesRes.data || []).forEach((p: any) => { if (p.email) emailMap.set(p.id, p.email); });

    const w = ((walletsRes.data as WalletRow[]) || []).map(row => ({
      ...row,
      email: emailMap.get(row.user_id) || undefined,
    }));
    setWallets(w);
    setRecentTx((txRes.data as RecentTx[]) || []);
    setTotals({
      circulating: w.reduce((s, r) => s + r.balance, 0),
      spent: w.reduce((s, r) => s + r.total_spent, 0),
      earned: w.reduce((s, r) => s + r.total_earned, 0),
      users: w.length,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Wallet} label={t("admin.circulating")} value={totals.circulating} color="text-primary" />
        <SummaryCard icon={TrendingUp} label={t("admin.total_earned")} value={totals.earned} />
        <SummaryCard icon={TrendingDown} label={t("admin.total_spent")} value={totals.spent} color="text-destructive" />
        <SummaryCard icon={DollarSign} label={t("admin.est_revenue")} value={`$${(totals.spent * 0.01).toFixed(2)}`} color="text-primary" />
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-3 w-3" /> {t("admin.user_wallets")}
          </h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} /> {t("admin.refresh")}
          </Button>
        </div>
        <div className="overflow-auto max-h-[350px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-micro">{t("admin.user_id")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.balance")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.earned")}</TableHead>
                <TableHead className="text-micro text-right">{t("admin.spent")}</TableHead>
                <TableHead className="text-micro">{t("admin.last_update")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map(w => (
                <TableRow key={w.user_id}>
                  <TableCell>
                    <div>
                      <p className="text-micro font-medium">{w.email || "—"}</p>
                      <p className="text-nano font-mono text-muted-foreground">{w.user_id.substring(0, 8)}…</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-right font-bold text-primary">{w.balance}</TableCell>
                  <TableCell className="text-xs font-mono text-right">{w.total_earned}</TableCell>
                  <TableCell className="text-xs font-mono text-right text-destructive">{w.total_spent}</TableCell>
                  <TableCell className="text-micro text-muted-foreground">
                    {new Date(w.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("admin.recent_transactions")}
        </h3>
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto font-mono text-dense">
          {recentTx.map(tx => (
            <div key={tx.id} className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded",
              tx.amount > 0 ? "hover:bg-primary/5" : "hover:bg-destructive/5"
            )}>
              <span className={cn(
                "text-xs font-bold w-16 text-right",
                tx.amount > 0 ? "text-primary" : "text-destructive"
              )}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </span>
              <span className={cn(
                "text-nano px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0"
              )}>{tx.type}</span>
              <span className="text-xs truncate flex-1">{tx.description}</span>
              <span className="text-micro text-muted-foreground shrink-0">
                {new Date(tx.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-xl font-bold font-mono", color)}>{value}</p>
    </div>
  );
}
