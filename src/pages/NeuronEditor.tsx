import { useMemo, useState, useCallback, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useNeuron } from "@/hooks/useNeuron";
import { useNeuronGraph } from "@/hooks/useNeuronGraph";
import { useAIExtraction } from "@/hooks/useAIExtraction";
import { useNeuronClone } from "@/hooks/useNeuronClone";
import { useNeuronTemplates } from "@/hooks/useNeuronTemplates";
import { NeuronTopBar } from "@/components/neuron/NeuronTopBar";
import { NeuronLeftPanel } from "@/components/neuron/NeuronLeftPanel";
import { NeuronRightPanel } from "@/components/neuron/NeuronRightPanel";
import { NeuronEditorToolbar } from "@/components/neuron/NeuronEditorToolbar";
import { NeuronMainEditor } from "@/components/neuron/NeuronMainEditor";
import { NeuronBottomBar } from "@/components/neuron/NeuronBottomBar";
import { AIResultsPanel } from "@/components/neuron/AIResultsPanel";
import { SaveAsTemplateDialog } from "@/components/neuron/SaveAsTemplateDialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { NeuronVersion } from "@/hooks/useNeuronGraph";

export default function NeuronEditor() {
  const { number } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation(["pages", "common", "errors"]);
  const neuronNumber = number ? parseInt(number, 10) : undefined;

  const {
    neuron, blocks, loading, saving, nasPath, tags, setTags,
    executionLogs, setTitle, setStatus, setVisibility,
    handleBlockChange, handleBlockToggle, handleAddBlock,
    handleDeleteBlock, handleBlockExecute, handleBlockLanguageChange,
    handleRunAll, handleReorderBlock, clearLogs, restoreBlocks,
  } = useNeuron(neuronNumber);

  const {
    links, versions, addresses,
    loadingLinks, loadingVersions,
    addLink, removeLink, createVersion,
  } = useNeuronGraph(neuron?.id);

  const { isExtracting, extractionResult, activeAction, extract, clearResult } = useAIExtraction();
  const { cloneNeuron, forkNeuron } = useNeuronClone();
  const { saveAsTemplate } = useNeuronTemplates();

  const [activeFormats, setActiveFormats] = useState<string[]>(["left"]);
  const [selectedEpisodeTranscript, setSelectedEpisodeTranscript] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomExpanded, setBottomExpanded] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);


  const handleClone = useCallback(async () => {
    if (!neuron) return;
    const cloned = await cloneNeuron(neuron.id);
    if (cloned) navigate(`/n/${cloned.number}`);
  }, [neuron, cloneNeuron, navigate]);

  const handleFork = useCallback(async () => {
    if (!neuron) return;
    const forked = await forkNeuron(neuron.id);
    if (forked) navigate(`/n/${forked.number}`);
  }, [neuron, forkNeuron, navigate]);

  const handleFormatToggle = useCallback((format: string) => {
    setActiveFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  }, []);

  const handleToolbarInsertBlock = useCallback((type: string) => {
    const lastBlockId = blocks[blocks.length - 1]?.id || "";
    if (lastBlockId) {
      handleAddBlock(lastBlockId, type as any);
    }
  }, [blocks, handleAddBlock]);

  const handleSaveVersion = useCallback(async () => {
    if (!neuron) return;
    const blocksSnapshot = blocks.map(b => ({
      type: b.type, content: b.content, language: b.language,
      checked: b.checked, executionMode: b.executionMode,
    }));
    const result = await createVersion(neuron.title, blocksSnapshot);
    if (result?.error) toast.error(t("common:version_save_failed"));
    else toast.success(t("common:version_saved"));
  }, [neuron, blocks, createVersion]);

  // Keyboard shortcuts: Ctrl+S = save version, Ctrl+Enter = run all
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      if (e.key === "s") {
        e.preventDefault();
        handleSaveVersion();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleRunAll();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSaveVersion, handleRunAll]);

  const handleRestoreVersion = useCallback(async (version: NeuronVersion) => {
    if (!version.blocksSnapshot || !Array.isArray(version.blocksSnapshot)) {
      toast.error(t("common:invalid_version_snapshot"));
      return;
    }
    await restoreBlocks(version.blocksSnapshot);
    toast.success(t("common:version_restored", { version: version.version }));
  }, [restoreBlocks]);

  const handleRemoveLink = useCallback(async (linkId: string) => {
    const result = await removeLink(linkId);
    if (result?.error) toast.error(t("common:link_remove_failed"));
  }, [removeLink]);

  const AI_ACTIONS = [
    "extract_insights", "extract_frameworks", "extract_questions",
    "extract_quotes", "extract_prompts",
    "debug_code", "optimize_code", "generate_tests", "explain_code",
    "transform_article", "transform_twitter", "transform_script", "transform_slide",
    "find_related", "idea_clusters", "influence_score",
    "run_pipeline", "simulate", "schedule", "validate_schema",
  ];

  const handleAIAction = useCallback((action: string) => {
    if (AI_ACTIONS.includes(action)) {
      extract(action, blocks, neuron?.title || "", selectedEpisodeTranscript || undefined);
    } else {
      toast.info(t("common:action_use_services_hint", { action }));
    }
  }, [extract, blocks, neuron?.title, selectedEpisodeTranscript]);

  const handleInsertAIResult = useCallback(async (content: string) => {
    if (!blocks.length) return;
    const lastBlockId = blocks[blocks.length - 1].id;
    await handleAddBlock(lastBlockId, "markdown", content);
  }, [blocks, handleAddBlock]);

  const neuronScore = useMemo(() => {
    const contentLength = blocks.reduce((sum, b) => sum + b.content.length, 0);
    const execBlocks = blocks.filter(b => ["code", "yaml", "json", "prompt", "dataset", "diagram", "ai-action"].includes(b.type)).length;
    return Math.min(100, Math.round((contentLength / 500) * 25 + blocks.length * 2 + tags.length * 3 + execBlocks * 8));
  }, [blocks, tags]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (loading || !neuron) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{loading ? t("neuron_editor.loading") : t("neuron_editor.creating")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      <SEOHead title={`${neuron.title || "Neuron"} #${neuron.number} — AI-IDEI`} description="Edit neuron blocks, run AI actions and manage knowledge units." />
      <NeuronTopBar
        title={neuron.title}
        neuronNumber={neuron.number}
        neuronUuid={neuron.uuid}
        nasPath={nasPath || `/n/${neuron.number}`}
        tags={tags}
        status={neuron.status}
        visibility={neuron.visibility}
        onTitleChange={setTitle}
        onStatusChange={setStatus}
        onVisibilityChange={setVisibility}
        onTagsChange={setTags}
        onRunAll={handleRunAll}
        onClone={handleClone}
        onFork={handleFork}
        onSaveAsTemplate={() => setShowSaveTemplate(true)}
        blocks={blocks.map(b => ({ type: b.type, content: b.content }))}
      />

      <div className="flex-1 flex min-h-0">
        <NeuronLeftPanel
          isCollapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed(!leftCollapsed)}
          neuronId={neuron.id}
          links={links}
          addresses={addresses}
          loadingLinks={loadingLinks}
          onAddLink={async (targetId, relationType) => {
            const result = await addLink(targetId, relationType);
            if (result?.error) toast.error(t("common:link_add_error"));
            else toast.success(t("common:link_add_success"));
          }}
          onRemoveLink={handleRemoveLink}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <NeuronEditorToolbar
            activeFormats={activeFormats}
            onFormatToggle={handleFormatToggle}
            onInsertBlock={handleToolbarInsertBlock}
          />
          <NeuronMainEditor
            title={neuron.title}
            blocks={blocks}
            onTitleChange={setTitle}
            onBlockChange={handleBlockChange}
            onBlockToggle={handleBlockToggle}
            onAddBlock={handleAddBlock}
            onDeleteBlock={handleDeleteBlock}
            onBlockExecute={handleBlockExecute}
            onBlockLanguageChange={handleBlockLanguageChange}
            onReorderBlock={handleReorderBlock}
          />
        </div>

        <NeuronRightPanel
          isCollapsed={rightCollapsed}
          onToggle={() => setRightCollapsed(!rightCollapsed)}
          neuronScore={neuronScore}
          blocks={blocks}
          neuronId={neuron.id}
          neuronTitle={neuron.title}
          onAIAction={handleAIAction}
          selectedEpisodeTranscript={selectedEpisodeTranscript || undefined}
          onEpisodeSelect={setSelectedEpisodeTranscript}
        />
      </div>

      {/* AI Results Panel */}
      {(extractionResult || isExtracting) && (
        <AIResultsPanel
          result={extractionResult}
          isExtracting={isExtracting}
          activeAction={activeAction}
          onClose={clearResult}
          onInsertAsBlock={handleInsertAIResult}
        />
      )}

      <NeuronBottomBar
        isExpanded={bottomExpanded}
        onToggle={() => setBottomExpanded(!bottomExpanded)}
        executionLogs={executionLogs}
        links={links}
        versions={versions}
        loadingLinks={loadingLinks}
        loadingVersions={loadingVersions}
        onRemoveLink={handleRemoveLink}
        onSaveVersion={handleSaveVersion}
        onClearLogs={clearLogs}
        onRestoreVersion={handleRestoreVersion}
      />

      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        isOpen={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        onSave={saveAsTemplate}
        blocks={blocks}
        defaultName={neuron.title}
      />

      {/* Save indicator */}
      {saving && (
        <div className="fixed bottom-12 right-4 flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t("neuron_editor.saving")}
        </div>
      )}
    </div>
  );
}
