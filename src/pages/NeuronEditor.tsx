import { useMemo, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNeuron } from "@/hooks/useNeuron";
import { useNeuronGraph } from "@/hooks/useNeuronGraph";
import { NeuronTopBar } from "@/components/neuron/NeuronTopBar";
import { NeuronLeftPanel } from "@/components/neuron/NeuronLeftPanel";
import { NeuronRightPanel } from "@/components/neuron/NeuronRightPanel";
import { NeuronEditorToolbar } from "@/components/neuron/NeuronEditorToolbar";
import { NeuronMainEditor } from "@/components/neuron/NeuronMainEditor";
import { NeuronBottomBar } from "@/components/neuron/NeuronBottomBar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NeuronEditor() {
  const { number } = useParams();
  const { user, loading: authLoading } = useAuth();
  const neuronNumber = number ? parseInt(number, 10) : undefined;

  const {
    neuron, blocks, loading, saving, nasPath, tags, setTags,
    executionLogs, setTitle, setStatus, setVisibility,
    handleBlockChange, handleBlockToggle, handleAddBlock,
    handleDeleteBlock, handleBlockExecute, handleBlockLanguageChange,
    handleRunAll, clearLogs,
  } = useNeuron(neuronNumber);

  const {
    links, versions, addresses,
    loadingLinks, loadingVersions,
    addLink, removeLink, createVersion,
  } = useNeuronGraph(neuron?.id);

  const [activeFormats, setActiveFormats] = useState<string[]>(["left"]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomExpanded, setBottomExpanded] = useState(false);

  const handleFormatToggle = useCallback((format: string) => {
    setActiveFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  }, []);

  const handleSaveVersion = useCallback(async () => {
    if (!neuron) return;
    const blocksSnapshot = blocks.map(b => ({
      type: b.type,
      content: b.content,
      language: b.language,
      checked: b.checked,
      executionMode: b.executionMode,
    }));
    const result = await createVersion(neuron.title, blocksSnapshot);
    if (result?.error) {
      toast.error("Failed to save version");
    } else {
      toast.success("Version saved");
    }
  }, [neuron, blocks, createVersion]);

  const handleRemoveLink = useCallback(async (linkId: string) => {
    const result = await removeLink(linkId);
    if (result?.error) {
      toast.error("Failed to remove link");
    }
  }, [removeLink]);

  const handleAIAction = useCallback((action: string) => {
    toast.info(`AI action "${action}" triggered. AI integration coming soon.`);
  }, []);

  const neuronScore = useMemo(() => {
    const contentLength = blocks.reduce((sum, b) => sum + b.content.length, 0);
    const execBlocks = blocks.filter(b => ["code", "yaml", "json", "prompt", "dataset", "diagram", "ai-action"].includes(b.type)).length;
    return Math.min(100, Math.round((contentLength / 500) * 25 + blocks.length * 2 + tags.length * 3 + execBlocks * 8));
  }, [blocks, tags]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (loading || !neuron) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">{loading ? "Loading neuron..." : "Creating neuron..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
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
      />

      <div className="flex-1 flex min-h-0">
        <NeuronLeftPanel
          isCollapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed(!leftCollapsed)}
          neuronId={neuron.id}
          links={links}
          addresses={addresses}
          loadingLinks={loadingLinks}
          onRemoveLink={handleRemoveLink}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <NeuronEditorToolbar
            activeFormats={activeFormats}
            onFormatToggle={handleFormatToggle}
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
          />
        </div>

        <NeuronRightPanel
          isCollapsed={rightCollapsed}
          onToggle={() => setRightCollapsed(!rightCollapsed)}
          neuronScore={neuronScore}
          blocks={blocks}
          neuronId={neuron.id}
          onAIAction={handleAIAction}
        />
      </div>

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
      />

      {/* Save indicator */}
      {saving && (
        <div className="fixed bottom-12 right-4 flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
