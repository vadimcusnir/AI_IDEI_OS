import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { AUTOMATION_TEMPLATES, type AutomationTemplate } from "@/data/automationTemplates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Zap, ArrowRight, ExternalLink,
  Rss, BarChart3, ShoppingBag, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  all: { label: "All", icon: Zap },
  ingestion: { label: "Ingestion", icon: Rss },
  distribution: { label: "Distribution", icon: ExternalLink },
  monitoring: { label: "Monitoring", icon: AlertTriangle },
  analytics: { label: "Analytics", icon: BarChart3 },
  marketplace: { label: "Marketplace", icon: ShoppingBag },
};

function TemplateCard({ template }: { template: AutomationTemplate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">{template.name}</h3>
        <Badge variant="outline" className="text-micro shrink-0">
          {template.platform === "both" ? "Zapier + Make" : template.platform}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        {template.description}
      </p>

      {/* Flow visualization */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-micro">
            TRIGGER
          </Badge>
          <span className="text-foreground">{template.trigger.app}</span>
          <span className="text-muted-foreground">→ {template.trigger.event}</span>
        </div>
        {template.actions.map((action, i) => (
          <div key={i} className="flex items-center gap-2 text-xs pl-4">
            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-foreground">{action.app}</span>
            <span className="text-muted-foreground">→ {action.action}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <p className="text-micro text-muted-foreground max-w-[70%]">{template.useCase}</p>
        <Button size="sm" variant="outline" className="text-xs h-7">
          Use Template
        </Button>
      </div>
    </motion.div>
  );
}

export default function AutomationTemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = AUTOMATION_TEMPLATES.filter((t) => {
    const matchesCategory = category === "all" || t.category === category;
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      <SEOHead
        title="Automation Templates | AI-IDEI"
        description="Pre-built Zapier and Make automation templates for AI-IDEI workflows."
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automation Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pre-built workflows for Zapier & Make. Connect AI-IDEI to your stack in minutes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="pl-10"
            />
          </div>
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="h-9">
              {Object.entries(CATEGORY_CONFIG).map(([key, { label }]) => (
                <TabsTrigger key={key} value={key} className="text-xs px-3">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)]">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No templates match your search.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </PageTransition>
  );
}
