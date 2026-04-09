/**
 * SkillRadar — Visual representation of user's knowledge mastery by neuron category.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Radar } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CategoryCount {
  category: string;
  count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  insight: "Insights",
  framework: "Frameworks",
  strategy: "Strategii",
  formula: "Formule",
  pattern: "Patterns",
  narrative: "Narativ",
  psychological: "Psihologic",
  commercial: "Comercial",
};

export function SkillRadar() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("neurons")
        .select("content_category")
        .eq("author_id", user.id)
        .not("content_category", "is", null);

      const map = new Map<string, number>();
      (data || []).forEach(n => {
        const cat = (n.content_category as string) || "other";
        map.set(cat, (map.get(cat) || 0) + 1);
      });

      const sorted = Array.from(map.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setCategories(sorted);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxCount = Math.max(...categories.map(c => c.count), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Radar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Knowledge Mastery</h3>
      </div>

      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Extrage neuroni pentru a vedea distribuția cunoștințelor tale.
        </p>
      ) : (
        <div className="space-y-2.5">
          {categories.map((cat, i) => {
            const pct = Math.round((cat.count / maxCount) * 100);
            return (
              <motion.div
                key={cat.category}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-micro font-medium">
                    {CATEGORY_LABELS[cat.category] || cat.category}
                  </span>
                  <span className="text-nano font-mono text-muted-foreground">{cat.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      i === 0 ? "bg-primary" : i < 3 ? "bg-primary/70" : "bg-primary/40"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
