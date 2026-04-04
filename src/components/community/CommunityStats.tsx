import { Award, MessageSquare, Users, TrendingUp } from "lucide-react";
import { useUserKarma } from "@/hooks/useForum";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

function getKarmaTier(karma: number) {
  if (karma >= 10000) return { labelKey: "community.tier_legend", color: "text-graph-highlight" };
  if (karma >= 5000) return { labelKey: "community.tier_expert", color: "text-status-validated" };
  if (karma >= 2000) return { labelKey: "community.tier_veteran", color: "text-primary" };
  if (karma >= 500) return { labelKey: "community.tier_regular", color: "text-primary" };
  if (karma >= 100) return { labelKey: "community.tier_contributor", color: "text-info" };
  return { labelKey: "community.tier_newcomer", color: "text-muted-foreground" };
}

export function CommunityStats() {
  const { user } = useAuth();
  const { data: karma } = useUserKarma(user?.id);
  const { t } = useTranslation("common");

  if (!user || !karma) return null;

  const tier = getKarmaTier(karma.karma);

  return (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-1.5">
        <Award className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">{karma.karma}</span>
        <Badge variant="outline" className={`text-nano px-1 py-0 ${tier.color}`}>{t(tier.labelKey)}</Badge>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-1 text-micro text-muted-foreground">
        <MessageSquare className="h-3 w-3" />
        <span>{karma.threads_created} {t("community.threads")}</span>
      </div>
      <div className="flex items-center gap-1 text-micro text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span>{karma.posts_created} {t("community.posts")}</span>
      </div>
      <div className="flex items-center gap-1 text-micro text-muted-foreground">
        <Users className="h-3 w-3" />
        <span>{karma.solutions_given} {t("community.solutions")}</span>
      </div>
    </div>
  );
}
