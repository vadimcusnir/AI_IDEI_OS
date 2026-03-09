import { useState, useCallback, useMemo } from "react";
import { NeuronTopBar } from "@/components/neuron/NeuronTopBar";
import { NeuronLeftPanel } from "@/components/neuron/NeuronLeftPanel";
import { NeuronRightPanel } from "@/components/neuron/NeuronRightPanel";
import { NeuronEditorToolbar } from "@/components/neuron/NeuronEditorToolbar";
import { NeuronMainEditor, Block } from "@/components/neuron/NeuronMainEditor";
import { NeuronBottomBar } from "@/components/neuron/NeuronBottomBar";

const initialBlocks: Block[] = [
  { id: "1", type: "heading", content: "Idea" },
  { id: "2", type: "text", content: "When attention is scarce, ideas with identity signals propagate faster." },
  { id: "3", type: "heading", content: "Explanation" },
  { id: "4", type: "text", content: "Identity-linked ideas trigger social sharing because sharing them reinforces group belonging. People don't just share information — they share identity markers." },
  { id: "5", type: "heading", content: "Example" },
  { id: "6", type: "idea", content: "Bitcoin memes in 2017 — sharing BTC content signaled membership in the crypto tribe, driving exponential memetic propagation." },
  { id: "7", type: "heading", content: "Application" },
  { id: "8", type: "text", content: "Attach identity markers to ideas to increase viral propagation. The idea must allow the sharer to signal who they are." },
  { id: "9", type: "todo", content: "Research identity theory in social psychology", checked: false },
  { id: "10", type: "todo", content: "Find 3 more examples beyond crypto", checked: false },
  { id: "11", type: "todo", content: "Map to existing viral content frameworks", checked: true },
  { id: "12", type: "divider", content: "" },
  { id: "13", type: "heading", content: "References" },
  { id: "14", type: "reference", content: "Berger, J. (2013). Contagious: Why Things Catch On" },
  { id: "15", type: "reference", content: "Heath, C. & Heath, D. (2007). Made to Stick" },
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

  const handleAddBlock = useCallback((afterId: string, type: Block["type"] = "text") => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: "",
      ...(type === "todo" ? { checked: false } : {}),
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

  const neuronScore = useMemo(() => {
    const contentLength = blocks.reduce((sum, b) => sum + b.content.length, 0);
    return Math.min(100, Math.round((contentLength / 500) * 40 + blocks.length * 3 + tags.length * 5));
  }, [blocks, tags]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <NeuronTopBar
        title={title}
        neuronId="NRN-0042"
        tags={tags}
        status={status}
        visibility={visibility}
        onTitleChange={setTitle}
        onStatusChange={setStatus}
        onVisibilityChange={setVisibility}
        onTagsChange={setTags}
      />

      {/* Main area: left + editor + right */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel */}
        <NeuronLeftPanel
          isCollapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed(!leftCollapsed)}
        />

        {/* Center: toolbar + editor */}
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
          />
        </div>

        {/* Right Panel */}
        <NeuronRightPanel
          isCollapsed={rightCollapsed}
          onToggle={() => setRightCollapsed(!rightCollapsed)}
          neuronScore={neuronScore}
        />
      </div>

      {/* Bottom Bar */}
      <NeuronBottomBar
        isExpanded={bottomExpanded}
        onToggle={() => setBottomExpanded(!bottomExpanded)}
      />
    </div>
  );
}
