import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { History, Star, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface HistoryItem {
  id: string;
  goal: string;
  context: string;
  result: string;
  credits_spent: number;
  is_favorite: boolean;
  created_at: string;
}

interface PromptHistoryProps {
  onReuse: (item: HistoryItem) => void;
  refreshKey?: number;
}

export function PromptHistory({ onReuse, refreshKey }: PromptHistoryProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("prompt_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setItems((data as unknown as HistoryItem[]) || []);
        setLoading(false);
      });
  }, [user, refreshKey]);

  const toggleFavorite = async (id: string, current: boolean) => {
    await supabase
      .from("prompt_history")
      .update({ is_favorite: !current })
      .eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: !current } : i));
  };

  if (loading || items.length === 0) return null;

  const visible = expanded ? items : items.slice(0, 3);

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3 hover:text-foreground transition-colors"
      >
        <History className="h-3.5 w-3.5" />
        Istoric ({items.length})
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      <div className="space-y-2">
        {visible.map(item => (
          <div
            key={item.id}
            className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-card/50 group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{item.goal}</p>
              <p className="text-micro text-muted-foreground mt-0.5 line-clamp-1">
                {item.context.slice(0, 80)}...
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-nano text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {format(new Date(item.created_at), "dd MMM HH:mm")}
                </span>
                <span className="text-nano text-muted-foreground">
                  {item.credits_spent} N
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => toggleFavorite(item.id, item.is_favorite)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <Star className={cn("h-3 w-3", item.is_favorite ? "fill-primary text-primary" : "text-muted-foreground")} />
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-micro px-2"
                onClick={() => onReuse(item)}
              >
                Refolosește
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
