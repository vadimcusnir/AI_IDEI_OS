import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Plus, Loader2, Search, Filter, Download, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplatePicker } from "@/components/neuron/TemplatePicker";
import { ExportImportPanel } from "@/components/ExportImportPanel";
import { NeuronToolbar } from "@/components/neurons/NeuronToolbar";
import { NeuronCard } from "@/components/neurons/NeuronCard";
import { NeuronFolderSidebar, useNeuronFolders } from "@/components/neuron/NeuronFolderSidebar";
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
  const [showFolders, setShowFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);

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

  const { assignments } = useNeuronFolders();

  // Filter neurons by selected folder
  const folderFilteredNeurons = useMemo(() => {
    if (!selectedFolderId) return groupedNeurons;
    if (selectedFolderId === "__unassigned") {
      const assignedIds = new Set(Object.keys(assignments).map(Number));
      return groupedNeurons.map(g => ({
        ...g,
        items: g.items.filter(n => !assignedIds.has(n.id)),
      })).filter(g => g.items.length > 0);
    }
    const neuronIdsInFolder = new Set(
      Object.entries(assignments)
        .filter(([, fId]) => fId === selectedFolderId)
        .map(([nId]) => Number(nId))
    );
    return groupedNeurons.map(g => ({
      ...g,
      items: g.items.filter(n => neuronIdsInFolder.has(n.id)),
    })).filter(g => g.items.length > 0);
  }, [groupedNeurons, selectedFolderId, assignments]);

  const filteredCount = folderFilteredNeurons.reduce((sum, g) => sum + g.items.length, 0);

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Folder sidebar — slides in/out */}
      <div
        className={cn(
          "shrink-0 border-r border-border bg-card/50 transition-all duration-200 ease-in-out overflow-hidden",
          showFolders ? "w-56" : "w-0 border-r-0"
        )}
      >
        {showFolders && (
          <NeuronFolderSidebar
            neurons={neurons}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onAISuggest={() => setAiSuggesting(true)}
            aiSuggesting={aiSuggesting}
          />
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">

          {/* Page title row with actions */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight">Neuroni</h1>
              {neurons.length > 0 && (
                <div className="flex items-center gap-3 ml-1">
                  {[
                    { label: "Total", value: neurons.length },
                    { label: "Publicați", value: neurons.filter(n => n.status === "published").length, color: "text-status-validated" },
                    { label: "Draft", value: neurons.filter(n => n.status === "draft").length },
                    { label: "Pinned", value: pinnedIds.size, color: "text-primary" },
                  ].filter(s => s.value > 0).map(s => (
                    <div key={s.label} className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">{s.label}</span>
                      <span className={cn("text-xs font-mono font-bold", s.color)}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant={showFolders ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setShowFolders(f => !f)}
                title="Organizare foldere"
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Foldere</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowExportImport(true)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowTemplatePicker(true)}>
                <Plus className="h-3.5 w-3.5" /> Neuron Nou
              </Button>
            </div>
          </div>

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

          {/* Active filters indicators */}
          {(searchResults !== null || (selectedFolderId && selectedFolderId !== "__unassigned")) && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {searchResults !== null && (
                <span className="text-[10px] text-muted-foreground">
                  {searchResults.length} rezultat{searchResults.length !== 1 ? "e" : ""} pentru „{searchQuery}"
                </span>
              )}
              {selectedFolderId && selectedFolderId !== "__unassigned" && (
                <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Folder activ · {filteredCount}
                  <button onClick={() => setSelectedFolderId(null)} className="ml-0.5 hover:text-primary/70">✕</button>
                </span>
              )}
            </div>
          )}

          {/* Neurons */}
          {filteredCount === 0 ? (
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
              ) : selectedFolderId ? (
                <>
                  <Filter className="h-8 w-8 opacity-20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Niciun neuron în acest folder.</p>
                  <Button variant="outline" onClick={() => setSelectedFolderId(null)} className="gap-1.5 text-xs">Arată toți neuronii</Button>
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
              {folderFilteredNeurons.map((group, gi) => (
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
