import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronRight, ChevronDown, Network, Link2, AtSign,
  GitBranch, Zap, FolderTree, Search, Plus, X, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeuronLink, GraphAddress } from "@/hooks/useNeuronGraph";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NeuronLeftPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  neuronId?: number;
  links: NeuronLink[];
  addresses: GraphAddress[];
  loadingLinks: boolean;
  onAddLink?: (targetId: number, relationType: string) => void;
  onRemoveLink?: (linkId: string) => void;
}

function AddressTree({ addresses }: { addresses: GraphAddress[] }) {
  if (addresses.length === 0) {
    return (
      <div className="text-micro text-muted-foreground/50 px-2 py-2">
        No graph position assigned yet.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {addresses.map(addr => {
        const levels = [addr.domain, addr.level1, addr.level2, addr.level3, addr.level4].filter(Boolean);
        return (
          <div key={addr.id} className="px-1.5">
            {levels.map((level, depth) => (
              <div
                key={depth}
                className={cn(
                  "flex items-center gap-1.5 py-0.5 text-xs",
                  depth === levels.length - 1
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
                style={{ paddingLeft: `${depth * 12 + 6}px` }}
              >
                {depth < levels.length - 1 ? (
                  <ChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                  <Zap className="h-3 w-3 shrink-0 text-primary" />
                )}
                {depth === 0 ? (
                  <FolderTree className="h-3 w-3 shrink-0" />
                ) : (
                  <Network className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{level}</span>
              </div>
            ))}
            <div className="text-nano font-mono text-muted-foreground/40 pl-6 mt-0.5">
              {addr.path}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LinkSection({
  title,
  icon: Icon,
  items,
  direction,
  onRemoveLink,
}: {
  title: string;
  icon: React.ElementType;
  items: NeuronLink[];
  direction: "outgoing" | "incoming";
  onRemoveLink?: (linkId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const filtered = items.filter(l => l.direction === direction);
  if (filtered.length === 0) return null;

  return (
    <div className="panel-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="panel-section-title flex items-center gap-1.5 w-full text-left"
      >
        <Icon className="h-3 w-3" />
        {title}
        <span className="text-nano bg-muted rounded-full px-1.5 ml-auto">{filtered.length}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 mt-1">
          {filtered.map(item => {
            const displayTitle = direction === "outgoing"
              ? item.targetTitle || `Neuron #${item.targetNeuronId}`
              : item.sourceTitle || `Neuron #${item.sourceNeuronId}`;
            const targetNumber = direction === "outgoing" ? item.targetNeuronId : item.sourceNeuronId;

            return (
              <div
                key={item.id}
                className="group/link w-full flex items-center gap-2 py-1 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => navigate(`/n/${targetNumber}`)}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left"
                >
                  <Zap className="h-3 w-3 shrink-0 text-primary/50" />
                  <span className="truncate flex-1">{displayTitle}</span>
                  <span className="text-nano text-muted-foreground/60">{item.relationType}</span>
                </button>
                {onRemoveLink && (
                  <button
                    onClick={() => onRemoveLink(item.id)}
                    className="h-4 w-4 flex items-center justify-center opacity-0 group-hover/link:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddLinkForm({ neuronId, onAddLink }: { neuronId?: number; onAddLink?: (targetId: number, relationType: string) => void }) {
  const { t } = useTranslation("common");
  const [isOpen, setIsOpen] = useState(false);
  const [targetNumber, setTargetNumber] = useState("");
  const [relationType, setRelationType] = useState("supports");
  const [adding, setAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: number; number: number; title: string }[]>([]);

  const searchNeurons = useCallback(async (query: string) => {
    if (!query.trim()) { setSuggestions([]); return; }
    const isNum = /^\d+$/.test(query);
    let q = supabase.from("neurons").select("id, number, title").limit(5);
    if (isNum) {
      q = q.eq("number", parseInt(query));
    } else {
      q = q.ilike("title", `%${query}%`);
    }
    const { data } = await q;
    setSuggestions((data || []).filter(n => n.id !== neuronId));
  }, [neuronId]);

  const handleAdd = async (targetId: number) => {
    if (!onAddLink) return;
    setAdding(true);
    onAddLink(targetId, relationType);
    setTargetNumber("");
    setSuggestions([]);
    setIsOpen(false);
    setAdding(false);
  };

  if (!isOpen) {
    return (
      <div className="px-3 py-2">
        <Button variant="ghost" size="sm" className="w-full h-7 text-micro gap-1" onClick={() => setIsOpen(true)}>
          <Plus className="h-3 w-3" /> Add Link
        </Button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">Add Link</span>
        <button onClick={() => { setIsOpen(false); setSuggestions([]); }}>
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      <input
        value={targetNumber}
        onChange={e => { setTargetNumber(e.target.value); searchNeurons(e.target.value); }}
        placeholder={t("common:neuron_editor.search_by_number")}
        className="w-full text-xs bg-muted/50 rounded-md px-2 py-1.5 outline-none border border-border focus:border-primary transition-colors"
      />
      {suggestions.length > 0 && (
        <div className="space-y-0.5 max-h-24 overflow-y-auto">
          {suggestions.map(s => (
            <button
              key={s.id}
              onClick={() => handleAdd(s.id)}
              disabled={adding}
              className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-muted/50 transition-colors text-left"
            >
              <Zap className="h-3 w-3 text-primary/50 shrink-0" />
              <span className="font-mono text-micro text-muted-foreground">#{s.number}</span>
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      )}
      <select
        value={relationType}
        onChange={e => setRelationType(e.target.value)}
        className="w-full text-micro bg-muted/50 rounded-md px-2 py-1 outline-none border border-border"
      >
        <option value="supports">{t("neuron_editor.rel_supports")}</option>
        <option value="contradicts">{t("neuron_editor.rel_contradicts")}</option>
        <option value="extends">{t("neuron_editor.rel_extends")}</option>
        <option value="references">{t("neuron_editor.rel_references")}</option>
        <option value="derived_from">{t("neuron_editor.rel_derived_from")}</option>
      </select>
    </div>
  );
}

export function NeuronLeftPanel({
  isCollapsed,
  onToggle,
  neuronId,
  links,
  addresses,
  loadingLinks,
  onAddLink,
  onRemoveLink,
}: NeuronLeftPanelProps) {
  const { t } = useTranslation("common");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLinks = searchQuery
    ? links.filter(l => {
        const title = l.direction === "outgoing" ? l.targetTitle : l.sourceTitle;
        return title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.relationType.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : links;

  const backlinks = filteredLinks.filter(l => l.direction === "incoming");
  const outgoing = filteredLinks.filter(l => l.direction === "outgoing");

  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-border bg-card flex flex-col items-center py-3 gap-3 shrink-0 transition-all duration-200">
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          <Network className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Link2 className="h-4 w-4" />
        </button>
        {links.length > 0 && (
          <span className="text-nano font-mono text-primary">{links.length}</span>
        )}
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <GitBranch className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 border-r border-border bg-card flex flex-col shrink-0 overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border">
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("neuron_editor.knowledge_graph")}</span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
          <Search className="h-3 w-3 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("neuron_editor.search_graph")}
            className="text-xs bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Graph Position */}
        <div className="panel-section">
          <div className="panel-section-title flex items-center gap-1.5">
            <FolderTree className="h-3 w-3" />
            {t("neuron_editor.graph_position")}
          </div>
          <AddressTree addresses={addresses} />
        </div>

        {/* Loading */}
        {loadingLinks && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Add Link */}
        <AddLinkForm neuronId={neuronId} onAddLink={onAddLink} />

        {/* Links */}
        {!loadingLinks && (
          <>
            <LinkSection
              title={t("neuron_editor.outgoing_links")}
              icon={Link2}
              items={filteredLinks}
              direction="outgoing"
              onRemoveLink={onRemoveLink}
            />
            <LinkSection
              title={t("neuron_editor.backlinks")}
              icon={AtSign}
              items={filteredLinks}
              direction="incoming"
              onRemoveLink={onRemoveLink}
            />
          </>
        )}

        {/* Empty state */}
        {!loadingLinks && links.length === 0 && (
          <div className="px-3 py-6 text-center">
            <Network className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-dense text-muted-foreground/50">{t("neuron_editor.no_connections")}</p>
            <p className="text-micro text-muted-foreground/30 mt-1">{t("neuron_editor.no_connections_hint")}</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-border bg-panel-header">
        <div className="grid grid-cols-2 gap-y-1 text-micro">
          <span className="text-muted-foreground">{t("neuron_editor.total_links")}</span>
          <span className="text-right font-medium">{links.length}</span>
          <span className="text-muted-foreground">{t("neuron_editor.outgoing")}</span>
          <span className="text-right font-medium text-primary">{outgoing.length}</span>
          <span className="text-muted-foreground">{t("neuron_editor.backlinks")}</span>
          <span className="text-right font-medium">{backlinks.length}</span>
          <span className="text-muted-foreground">{t("neuron_editor.addresses")}</span>
          <span className="text-right font-medium">{addresses.length}</span>
        </div>
      </div>
    </div>
  );
}
