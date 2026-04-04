import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface ConsumptionChartProps {
  transactions: Transaction[];
}

export function ConsumptionChart({ transactions }: ConsumptionChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const days: Record<string, { spent: number; earned: number }> = {};

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      days[key] = { spent: 0, earned: 0 };
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    transactions.forEach(tx => {
      const d = new Date(tx.created_at);
      if (d < thirtyDaysAgo) return;
      const key = d.toISOString().slice(5, 10);
      if (!days[key]) return;
      if (tx.amount < 0) days[key].spent += Math.abs(tx.amount);
      else if (tx.amount > 0) days[key].earned += tx.amount;
    });

    return Object.entries(days).map(([date, vals]) => ({
      date,
      spent: vals.spent,
      earned: vals.earned,
    }));
  }, [transactions]);

  const totalSpent30d = chartData.reduce((s, d) => s + d.spent, 0);
  const totalEarned30d = chartData.reduce((s, d) => s + d.earned, 0);
  const maxVal = Math.max(...chartData.map(d => Math.max(d.spent, d.earned)), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">
          30-Day Activity
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-micro text-muted-foreground">Spent: <span className="font-mono font-bold text-destructive">-{totalSpent30d}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-status-validated" />
            <span className="text-micro text-muted-foreground">Earned: <span className="font-mono font-bold text-status-validated">+{totalEarned30d}</span></span>
          </div>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={0} barCategoryGap="20%">
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis hide domain={[0, maxVal * 1.1]} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              formatter={(value: number, name: string) => [
                `${name === 'spent' ? '-' : '+'}${value}`,
                name === 'spent' ? 'Spent' : 'Earned'
              ]}
            />
            <Bar dataKey="spent" radius={[2, 2, 0, 0]} fill="hsl(var(--destructive))" opacity={0.8} />
            <Bar dataKey="earned" radius={[2, 2, 0, 0]} fill="hsl(var(--status-validated))" opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
