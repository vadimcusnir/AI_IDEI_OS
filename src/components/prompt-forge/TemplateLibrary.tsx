import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  title: string;
  description: string;
  goal: string;
  context_template: string;
  details_template: string;
  category: string;
  use_count: number;
}

interface TemplateLibraryProps {
  onSelect: (template: Template) => void;
}

export function TemplateLibrary({ onSelect }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("prompt_templates")
      .select("*")
      .eq("is_public", true)
      .order("use_count", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setTemplates((data as unknown as Template[]) || []);
        setLoading(false);
      });
  }, []);

  if (loading || templates.length === 0) return null;

  const visible = expanded ? templates : templates.slice(0, 4);

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3 hover:text-foreground transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        Template-uri rapide ({templates.length})
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visible.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={cn(
              "text-left p-3 rounded-lg border border-border bg-card/50",
              "hover:border-primary/30 hover:bg-primary/5 transition-all"
            )}
          >
            <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
            <p className="text-micro text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
            <span className="inline-block mt-1.5 text-nano px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {t.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
