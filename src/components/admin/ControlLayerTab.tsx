import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Plus, Pencil, RotateCcw, Eye, EyeOff,
  Zap, Shield, Brain, Layers, Clock, AlertTriangle,
  FileText, Settings2, ToggleLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────
interface PromptItem {
  id: string;
  purpose: string;
  category: string;
  core_prompt: string;
  execution_mode: string;
  cost_profile: any;
  scope: string;
  version: number;
  is_active: boolean;
  editable: boolean;
  risk_level: string;
  rollback_version: number | null;
  updated_at: string;
}

interface RegimeItem {
  id: string;
  service_key: string;
  regime: string;
  max_cost_credits: number;
  max_retries: number;
  timeout_seconds: number;
  validation_required: boolean;
  dry_run: boolean;
  cost_cap_action: string;
  fallback_regime: string | null;
  is_active: boolean;
  version: number;
  updated_at: string;
}

interface UIItem {
  id: string;
  element_type: string;
  label: string;
  description: string;
  visible: boolean;
  enabled: boolean;
  sort_order: number;
  permissions: string[];
  version: number;
  updated_at: string;
}

interface ChangeLogEntry {
  id: string;
  registry_type: string;
  item_id: string;
  change_type: string;
  edit_mode: string;
  change_reason: string;
  changed_by: string | null;
  risk_level: string;
  rolled_back: boolean;
  created_at: string;
}

// ─── Risk badge ─────────────────────────────────────
const RiskBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    low: "bg-status-validated/15 text-status-validated",
    medium: "bg-primary/15 text-primary",
    high: "bg-warning/15 text-warning",
    critical: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={cn("text-nano font-semibold uppercase px-1.5 py-0.5 rounded-full", colors[level] || colors.low)}>
      {level}
    </span>
  );
};

const RegimeBadge = ({ regime }: { regime: string }) => {
  const icons: Record<string, React.ElementType> = {
    fast: Zap, balanced: Settings2, strict: Shield, simulation: Eye, emergency: AlertTriangle,
  };
  const Icon = icons[regime] || Settings2;
  return (
    <Badge variant="outline" className="gap-1 text-micro">
      <Icon className="h-2.5 w-2.5" />
      {regime}
    </Badge>
  );
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export function ControlLayerTab() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [subTab, setSubTab] = useState("prompts");
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [regimes, setRegimes] = useState<RegimeItem[]>([]);
  const [uiItems, setUIItems] = useState<UIItem[]>([]);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialogs
  const [editPrompt, setEditPrompt] = useState<PromptItem | null>(null);
  const [editRegime, setEditRegime] = useState<RegimeItem | null>(null);
  const [editUI, setEditUI] = useState<UIItem | null>(null);
  const [newPromptOpen, setNewPromptOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pRes, rRes, uRes, cRes] = await Promise.all([
      supabase.from("prompt_registry" as any).select("*").order("category").order("id"),
      supabase.from("execution_regime_config" as any).select("*").order("service_key"),
      supabase.from("ui_control_registry" as any).select("*").order("sort_order").order("id"),
      supabase.from("control_change_log" as any).select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    if (pRes.data) setPrompts(pRes.data as any);
    if (rRes.data) setRegimes(rRes.data as any);
    if (uRes.data) setUIItems(uRes.data as any);
    if (cRes.data) setChangeLog(cRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Prompt CRUD ──────────────────────────
  const savePrompt = async (prompt: PromptItem) => {
    const { error } = await supabase.from("prompt_registry" as any)
      .update({
        core_prompt: prompt.core_prompt,
        purpose: prompt.purpose,
        category: prompt.category,
        execution_mode: prompt.execution_mode,
        is_active: prompt.is_active,
        risk_level: prompt.risk_level,
        last_modified_by: user?.id,
      } as any)
      .eq("id", prompt.id);
    if (error) toast.error(t("common:prompt_save_failed"));
    else { toast.success(t("common:prompt_updated", { version: prompt.version + 1 })); loadData(); }
    setEditPrompt(null);
  };

  const createPrompt = async (data: { id: string; purpose: string; category: string; core_prompt: string }) => {
    const { error } = await supabase.from("prompt_registry" as any).insert({
      ...data,
      last_modified_by: user?.id,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success(t("common:prompt_created_success")); loadData(); }
    setNewPromptOpen(false);
  };

  const rollbackPrompt = async (promptId: string, toVersion: number) => {
    const { data: ver } = await supabase.from("prompt_versions" as any)
      .select("*").eq("prompt_id", promptId).eq("version", toVersion).single();
    if (!ver) { toast.error(t("common:version_not_found")); return; }
    const { error } = await supabase.from("prompt_registry" as any)
      .update({
        core_prompt: (ver as any).core_prompt,
        modifiers: (ver as any).modifiers,
        execution_mode: (ver as any).execution_mode,
        last_modified_by: user?.id,
      } as any)
      .eq("id", promptId);
    if (error) toast.error(t("common:rollback_failed"));
    else { toast.success(t("common:rolled_back", { version: toVersion })); loadData(); }
  };

  // ─── Regime CRUD ──────────────────────────
  const saveRegime = async (regime: RegimeItem) => {
    const { error } = await supabase.from("execution_regime_config" as any)
      .update({
        regime: regime.regime,
        max_cost_credits: regime.max_cost_credits,
        max_retries: regime.max_retries,
        timeout_seconds: regime.timeout_seconds,
        validation_required: regime.validation_required,
        dry_run: regime.dry_run,
        cost_cap_action: regime.cost_cap_action,
        is_active: regime.is_active,
        last_modified_by: user?.id,
      } as any)
      .eq("id", regime.id);
    if (error) toast.error(t("common:regime_save_failed"));
    else { toast.success(t("common:regime_updated")); loadData(); }
    setEditRegime(null);
  };

  // ─── UI Toggle ────────────────────────────
  const toggleUIItem = async (item: UIItem, field: "visible" | "enabled") => {
    const { error } = await supabase.from("ui_control_registry" as any)
      .update({ [field]: !item[field], last_modified_by: user?.id } as any)
      .eq("id", item.id);
    if (error) toast.error(t("common:update_failed"));
    else loadData();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-micro text-muted-foreground uppercase tracking-wider">Prompts</p>
          <p className="text-lg font-bold">{prompts.length}</p>
          <p className="text-micro text-muted-foreground">{prompts.filter(p => p.is_active).length} active</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-micro text-muted-foreground uppercase tracking-wider">Regimes</p>
          <p className="text-lg font-bold">{regimes.length}</p>
          <p className="text-micro text-muted-foreground">{regimes.filter(r => r.is_active).length} active</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-micro text-muted-foreground uppercase tracking-wider">UI Elements</p>
          <p className="text-lg font-bold">{uiItems.length}</p>
          <p className="text-micro text-muted-foreground">{uiItems.filter(u => u.visible).length} visible</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 border border-border">
          <p className="text-micro text-muted-foreground uppercase tracking-wider">Changes (24h)</p>
          <p className="text-lg font-bold">
            {changeLog.filter(c => new Date(c.created_at) > new Date(Date.now() - 86400000)).length}
          </p>
          <p className="text-micro text-muted-foreground">{changeLog.length} total logged</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="grid grid-cols-4 h-8">
          <TabsTrigger value="prompts" className="text-xs gap-1"><FileText className="h-3 w-3" />Prompts</TabsTrigger>
          <TabsTrigger value="regimes" className="text-xs gap-1"><Settings2 className="h-3 w-3" />Regimes</TabsTrigger>
          <TabsTrigger value="ui" className="text-xs gap-1"><ToggleLeft className="h-3 w-3" />UI</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1"><Clock className="h-3 w-3" />Audit</TabsTrigger>
        </TabsList>

        {/* ═══ PROMPTS TAB ═══ */}
        <TabsContent value="prompts" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{prompts.length} registered prompts</p>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setNewPromptOpen(true)}>
              <Plus className="h-3 w-3" /> Add Prompt
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">ID</TableHead>
                  <TableHead className="text-micro">Category</TableHead>
                  <TableHead className="text-micro">Mode</TableHead>
                  <TableHead className="text-micro">Risk</TableHead>
                  <TableHead className="text-micro">Ver</TableHead>
                  <TableHead className="text-micro">Active</TableHead>
                  <TableHead className="text-micro w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">
                      No prompts registered yet. Add your first prompt to centralize AI behavior.
                    </TableCell>
                  </TableRow>
                ) : prompts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs font-mono">{p.id}</TableCell>
                    <TableCell className="text-xs">{p.category}</TableCell>
                    <TableCell><RegimeBadge regime={p.execution_mode} /></TableCell>
                    <TableCell><RiskBadge level={p.risk_level} /></TableCell>
                    <TableCell className="text-xs font-mono">v{p.version}</TableCell>
                    <TableCell>
                      <span className={cn("h-2 w-2 rounded-full inline-block", p.is_active ? "bg-status-validated" : "bg-muted")} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditPrompt(p)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {p.rollback_version && (
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => rollbackPrompt(p.id, p.rollback_version!)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ═══ REGIMES TAB ═══ */}
        <TabsContent value="regimes" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">{regimes.length} execution regime configs</p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">Service</TableHead>
                  <TableHead className="text-micro">Regime</TableHead>
                  <TableHead className="text-micro">Max Cost</TableHead>
                  <TableHead className="text-micro">Retries</TableHead>
                  <TableHead className="text-micro">Timeout</TableHead>
                  <TableHead className="text-micro">Validation</TableHead>
                  <TableHead className="text-micro">Dry Run</TableHead>
                  <TableHead className="text-micro w-16">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regimes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                      No execution regimes configured. Services use default BALANCED mode.
                    </TableCell>
                  </TableRow>
                ) : regimes.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{r.service_key}</TableCell>
                    <TableCell><RegimeBadge regime={r.regime} /></TableCell>
                    <TableCell className="text-xs">{r.max_cost_credits}</TableCell>
                    <TableCell className="text-xs">{r.max_retries}</TableCell>
                    <TableCell className="text-xs">{r.timeout_seconds}s</TableCell>
                    <TableCell><span className={cn("h-2 w-2 rounded-full inline-block", r.validation_required ? "bg-status-validated" : "bg-muted")} /></TableCell>
                    <TableCell><span className={cn("h-2 w-2 rounded-full inline-block", r.dry_run ? "bg-amber-500" : "bg-muted")} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditRegime(r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ═══ UI TAB ═══ */}
        <TabsContent value="ui" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">{uiItems.length} UI elements registered</p>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-micro">ID</TableHead>
                  <TableHead className="text-micro">Label</TableHead>
                  <TableHead className="text-micro">Type</TableHead>
                  <TableHead className="text-micro">Visible</TableHead>
                  <TableHead className="text-micro">Enabled</TableHead>
                  <TableHead className="text-micro">Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uiItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      No UI elements registered. Register elements to control visibility without code changes.
                    </TableCell>
                  </TableRow>
                ) : uiItems.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-mono">{u.id}</TableCell>
                    <TableCell className="text-xs">{u.label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.element_type}</TableCell>
                    <TableCell>
                      <Switch checked={u.visible} onCheckedChange={() => toggleUIItem(u, "visible")} className="scale-75" />
                    </TableCell>
                    <TableCell>
                      <Switch checked={u.enabled} onCheckedChange={() => toggleUIItem(u, "enabled")} className="scale-75" />
                    </TableCell>
                    <TableCell className="text-xs font-mono">{u.sort_order}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ═══ AUDIT TAB ═══ */}
        <TabsContent value="audit" className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">Last {changeLog.length} control changes</p>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {changeLog.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No changes logged yet.</p>
            ) : changeLog.map(c => (
              <div key={c.id} className={cn(
                "border rounded-lg px-3 py-2 flex items-center gap-3",
                c.rolled_back ? "border-amber-500/30 bg-amber-500/5" : "border-border"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-micro font-mono text-muted-foreground">{c.registry_type}</span>
                    <span className="text-micro font-semibold">{c.item_id}</span>
                    <Badge variant="outline" className="text-nano h-4">{c.change_type}</Badge>
                    <RiskBadge level={c.risk_level} />
                    {c.rolled_back && <Badge variant="destructive" className="text-nano h-4">ROLLED BACK</Badge>}
                  </div>
                  <p className="text-micro text-muted-foreground mt-0.5">
                    {new Date(c.created_at).toLocaleString()} · mode: {c.edit_mode}
                    {c.change_reason && ` · ${c.change_reason}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══ EDIT PROMPT DIALOG ═══ */}
      <Dialog open={!!editPrompt} onOpenChange={(o) => !o && setEditPrompt(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Prompt: {editPrompt?.id}</DialogTitle>
          </DialogHeader>
          {editPrompt && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Purpose</label>
                  <Input value={editPrompt.purpose} onChange={e => setEditPrompt({ ...editPrompt, purpose: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                  <Input value={editPrompt.category} onChange={e => setEditPrompt({ ...editPrompt, category: e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Execution Mode</label>
                  <Select value={editPrompt.execution_mode} onValueChange={v => setEditPrompt({ ...editPrompt, execution_mode: v })}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["fast", "balanced", "strict", "simulation", "emergency"].map(m => (
                        <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Risk Level</label>
                  <Select value={editPrompt.risk_level} onValueChange={v => setEditPrompt({ ...editPrompt, risk_level: v })}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "critical"].map(r => (
                        <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Core Prompt</label>
                <Textarea
                  value={editPrompt.core_prompt}
                  onChange={e => setEditPrompt({ ...editPrompt, core_prompt: e.target.value })}
                  className="mt-1 text-xs font-mono min-h-[200px]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={editPrompt.is_active} onCheckedChange={v => setEditPrompt({ ...editPrompt, is_active: v })} />
                  Active
                </label>
                <span className="text-micro text-muted-foreground">Version: v{editPrompt.version}</span>
                {editPrompt.rollback_version && (
                  <span className="text-micro text-muted-foreground">Rollback to: v{editPrompt.rollback_version}</span>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditPrompt(null)}>Cancel</Button>
            <Button size="sm" onClick={() => editPrompt && savePrompt(editPrompt)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ NEW PROMPT DIALOG ═══ */}
      <NewPromptDialog open={newPromptOpen} onClose={() => setNewPromptOpen(false)} onCreate={createPrompt} />

      {/* ═══ EDIT REGIME DIALOG ═══ */}
      <Dialog open={!!editRegime} onOpenChange={(o) => !o && setEditRegime(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Regime: {editRegime?.service_key}</DialogTitle>
          </DialogHeader>
          {editRegime && (
            <div className="space-y-3">
              <div>
                <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Regime</label>
                <Select value={editRegime.regime} onValueChange={v => setEditRegime({ ...editRegime, regime: v })}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["fast", "balanced", "strict", "simulation", "emergency"].map(m => (
                      <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Max Cost</label>
                  <Input type="number" value={editRegime.max_cost_credits} onChange={e => setEditRegime({ ...editRegime, max_cost_credits: +e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Max Retries</label>
                  <Input type="number" value={editRegime.max_retries} onChange={e => setEditRegime({ ...editRegime, max_retries: +e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
                <div>
                  <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Timeout (s)</label>
                  <Input type="number" value={editRegime.timeout_seconds} onChange={e => setEditRegime({ ...editRegime, timeout_seconds: +e.target.value })} className="mt-1 h-8 text-xs" />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={editRegime.validation_required} onCheckedChange={v => setEditRegime({ ...editRegime, validation_required: v })} />
                  Validation Required
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={editRegime.dry_run} onCheckedChange={v => setEditRegime({ ...editRegime, dry_run: v })} />
                  Dry Run
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={editRegime.is_active} onCheckedChange={v => setEditRegime({ ...editRegime, is_active: v })} />
                  Active
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditRegime(null)}>Cancel</Button>
            <Button size="sm" onClick={() => editRegime && saveRegime(editRegime)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── New Prompt Dialog ──────────────────────
function NewPromptDialog({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { id: string; purpose: string; category: string; core_prompt: string }) => void;
}) {
  const { t } = useTranslation("common");
  const [id, setId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [category, setCategory] = useState("extraction");
  const [corePrompt, setCorePrompt] = useState("");

  const handleCreate = () => {
    if (!id.trim() || !corePrompt.trim()) { toast.error(t("id_prompt_required")); return; }
    onCreate({ id: id.trim(), purpose, category, core_prompt: corePrompt });
    setId(""); setPurpose(""); setCorePrompt("");
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-sm">{t("register_new_prompt")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.prompt_id")}</label>
              <Input value={id} onChange={e => setId(e.target.value)} placeholder={t("admin.prompt_id_placeholder")} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("template.category")}</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["extraction", "analysis", "generation", "transformation", "classification", "general"].map(c => (
                    <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.purpose")}</label>
            <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder={t("admin.purpose_placeholder")} className="mt-1 h-8 text-xs" />
          </div>
          <div>
            <label className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("admin.core_prompt")}</label>
            <Textarea value={corePrompt} onChange={e => setCorePrompt(e.target.value)} placeholder={t("admin.core_prompt_placeholder")} className="mt-1 text-xs font-mono min-h-[150px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>{t("cancel")}</Button>
          <Button size="sm" onClick={handleCreate} disabled={!id.trim() || !corePrompt.trim()}>{t("create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
