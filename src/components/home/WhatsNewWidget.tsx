import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  new_feature: "Feature",
  improvement: "Improvement",
  bug_fix: "Bug Fix",
  ui_ux: "UI/UX",
  performance: "Performance",
  integration: "Integration",
  documentation: "Docs",
};

interface ChangelogEntry {
  id: string;
  title: string;
  category: string;
  version: string;
  release_date: string;
}

export function WhatsNewWidget() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  useEffect(() => {
    supabase
      .from("changelog_entries")
      .select("id, title, category, version, release_date")
      .eq("status", "published")
      .order("release_date", { ascending: false })
      .order("position", { ascending: true })
      .limit(3)
      .then(({ data }) => setEntries((data as ChangelogEntry[]) || []));
  }, []);

  if (entries.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ScrollText className="h-3 w-3" /> What's New
        </h3>
        <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1" onClick={() => navigate("/changelog")}>
          Changelog <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
      <div className="space-y-1.5">
        {entries.map((e) => (
          <button
            key={e.id}
            onClick={() => navigate("/changelog")}
            className="w-full flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors text-left"
          >
            <span className={cn(
              "text-[8px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0",
              e.category === "new_feature" ? "bg-primary/10 text-primary" :
              e.category === "bug_fix" ? "bg-destructive/10 text-destructive" :
              "bg-muted text-muted-foreground"
            )}>
              {CATEGORY_LABELS[e.category] || e.category}
            </span>
            <span className="text-xs truncate flex-1">{e.title}</span>
            <span className="text-[9px] text-muted-foreground font-mono shrink-0">{e.version}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
