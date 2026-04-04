import { useEffect, useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Database, Table2, Link2, Layers, ArrowRight, Loader2,
  Shield, Lock, Unlock, BarChart3,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface TableInfo {
  name: string;
  category: string;
  columns: number;
  hasRLS: boolean;
  relationsOut: string[];
}

const TABLE_CATALOG: TableInfo[] = [
  // Auth & Users
  { name: "profiles", category: "Auth", columns: 12, hasRLS: true, relationsOut: [] },
  { name: "user_roles", category: "Auth", columns: 3, hasRLS: true, relationsOut: [] },
  { name: "onboarding_state", category: "Auth", columns: 6, hasRLS: true, relationsOut: [] },
  // Content
  { name: "neurons", category: "Content", columns: 18, hasRLS: true, relationsOut: ["episodes"] },
  { name: "neuron_blocks", category: "Content", columns: 8, hasRLS: true, relationsOut: ["neurons"] },
  { name: "neuron_versions", category: "Content", columns: 6, hasRLS: true, relationsOut: ["neurons"] },
  { name: "neuron_templates", category: "Content", columns: 8, hasRLS: true, relationsOut: [] },
  { name: "neuron_clones", category: "Content", columns: 5, hasRLS: true, relationsOut: ["neurons"] },
  { name: "episodes", category: "Content", columns: 14, hasRLS: true, relationsOut: ["workspaces"] },
  // Knowledge
  { name: "entities", category: "Knowledge", columns: 16, hasRLS: true, relationsOut: ["neurons"] },
  { name: "entity_relations", category: "Knowledge", columns: 5, hasRLS: true, relationsOut: ["entities", "entities"] },
  { name: "entity_content", category: "Knowledge", columns: 9, hasRLS: true, relationsOut: ["entities"] },
  { name: "entity_labels", category: "Knowledge", columns: 6, hasRLS: true, relationsOut: ["entities"] },
  { name: "entity_topics", category: "Knowledge", columns: 3, hasRLS: true, relationsOut: ["entities", "topics"] },
  { name: "topics", category: "Knowledge", columns: 10, hasRLS: true, relationsOut: [] },
  { name: "neuron_embeddings", category: "Knowledge", columns: 4, hasRLS: true, relationsOut: ["neurons"] },
  // Execution
  { name: "neuron_jobs", category: "Execution", columns: 14, hasRLS: true, relationsOut: ["neurons"] },
  { name: "artifacts", category: "Execution", columns: 14, hasRLS: true, relationsOut: ["neuron_jobs", "workspaces"] },
  { name: "artifact_neurons", category: "Execution", columns: 4, hasRLS: true, relationsOut: ["artifacts", "neurons"] },
  // Economy
  { name: "wallet_state", category: "Economy", columns: 10, hasRLS: true, relationsOut: [] },
  { name: "credit_transactions", category: "Economy", columns: 6, hasRLS: true, relationsOut: ["neuron_jobs"] },
  { name: "subscriptions", category: "Economy", columns: 8, hasRLS: true, relationsOut: [] },
  { name: "asset_transactions", category: "Economy", columns: 7, hasRLS: true, relationsOut: ["knowledge_assets"] },
  // Gamification
  { name: "user_xp", category: "Gamification", columns: 6, hasRLS: true, relationsOut: [] },
  { name: "xp_events", category: "Gamification", columns: 6, hasRLS: true, relationsOut: [] },
  { name: "user_streaks", category: "Gamification", columns: 5, hasRLS: true, relationsOut: [] },
  { name: "user_achievements", category: "Gamification", columns: 4, hasRLS: true, relationsOut: ["achievements"] },
  { name: "daily_challenges", category: "Gamification", columns: 9, hasRLS: true, relationsOut: [] },
  { name: "challenge_progress", category: "Gamification", columns: 6, hasRLS: true, relationsOut: ["daily_challenges"] },
  // Community
  { name: "forum_categories", category: "Community", columns: 10, hasRLS: true, relationsOut: [] },
  { name: "forum_threads", category: "Community", columns: 14, hasRLS: true, relationsOut: ["forum_categories"] },
  { name: "forum_posts", category: "Community", columns: 8, hasRLS: true, relationsOut: ["forum_threads"] },
  { name: "forum_votes", category: "Community", columns: 5, hasRLS: true, relationsOut: [] },
  // Admin & Security
  { name: "admin_permissions", category: "Admin", columns: 7, hasRLS: true, relationsOut: [] },
  { name: "compliance_log", category: "Admin", columns: 9, hasRLS: true, relationsOut: [] },
  { name: "emergency_controls", category: "Admin", columns: 10, hasRLS: true, relationsOut: [] },
  { name: "decision_ledger", category: "Admin", columns: 10, hasRLS: true, relationsOut: [] },
  { name: "abuse_events", category: "Admin", columns: 8, hasRLS: true, relationsOut: [] },
  { name: "feature_flags", category: "Admin", columns: 7, hasRLS: true, relationsOut: [] },
  // System
  { name: "runtime_health", category: "System", columns: 10, hasRLS: true, relationsOut: [] },
  { name: "system_config", category: "System", columns: 5, hasRLS: true, relationsOut: [] },
  { name: "notifications", category: "System", columns: 8, hasRLS: true, relationsOut: [] },
  { name: "analytics_events", category: "System", columns: 6, hasRLS: true, relationsOut: [] },
];

const CATEGORIES = [...new Set(TABLE_CATALOG.map(t => t.category))];

const CAT_COLORS: Record<string, string> = {
  Auth: "bg-primary/10 text-primary border-primary/20",
  Content: "bg-accent/50 text-accent-foreground border-accent",
  Knowledge: "bg-primary/10 text-primary border-primary/20",
  Execution: "bg-muted text-muted-foreground border-border",
  Economy: "bg-primary/10 text-primary border-primary/20",
  Gamification: "bg-accent/50 text-accent-foreground border-accent",
  Community: "bg-muted text-muted-foreground border-border",
  Admin: "bg-destructive/10 text-destructive border-destructive/20",
  System: "bg-muted text-muted-foreground border-border",
};

export default function DatabaseRelations() {
  const [filter, setFilter] = useState<string | null>(null);
  const { t } = useTranslation("pages");

  const filtered = filter
    ? TABLE_CATALOG.filter(t => t.category === filter)
    : TABLE_CATALOG;

  const totalRelations = TABLE_CATALOG.reduce((sum, t) => sum + t.relationsOut.length, 0);
  const rlsCount = TABLE_CATALOG.filter(t => t.hasRLS).length;

  return (
    <PageTransition>
      <div className="flex-1 overflow-y-auto">
        <SEOHead title={`${t("database_relations.title")} — AI-IDEI`} description={t("database_relations.subtitle")} />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t("database_relations.title")}</h1>
              <p className="text-micro text-muted-foreground">{t("database_relations.subtitle")}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: t("database_relations.tables"), value: TABLE_CATALOG.length, icon: Table2 },
              { label: t("database_relations.relations"), value: totalRelations, icon: Link2 },
              { label: t("database_relations.rls_active"), value: `${rlsCount}/${TABLE_CATALOG.length}`, icon: Shield },
              { label: t("database_relations.categories"), value: CATEGORIES.length, icon: Layers },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <s.icon className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold font-mono">{s.value}</p>
                <p className="text-nano text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "px-2.5 py-1 rounded-full text-micro font-medium transition-colors",
                !filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t("database_relations.all")} ({TABLE_CATALOG.length})
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(filter === cat ? null : cat)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-micro font-medium transition-colors",
                  filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {cat} ({TABLE_CATALOG.filter(t => t.category === cat).length})
              </button>
            ))}
          </div>

          {/* Table list */}
          <div className="space-y-1.5">
            {filtered.map(table => (
              <div key={table.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Table2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-medium">{table.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-nano text-muted-foreground">{t("database_relations.cols", { count: table.columns })}</span>
                    {table.relationsOut.length > 0 && (
                      <span className="text-nano text-muted-foreground flex items-center gap-0.5">
                        <ArrowRight className="h-2.5 w-2.5" />
                        {table.relationsOut.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-nano px-1.5 py-0 h-4", CAT_COLORS[table.category])}>
                  {table.category}
                </Badge>
                {table.hasRLS ? (
                  <Lock className="h-3 w-3 text-status-validated shrink-0" />
                ) : (
                  <Unlock className="h-3 w-3 text-destructive shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
