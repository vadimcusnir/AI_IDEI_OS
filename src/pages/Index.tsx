import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Search, Filter, Brain, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplatePicker } from "@/components/neuron/TemplatePicker";
import { ExportImportPanel } from "@/components/ExportImportPanel";
import { NeuronToolbar } from "@/components/neurons/NeuronToolbar";
import { NeuronCard } from "@/components/neurons/NeuronCard";
import { useNeuronList } from "@/hooks/useNeuronList";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.gif";

const STATUS_DOTS: Record<string, string> = {
  draft: "bg-muted-foreground/40",
  active: "bg-primary",
  published: "bg-status-validated",
  archived: "bg-muted-foreground/30",
};

export default function Index() {
  const navigate = useNavigate();
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  const {
    neurons, loading, authLoading,
    viewMode, setViewMode,
    sortField, sortDir, toggleSort,
    groupBy, setGroupBy,
    filterStatus, setFilterStatus,
    pinnedIds, togglePin,
    searchQuery, searchResults, searching, handleSearch, clearSearch,
    handleDelete,
    processedNeurons, groupedNeurons, statuses,
  } = useNeuronList();

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header bar */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h1 className="text-sm font-semibold">Neuroni</h1>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-mono">
            {neurons.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowExportImport(true)}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setShowTemplatePicker(true)}>
            <Plus className="h-3.5 w-3.5" /> Neuron Nou
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

          {/* Stats row */}
          {neurons.length > 0 && (
            <div className="flex items-center gap-4 mb-5">
              {[
                { label: "Total", value: neurons.length },
                { label: "Publicați", value: neurons.filter(n => n.status === "published").length, color: "text-status-validated" },
                { label: "Draft", value: neurons.filter(n => n.status === "draft").length },
                { label: "Pinned", value: pinnedIds.size, color: "text-primary" },
              ].filter(s => s.value > 0).map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{s.label}</span>
                  <span className={cn("text-sm font-mono font-bold", s.color)}>{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <NeuronToolbar
            searchQuery={searchQuery}
            searching={searching}
            onSearch={handleSearch}
            onClearSearch={clearSearch}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            sortField={sortField}
            sortDir={sortDir}
            onToggleSort={toggleSort}
            groupBy={groupBy}
            onSetGroupBy={setGroupBy}
            filterStatus={filterStatus}
            onSetFilterStatus={setFilterStatus}
            statuses={statuses}
          />

          {/* Search indicator */}
          {searchResults !== null && (
            <p className="text-[10px] text-muted-foreground mb-3">
              {searchResults.length} rezultat{searchResults.length !== 1 ? "e" : ""} pentru „{searchQuery}"
            </p>
          )}

          {/* Neurons */}
          {processedNeurons.length === 0 ? (
            <div className="text-center py-20">
              {searchResults !== null ? (
                <>
                  <Search className="h-8 w-8 opacity-20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Niciun neuron nu corespunde căutării.</p>
                  <Button variant="outline" onClick={clearSearch} className="gap-1.5 text-xs">Șterge căutarea</Button>
                </>
              ) : filterStatus ? (
                <>
                  <Filter className="h-8 w-8 opacity-20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Niciun neuron „{filterStatus}".</p>
                  <Button variant="outline" onClick={() => setFilterStatus(null)} className="gap-1.5 text-xs">Șterge filtrul</Button>
                </>
              ) : (
                <>
                  <img src={logo} className="h-12 w-12 opacity-30 mx-auto mb-4" alt="" />
                  <h3 className="text-lg font-serif font-medium mb-2">Niciun neuron încă</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Creează primul tău atom de cunoaștere. Extrage idei, structurează-le și transformă-le în active digitale.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={() => setShowTemplatePicker(true)} className="gap-1.5">
                      <Plus className="h-4 w-4" /> Creează Neuron
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/extractor")} className="gap-1.5">
                      Extractor
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {groupedNeurons.map((group, gi) => (
                <div key={gi}>
                  {group.label && (
                    <div className="flex items-center gap-2 mb-2 mt-2">
                      <div className={cn("h-2 w-2 rounded-full", STATUS_DOTS[group.label] || "bg-muted-foreground/30")} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                      <span className="text-[9px] text-muted-foreground/40">{group.items.length}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                  )}
                  <div className={cn(
                    viewMode === "list" && "space-y-0.5",
                    viewMode === "grid" && "grid grid-cols-2 sm:grid-cols-3 gap-2",
                    viewMode === "cards" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
                  )}>
                    {group.items.map(n => (
                      <NeuronCard
                        key={n.id}
                        neuron={n}
                        viewMode={viewMode}
                        isPinned={pinnedIds.has(n.id)}
                        onTogglePin={togglePin}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TemplatePicker isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} />
      <ExportImportPanel isOpen={showExportImport} onClose={() => setShowExportImport(false)} />
    </div>
  );
}
