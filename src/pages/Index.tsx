import { useState, useCallback, useMemo } from "react";
import { NeuronTopBar } from "@/components/neuron/NeuronTopBar";
import { NeuronLeftPanel } from "@/components/neuron/NeuronLeftPanel";
import { NeuronRightPanel } from "@/components/neuron/NeuronRightPanel";
import { NeuronEditorToolbar } from "@/components/neuron/NeuronEditorToolbar";
import { NeuronMainEditor } from "@/components/neuron/NeuronMainEditor";
import { NeuronBottomBar } from "@/components/neuron/NeuronBottomBar";
import { Block, BlockType, CodeLanguage, ExecutionLog } from "@/components/neuron/types";

const initialBlocks: Block[] = [
  { id: "1", type: "heading", content: "Idea" },
  { id: "2", type: "text", content: "When attention is scarce, ideas with identity signals propagate faster." },
  { id: "3", type: "heading", content: "Explanation" },
  { id: "4", type: "text", content: "Identity-linked ideas trigger social sharing because sharing them reinforces group belonging. People don't just share information — they share identity markers." },
  { id: "5", type: "heading", content: "Example" },
  { id: "6", type: "idea", content: "Bitcoin memes in 2017 — sharing BTC content signaled membership in the crypto tribe, driving exponential memetic propagation." },
  { id: "7", type: "divider", content: "" },
  { id: "8", type: "heading", content: "Pipeline" },
  { id: "9", type: "yaml", content: "agent:\n  name: idea_extractor\n  input: transcript\n  tasks:\n    - extract_ideas\n    - extract_quotes\n    - extract_frameworks\n  output:\n    ideas: list\n    quotes: list", executionMode: "executable", executionStatus: "idle" },
  { id: "10", type: "prompt", content: "Idea extractor\n---\nPodcast transcript\n---\nExtract 10 key insights.\nRank by novelty score.\nIdentify identity signals.\n---\nStructured JSON with scores", executionMode: "executable", executionStatus: "idle" },
  { id: "11", type: "code", content: 'def viral_score(shares, engagement, novelty):\n    """Calculate viral propagation score."""\n    identity_weight = 1.5\n    return (shares * engagement * identity_weight) / max(novelty, 0.1)', language: "python", executionMode: "executable", executionStatus: "idle" },
  { id: "12", type: "dataset", content: "idea,novelty,impact,identity_signal\nscarcity marketing,0.82,0.91,high\nnetwork effects,0.65,0.88,medium\ntoken incentives,0.94,0.72,very high", executionMode: "validated", executionStatus: "idle" },
  { id: "13", type: "divider", content: "" },
  { id: "14", type: "heading", content: "Application" },
  { id: "15", type: "text", content: "Attach identity markers to ideas to increase viral propagation. The idea must allow the sharer to signal who they are." },
  { id: "16", type: "todo", content: "Research identity theory in social psychology", checked: false },
  { id: "17", type: "todo", content: "Find 3 more examples beyond crypto", checked: false },
  { id: "18", type: "todo", content: "Map to existing viral content frameworks", checked: true },
  { id: "19", type: "heading", content: "References" },
  { id: "20", type: "reference", content: "Berger, J. (2013). Contagious: Why Things Catch On" },
  { id: "21", type: "reference", content: "Heath, C. & Heath, D. (2007). Made to Stick" },
  { id: "22", type: "diagram", content: "graph TD\n  A[Transcript] --> B[Idea Extractor]\n  B --> C[New Neurons]\n  C --> D[Cluster Formation]\n  D --> E[Knowledge Asset]", executionMode: "validated", executionStatus: "idle" },
];

export default function Index() {
  const [title, setTitle] = useState("The Scarcity Attention Law");
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeFormats, setActiveFormats] = useState<string[]>(["left"]);
  const [status, setStatus] = useState<"draft" | "validated" | "published">("draft");
  const [visibility, setVisibility] = useState<"private" | "team" | "public">("private");
  const [tags, setTags] = useState(["marketing", "psychology", "virality"]);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomExpanded, setBottomExpanded] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);

  const handleFormatToggle = useCallback((format: string) => {
    setActiveFormats(prev =>
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  }, []);

  const handleBlockChange = useCallback((id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  }, []);

  const handleBlockToggle = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, checked: !b.checked } : b));
  }, []);

  const handleAddBlock = useCallback((afterId: string, type: BlockType = "text") => {
    const { BLOCK_TYPE_CONFIG } = require("@/components/neuron/types");
    const cfg = BLOCK_TYPE_CONFIG[type];
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
      ...(type === "todo" ? { checked: false } : {}),
      ...(type === "code" ? { language: "python" as CodeLanguage } : {}),
      executionMode: cfg.defaultExecutionMode,
      executionStatus: "idle",
    };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const copy = [...prev];
      copy.splice(idx + 1, 0, newBlock);
      return copy;
    });
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const handleBlockExecute = useCallback((id: string) => {
    // Simulate execution
    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, executionStatus: "running" as const } : b
    ));

    const block = blocks.find(b => b.id === id);
    const log: ExecutionLog = {
      id: Date.now().toString(),
      blockId: id,
      blockType: block?.type || "text",
      action: `Executing ${block?.type} block`,
      status: "running",
      timestamp: new Date().toLocaleTimeString(),
    };
    setExecutionLogs(prev => [log, ...prev]);

    setTimeout(() => {
      const results: Record<string, string> = {
        code: ">>> viral_score(1000, 0.85, 0.3)\n4250.0",
        yaml: "Pipeline validated ✓\n3 tasks registered\nAgent: idea_extractor ready",
        json: "Schema valid ✓\n3 fields detected",
        prompt: "Prompt compiled ✓\nEstimated tokens: 340\nReady for execution",
        dataset: "4 rows × 4 columns\nData types: string, float, float, string\nNo missing values",
        diagram: "Graph rendered ✓\n5 nodes, 4 edges",
        "ai-action": "AI worker dispatched\nProcessing...",
      };
      setBlocks(prev => prev.map(b =>
        b.id === id ? {
          ...b,
          executionStatus: "success" as const,
          executionResult: results[b.type] || "Executed successfully"
        } : b
      ));
      setExecutionLogs(prev => prev.map(l =>
        l.blockId === id && l.status === "running"
          ? { ...l, status: "success" as const, result: "Completed" }
          : l
      ));
    }, 1500);
  }, [blocks]);

  const handleBlockLanguageChange = useCallback((id: string, lang: CodeLanguage) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, language: lang } : b));
  }, []);

  const handleRunAll = useCallback(() => {
    const executableBlocks = blocks.filter(b => {
      const { BLOCK_TYPE_CONFIG } = require("@/components/neuron/types");
      return BLOCK_TYPE_CONFIG[b.type].executable;
    });
    executableBlocks.forEach((b, i) => {
      setTimeout(() => handleBlockExecute(b.id), i * 800);
    });
  }, [blocks, handleBlockExecute]);

  const neuronScore = useMemo(() => {
    const contentLength = blocks.reduce((sum, b) => sum + b.content.length, 0);
    const execBlocks = blocks.filter(b => ["code", "yaml", "json", "prompt", "dataset", "diagram", "ai-action"].includes(b.type)).length;
    return Math.min(100, Math.round((contentLength / 500) * 25 + blocks.length * 2 + tags.length * 3 + execBlocks * 8));
  }, [blocks, tags]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <NeuronTopBar
        title={title}
        neuronNumber={245}
        neuronUuid="7f92c3a2-1c33-4e9e-bdb1-90ac64a88c0a"
        nasPath="/marketing/virality/identity-signals"
        tags={tags}
        status={status}
        visibility={visibility}
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
        />

        <div className="flex-1 flex flex-col min-w-0">
          <NeuronEditorToolbar
            activeFormats={activeFormats}
            onFormatToggle={handleFormatToggle}
          />
          <NeuronMainEditor
            title={title}
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
        />
      </div>

      <NeuronBottomBar
        isExpanded={bottomExpanded}
        onToggle={() => setBottomExpanded(!bottomExpanded)}
        executionLogs={executionLogs}
      />
    </div>
  );
}
