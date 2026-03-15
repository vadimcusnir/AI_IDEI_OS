import { Award, MessageSquare, Users, TrendingUp } from "lucide-react";
import { useUserKarma } from "@/hooks/useForum";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

function getKarmaTier(karma: number) {
  if (karma >= 10000) return { label: "Legend", color: "text-graph-highlight" };
  if (karma >= 5000) return { label: "Expert", color: "text-status-validated" };
  if (karma >= 2000) return { label: "Veteran", color: "text-primary" };
  if (karma >= 500) return { label: "Regular", color: "text-primary" };
  if (karma >= 100) return { label: "Contributor", color: "text-info" };
  return { label: "Newcomer", color: "text-muted-foreground" };
}

export function CommunityStats() {
  const { user } = useAuth();
  const { data: karma } = useUserKarma(user?.id);

  if (!user || !karma) return null;

  const tier = getKarmaTier(karma.karma);

  return (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-1.5">
        <Award className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">{karma.karma}</span>
        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${tier.color}`}>{tier.label}</Badge>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        <span>{karma.threads_created} threads</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span>{karma.posts_created} posts</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>{karma.solutions_given} solutions</span>
      </div>
    </div>
  );
}
