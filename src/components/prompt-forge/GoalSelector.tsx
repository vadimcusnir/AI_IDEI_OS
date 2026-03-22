import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  User, FileText, ShoppingBag, Mail, PenTool, LayoutList, Wand2
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  User, FileText, ShoppingBag, Mail, PenTool, LayoutList, Wand2,
};

export const GOALS = [
  { key: "prompt_forge.goal_experience", value: "Extragere experiență", icon: "User", color: "text-primary" },
  { key: "prompt_forge.goal_profile", value: "Descriere profil", icon: "FileText", color: "text-ai-accent" },
  { key: "prompt_forge.product_recommendation", value: "Product Recommendation", icon: "ShoppingBag", color: "text-status-validated" },
  { key: "prompt_forge.content_structuring", value: "Content Structuring", icon: "LayoutList", color: "text-primary" },
  { key: "prompt_forge.sales_copy", value: "Sales Copy", icon: "PenTool", color: "text-destructive" },
  { key: "prompt_forge.email_sequence", value: "Email Sequence", icon: "Mail", color: "text-ai-accent" },
];

interface GoalSelectorProps {
  goal: string;
  onSelect: (goal: string) => void;
}

export function GoalSelector({ goal, onSelect }: GoalSelectorProps) {
  const { t } = useTranslation("pages");

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {t("prompt_forge.goal_label")}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map(g => {
          const Icon = ICON_MAP[g.icon] || Wand2;
          return (
            <button
              key={g.value}
              onClick={() => onSelect(g.value)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left text-xs font-medium transition-all",
                goal === g.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", goal === g.value ? "text-primary" : g.color)} />
              {t(g.key)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
