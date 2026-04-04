import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Rocket, Zap, Brain, Lightbulb, Bug, Sparkles } from "lucide-react";
import type { ForumCategory } from "@/hooks/useForum";

const ICON_MAP: Record<string, React.ElementType> = {
  rocket: Rocket,
  zap: Zap,
  brain: Brain,
  lightbulb: Lightbulb,
  bug: Bug,
  sparkles: Sparkles,
  "message-square": MessageSquare,
};

interface CategoryListProps {
  categories: ForumCategory[];
  onSelect: (slug: string) => void;
}

export function CategoryList({ categories, onSelect }: CategoryListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || MessageSquare;
        return (
          <Card
            key={cat.id}
            className="cursor-pointer hover:border-primary/50 transition-all group hover:shadow-md"
            onClick={() => onSelect(cat.slug)}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
                <div className="flex gap-3 mt-2 text-micro text-muted-foreground">
                  <span>{cat.thread_count} threads</span>
                  <span>{cat.post_count} posts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
