import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, DollarSign, ShoppingBag, ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EarningRow {
  id: string;
  amount_neurons: number;
  created_at: string;
  status: string;
  asset_id: string | null;
  asset_title?: string;
  buyer_display?: string;
}

export default function MarketplaceEarnings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0, count: 0, assets: 0 });

  useEffect(() => {
    if (!user) return;
    loadEarnings();
  }, [user]);

  const loadEarnings = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch transactions where user is seller
    const { data: txs } = await supabase
      .from("asset_transactions")
      .select("id, amount_neurons, created_at, status, asset_id")
      .eq("seller_id", user.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!txs || txs.length === 0) {
      setEarnings([]);
      setStats({ total: 0, thisMonth: 0, count: 0, assets: 0 });
      setLoading(false);
      return;
    }

    // Get asset titles
    const assetIds = [...new Set(txs.map(t => t.asset_id).filter(Boolean))];
    let assetMap: Record<string, string> = {};
    if (assetIds.length > 0) {
      const { data: assets } = await supabase
        .from("knowledge_assets")
        .select("id, title")
        .in("id", assetIds as string[]);
      if (assets) {
        assetMap = Object.fromEntries(assets.map(a => [a.id, a.title]));
      }
    }

    const rows: EarningRow[] = txs.map(tx => ({
      ...tx,
      asset_title: tx.asset_id ? assetMap[tx.asset_id] || "Asset" : "Unknown",
    }));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = rows.reduce((s, r) => s + r.amount_neurons, 0);
    const thisMonth = rows
      .filter(r => new Date(r.created_at) >= monthStart)
      .reduce((s, r) => s + r.amount_neurons, 0);

    setEarnings(rows);
    setStats({ total, thisMonth, count: rows.length, assets: assetIds.length });
    setLoading(false);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <SEOHead title="Marketplace Earnings" description="Track your marketplace sales revenue" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Câștiguri Marketplace</h1>
            <p className="text-xs text-muted-foreground">Veniturile tale din vânzări de assets</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total câștigat", value: `${stats.total.toLocaleString()} N`, icon: DollarSign, accent: true },
            { label: "Luna aceasta", value: `${stats.thisMonth.toLocaleString()} N`, icon: TrendingUp, accent: false },
            { label: "Vânzări totale", value: stats.count.toString(), icon: ShoppingBag, accent: false },
            { label: "Assets vândute", value: stats.assets.toString(), icon: Package, accent: false },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "rounded-xl border p-4",
                stat.accent
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={cn("h-4 w-4", stat.accent ? "text-primary" : "text-muted-foreground")} />
                <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              </div>
              <p className={cn("text-lg font-bold", stat.accent ? "text-primary" : "text-foreground")}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transactions List */}
        {earnings.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nicio vânzare încă</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Publică assets pe marketplace pentru a genera venit</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/marketplace/drafts")}>
              Gestionează Drafts
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tranzacții recente</p>
            {earnings.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.asset_title}</p>
                  <p className="text-micro text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                  +{tx.amount_neurons} N
                </Badge>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
