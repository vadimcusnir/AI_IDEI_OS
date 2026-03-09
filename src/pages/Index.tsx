import { useState, useCallback, useMemo } from "react";
import { NeuronToolbar } from "@/components/neuron/NeuronToolbar";
import { NeuronHeader } from "@/components/neuron/NeuronHeader";
import { NeuronEditor, Block } from "@/components/neuron/NeuronEditor";
import { NeuronStatusBar } from "@/components/neuron/NeuronStatusBar";
import { motion } from "framer-motion";

const colorBgMap: Record<string, string> = {
  default: "bg-card",
  yellow: "bg-note-yellow",
  green: "bg-note-green",
  blue: "bg-note-blue",
  pink: "bg-note-pink",
  purple: "bg-note-purple",
};

const initialBlocks: Block[] = [
  { id: "1", type: "heading", content: "Welcome to Neuron" },
  { id: "2", type: "text", content: "The smallest unit of content. Start typing to capture your thoughts, ideas, and tasks." },
  { id: "3", type: "todo", content: "Try checking this off", checked: false },
  { id: "4", type: "todo", content: "Add a new block below", checked: false },
  { id: "5", type: "quote", content: "The brain is wider than the sky." },
  { id: "6", type: "code", content: 'console.log("Hello, Neuron!");' },
  { id: "7", type: "divider", content: "" },
  { id: "8", type: "text", content: "Use the toolbar above to format text, create lists, and insert media." },
];

export default function Index() {
  const [title, setTitle] = useState("My First Neuron");
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeFormats, setActiveFormats] = useState<string[]>(["left"]);
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [noteColor, setNoteColor] = useState("default");
  const [showColorPicker, setShowColorPicker] = useState(false);

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

  const handleAddBlock = useCallback((afterId: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: "text",
      content: "",
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

  const { wordCount, charCount } = useMemo(() => {
    const allText = title + " " + blocks.map(b => b.content).join(" ");
    const words = allText.trim().split(/\s+/).filter(Boolean).length;
    return { wordCount: words, charCount: allText.length };
  }, [title, blocks]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-4xl h-[85vh] flex flex-col rounded-xl border border-border shadow-xl overflow-hidden transition-colors duration-300 ${colorBgMap[noteColor]}`}
      >
        <NeuronHeader
          isPinned={isPinned}
          isStarred={isStarred}
          noteColor={noteColor}
          tags={["personal", "ideas"]}
          lastEdited="Edited just now"
          onTogglePin={() => setIsPinned(!isPinned)}
          onToggleStar={() => setIsStarred(!isStarred)}
          onColorChange={(c) => { setNoteColor(c); setShowColorPicker(false); }}
          showColorPicker={showColorPicker}
          onToggleColorPicker={() => setShowColorPicker(!showColorPicker)}
        />

        <NeuronToolbar
          activeFormats={activeFormats}
          onFormatToggle={handleFormatToggle}
        />

        <NeuronEditor
          title={title}
          blocks={blocks}
          onTitleChange={setTitle}
          onBlockChange={handleBlockChange}
          onBlockToggle={handleBlockToggle}
          onAddBlock={handleAddBlock}
          onDeleteBlock={handleDeleteBlock}
        />

        <NeuronStatusBar
          wordCount={wordCount}
          charCount={charCount}
          blockCount={blocks.length}
        />
      </motion.div>
    </div>
  );
}
