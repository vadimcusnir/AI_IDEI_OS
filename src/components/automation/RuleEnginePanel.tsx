import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useAutomationRules,
  TRIGGER_EVENTS,
  ACTION_TYPES,
  type AutomationRule,
} from "@/hooks/useAutomationRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Zap, Plus, Trash2, Loader2, Settings2, Bell, RefreshCw, PauseCircle, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, typeof Bell> = {
  notify: Bell,
  retry_job: RefreshCw,
  pause_jobs: PauseCircle,
  email_alert: Mail,
};

export function RuleEnginePanel() {
  const { t } = useTranslation("common");
  const { rules, loading, createRule, deleteRule, toggleRule } = useAutomationRules();
  const [showCreate, setShowCreate] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Settings2 className="h-4 w-4 text-primary" />
          {t("rules.title")}
        </h3>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3" /> {t("rules.new_rule")}
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p>{t("rules.no_rules")}</p>
          <p className="text-xs mt-1">{t("rules.no_rules_hint")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} onToggle={toggleRule.mutate} onDelete={deleteRule.mutate} />
          ))}
        </div>
      )}

      <CreateRuleDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={(data) => {
          createRule.mutate(data);
          setShowCreate(false);
        }}
      />
    </div>
  );
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
}: {
  rule: AutomationRule;
  onToggle: (p: { id: string; is_active: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation("common");
  const trigger = TRIGGER_EVENTS.find((tr) => tr.key === rule.trigger_event);
  const action = ACTION_TYPES.find((a) => a.key === rule.action_type);
  const ActionIcon = ACTION_ICONS[rule.action_type] ?? Zap;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-all",
        rule.is_active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
      )}
    >
      <Switch
        checked={rule.is_active}
        onCheckedChange={(v) => onToggle({ id: rule.id, is_active: v })}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium truncate">{rule.name}</span>
          <Badge variant="outline" className="text-nano shrink-0">
            {trigger ? t(trigger.labelKey) : rule.trigger_event}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-micro text-muted-foreground">
          <ActionIcon className="h-3 w-3" />
          <span>{action ? t(action.labelKey) : rule.action_type}</span>
          {rule.fire_count > 0 && (
            <span className="ml-1">• {rule.fire_count}× {t("rules.triggered_times")}</span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(rule.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function CreateRuleDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<AutomationRule>) => void;
}) {
  const { t } = useTranslation("common");
  const [name, setName] = useState(t("rules.new_rule"));
  const [trigger, setTrigger] = useState("low_credits");
  const [action, setAction] = useState("notify");
  const [threshold, setThreshold] = useState("100");

  const handleCreate = () => {
    onCreate({
      name,
      trigger_event: trigger,
      action_type: action,
      condition: { threshold: Number(threshold) },
      action_config: {},
    });
    setName(t("rules.new_rule"));
    setTrigger("low_credits");
    setAction("notify");
    setThreshold("100");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> {t("rules.create_title")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("rules.name_label")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("rules.trigger_label")}</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_EVENTS.map((tr) => (
                  <SelectItem key={tr.key} value={tr.key} className="text-xs">
                    {t(tr.labelKey)} — {t(tr.descKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("rules.threshold_label")}</Label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="h-8 text-sm max-w-[140px]"
              placeholder="Ex: 100"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("rules.action_label")}</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((a) => (
                  <SelectItem key={a.key} value={a.key} className="text-xs">
                    {t(a.labelKey)} — {t(a.descKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button size="sm" onClick={handleCreate} className="gap-1">
            <Plus className="h-3 w-3" /> {t("rules.create_btn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
