import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Plus, Loader2, Search, Filter, Download, FolderTree, PanelRightOpen, Trash2, CheckSquare, XSquare, BarChart3, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplatePicker } from "@/components/neuron/TemplatePicker";
import { ExportImportPanel } from "@/components/ExportImportPanel";
import { NeuronToolbar } from "@/components/neurons/NeuronToolbar";
import { NeuronCard } from "@/components/neurons/NeuronCard";
import { NeuronPreviewPane } from "@/components/neurons/NeuronPreviewPane";
import { NeuronInsights } from "@/components/neurons/NeuronInsights";
import { BulkAIActions } from "@/components/neurons/BulkAIActions";
import { NeuronFolderSidebar, useNeuronFolders } from "@/components/neuron/NeuronFolderSidebar";
import { useNeuronList, NeuronListItem } from "@/hooks/useNeuronList";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";
import { useTranslation } from "react-i18next";
import { FlowTip } from "@/components/onboarding/FlowTip";
import { AnimatePresence } from "framer-motion";
import { useAutoStructure } from "@/hooks/useAutoStructure";

const STATUS_DOTS: Record<string, string> = {
  draft: "bg-muted-foreground/40",
  active: "bg-primary",
  published: "bg-status-validated",
  archived: "bg-muted-foreground/30",
};

export default function Index() {
  const navigate = useNavigate();
  const { t } = useTranslation("pages");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [previewNeuron, setPreviewNeuron] = useState<NeuronListItem | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const { structureNeurons, structuring } = useAutoStructure();
  const {
    neurons, loading, authLoading,
    viewMode, setViewMode,
    sortField, sortDir, toggleSort,
    groupBy, setGroupBy,
    filterStatus, setFilterStatus,
    pinnedIds, togglePin,
    searchQuery, searchResults, searching, handleSearch, clearSearch,
    handleDelete,
    selectedIds, toggleSelect, selectAll, clearSelection, bulkDelete,
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
    return <ListPageSkeleton columns={3} />;
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <SEOHead title={`${t("neurons_index.title")} — AI-IDEI`} description="Browse, search and manage your neuron library." />
      {/* Folder sidebar */}
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

          {/* Flow guidance */}
          <FlowTip
            tipId="neurons-empty"
            variant="tip"
            title="Your neurons will appear here"
            description="Neurons are atomic knowledge units extracted from your content. Go to the Extractor to upload content and generate your first neurons automatically."
            show={neurons.length === 0}
            action={{ label: "Go to Extractor", route: "/extractor" }}
            className="mb-4"
          />
          <FlowTip
            tipId="neurons-has-items"
            variant="next-step"
            title="Use your neurons in AI services"
            description="Great — you have knowledge neurons! Now run an AI service to transform them into articles, strategies, social posts, and more. Each neuron can be reused infinitely."
            show={neurons.length > 0 && neurons.length <= 10}
            action={{ label: "Browse Services", route: "/services" }}
            className="mb-4"
          />

          {/* Page title row with actions */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight">{t("neurons_index.title")}</h1>
              {neurons.length > 0 && (
                <div className="flex items-center gap-3 ml-1">
                  {[
                    { label: t("neurons_index.total"), value: neurons.length },
                    { label: t("neurons_index.published"), value: neurons.filter(n => n.status === "published").length, color: "text-status-validated" },
                    { label: t("neurons_index.draft"), value: neurons.filter(n => n.status === "draft").length },
                    { label: t("neurons_index.pinned"), value: pinnedIds.size, color: "text-primary" },
                  ].filter(s => s.value > 0).map(s => (
                    <div key={s.label} className="flex items-center gap-1">
                      <span className="text-micro text-muted-foreground/60 uppercase tracking-wide">{s.label}</span>
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
                title={t("neurons_index.organize_folders")}
              >
                <FolderTree className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t("neurons_index.folders")}</span>
              </Button>
              <Button
                variant={previewNeuron ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs hidden md:flex"
                onClick={() => setPreviewNeuron(prev => prev ? null : (processedNeurons[0] || null))}
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={showInsights ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 text-xs hidden md:flex"
                onClick={() => setShowInsights(prev => !prev)}
                title="Library Insights"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowExportImport(true)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => structureNeurons(selectedIds.size > 0 ? Array.from(selectedIds) : undefined)}
                disabled={structuring || neurons.length === 0}
                title="Auto-structure neurons into clusters and identify relationships"
              >
                {structuring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Workflow className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{structuring ? "Structuring…" : "Auto-Structure"}</span>
              </Button>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowTemplatePicker(true)}>
                <Plus className="h-3.5 w-3.5" /> {t("neurons_index.new_neuron")}
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

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mb-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
              <span className="text-xs font-medium text-primary">{t("neurons_index.selected", { count: selectedIds.size })}</span>
              <BulkAIActions selectedCount={selectedIds.size} selectedIds={selectedIds} />
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={selectAll}>
                <CheckSquare className="h-3 w-3" /> {t("neurons_index.select_all")}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={clearSelection}>
                <XSquare className="h-3 w-3" /> {t("neurons_index.deselect")}
              </Button>
              <Button variant="destructive" size="sm" className="h-7 text-xs gap-1" onClick={bulkDelete}>
                <Trash2 className="h-3 w-3" /> {t("neurons_index.delete_selected", { count: selectedIds.size })}
              </Button>
            </div>
          )}

          {/* Active filters indicators */}
          {(searchResults !== null || (selectedFolderId && selectedFolderId !== "__unassigned")) && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {searchResults !== null && (
                <span className="text-micro text-muted-foreground">
                  {t("neurons_index.results_for", { count: searchResults.length, query: searchQuery })}
                </span>
              )}
              {selectedFolderId && selectedFolderId !== "__unassigned" && (
                <span className="inline-flex items-center gap-1 text-micro text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {t("neurons_index.folder_active")} · {filteredCount}
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
                  <p className="text-sm text-muted-foreground mb-4">{t("neurons_index.no_search_results")}</p>
                  <Button variant="outline" onClick={clearSearch} className="gap-1.5 text-xs">{t("neurons_index.clear_search")}</Button>
                </>
              ) : filterStatus ? (
                <>
                  <Filter className="h-8 w-8 opacity-20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">{t("neurons_index.no_filter_status", { status: filterStatus })}</p>
                  <Button variant="outline" onClick={() => setFilterStatus(null)} className="gap-1.5 text-xs">{t("neurons_index.clear_filter")}</Button>
                </>
              ) : selectedFolderId ? (
                <>
                  <Filter className="h-8 w-8 opacity-20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">{t("neurons_index.no_folder_neurons")}</p>
                  <Button variant="outline" onClick={() => setSelectedFolderId(null)} className="gap-1.5 text-xs">{t("neurons_index.show_all")}</Button>
                </>
              ) : (
                <>
                  <Logo size="h-12 w-12" className="opacity-30 mx-auto mb-4" alt="" />
                  <h3 className="text-lg font-medium mb-2">{t("neurons_index.empty_title")}</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    {t("neurons_index.empty_desc")}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Button onClick={() => setShowTemplatePicker(true)} className="gap-1.5">
                      <Plus className="h-4 w-4" /> {t("neurons_index.create_neuron")}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/extractor")} className="gap-1.5">
                      {t("neurons_index.extractor")}
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
                      <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                      <span className="text-nano text-muted-foreground/40">{group.items.length}</span>
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
                        isSelected={selectedIds.has(n.id) || previewNeuron?.id === n.id}
                        onTogglePin={togglePin}
                        onToggleSelect={toggleSelect}
                        onDelete={handleDelete}
                        onPreview={previewNeuron !== null ? setPreviewNeuron : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview pane */}
      {previewNeuron && (
        <NeuronPreviewPane neuron={previewNeuron} onClose={() => setPreviewNeuron(null)} />
      )}

      {/* Insights panel */}
      <AnimatePresence>
        {showInsights && !previewNeuron && (
          <NeuronInsights neurons={neurons} onClose={() => setShowInsights(false)} />
        )}
      </AnimatePresence>

      {/* Modals */}
      <TemplatePicker isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} />
      <ExportImportPanel isOpen={showExportImport} onClose={() => setShowExportImport(false)} />
    </div>
  );
}
