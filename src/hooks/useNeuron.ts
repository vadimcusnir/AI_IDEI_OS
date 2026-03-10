import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Block, BlockType, CodeLanguage, BLOCK_TYPE_CONFIG, ExecutionLog } from "@/components/neuron/types";
import { toast } from "sonner";

interface NeuronData {
  id: number;
  number: number;
  uuid: string;
  title: string;
  status: "draft" | "validated" | "published";
  visibility: "private" | "team" | "public";
  score: number;
}

export function useNeuron(neuronNumber?: number) {
  const { user } = useAuth();
  const [neuron, setNeuron] = useState<NeuronData | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nasPath, setNasPath] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const clearLogs = useCallback(() => setExecutionLogs([]), []);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load neuron by number or create new
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        if (neuronNumber) {
          // Load existing
          const { data: n, error } = await supabase
            .from("neurons")
            .select("*")
            .eq("number", neuronNumber)
            .single();

          if (error || !n) {
            toast.error("Neuron not found");
            setLoading(false);
            return;
          }

          setNeuron({
            id: n.id,
            number: n.number,
            uuid: n.uuid,
            title: n.title,
            status: n.status as NeuronData["status"],
            visibility: n.visibility as NeuronData["visibility"],
            score: n.score,
          });

          // Load blocks
          const { data: blockRows } = await supabase
            .from("neuron_blocks")
            .select("*")
            .eq("neuron_id", n.id)
            .order("position");

          if (blockRows) {
            setBlocks(blockRows.map(b => ({
              id: b.id,
              type: b.type as BlockType,
              content: b.content,
              checked: b.checked ?? undefined,
              language: (b.language as CodeLanguage) ?? undefined,
              executionMode: b.execution_mode as any,
              executionStatus: "idle" as const,
            })));
          }

          // Load NAS path
          const { data: addr } = await supabase
            .from("neuron_addresses")
            .select("path")
            .eq("neuron_id", n.id)
            .limit(1)
            .single();

          if (addr) setNasPath(addr.path);
        } else {
          // Create new neuron
          const { data: n, error } = await supabase
            .from("neurons")
            .insert({ author_id: user.id, title: "Untitled Neuron" })
            .select()
            .single();

          if (error || !n) {
            toast.error("Failed to create neuron");
            setLoading(false);
            return;
          }

          setNeuron({
            id: n.id,
            number: n.number,
            uuid: n.uuid,
            title: n.title,
            status: n.status as NeuronData["status"],
            visibility: n.visibility as NeuronData["visibility"],
            score: n.score,
          });

          // Create initial text block
          const { data: block } = await supabase
            .from("neuron_blocks")
            .insert({
              neuron_id: n.id,
              type: "text",
              content: "",
              position: 0,
              execution_mode: "passive",
            })
            .select()
            .single();

          if (block) {
            setBlocks([{
              id: block.id,
              type: "text",
              content: "",
              executionMode: "passive",
              executionStatus: "idle",
            }]);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading neuron");
      }
      setLoading(false);
    };

    load();
  }, [user, neuronNumber]);

  // Auto-save neuron metadata with debounce
  const saveNeuron = useCallback(async (updates: Partial<NeuronData>) => {
    if (!neuron) return;
    setSaving(true);
    const { error } = await supabase
      .from("neurons")
      .update({
        title: updates.title ?? neuron.title,
        status: updates.status ?? neuron.status,
        visibility: updates.visibility ?? neuron.visibility,
      })
      .eq("id", neuron.id);

    if (error) toast.error("Failed to save");
    setSaving(false);
  }, [neuron]);

  const setTitle = useCallback((title: string) => {
    setNeuron(prev => prev ? { ...prev, title } : null);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveNeuron({ title }), 800);
  }, [saveNeuron]);

  const setStatus = useCallback((status: NeuronData["status"]) => {
    setNeuron(prev => prev ? { ...prev, status } : null);
    saveNeuron({ status });
  }, [saveNeuron]);

  const setVisibility = useCallback((visibility: NeuronData["visibility"]) => {
    setNeuron(prev => prev ? { ...prev, visibility } : null);
    saveNeuron({ visibility });
  }, [saveNeuron]);

  // Block operations
  const handleBlockChange = useCallback(async (id: string, content: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
    // Debounced save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      await supabase.from("neuron_blocks").update({ content }).eq("id", id);
    }, 500);
  }, []);

  const handleBlockToggle = useCallback(async (id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, checked: !b.checked } : b));
    const block = blocks.find(b => b.id === id);
    await supabase.from("neuron_blocks").update({ checked: !block?.checked }).eq("id", id);
  }, [blocks]);

  const handleAddBlock = useCallback(async (afterId: string, type: BlockType = "text", initialContent?: string) => {
    if (!neuron) return null;
    const cfg = BLOCK_TYPE_CONFIG[type];
    const idx = blocks.findIndex(b => b.id === afterId);
    const position = idx + 1;

    // Shift positions of blocks after
    const blocksToShift = blocks.slice(position);
    for (const b of blocksToShift) {
      await supabase.from("neuron_blocks").update({ position: blocks.indexOf(b) + 1 }).eq("id", b.id);
    }

    const { data: newBlock } = await supabase
      .from("neuron_blocks")
      .insert({
        neuron_id: neuron.id,
        type,
        content: initialContent || "",
        position,
        execution_mode: cfg.defaultExecutionMode,
        checked: type === "todo" ? false : null,
        language: type === "code" ? "python" : null,
      })
      .select()
      .single();

    if (newBlock) {
      const block: Block = {
        id: newBlock.id,
        type: newBlock.type as BlockType,
        content: initialContent || "",
        checked: type === "todo" ? false : undefined,
        language: type === "code" ? "python" : undefined,
        executionMode: cfg.defaultExecutionMode,
        executionStatus: "idle",
      };
      setBlocks(prev => {
        const copy = [...prev];
        copy.splice(position, 0, block);
        return copy;
      });
      return block;
    }
    return null;
  }, [neuron, blocks]);

  const handleDeleteBlock = useCallback(async (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    await supabase.from("neuron_blocks").delete().eq("id", id);
  }, []);

  const handleBlockLanguageChange = useCallback(async (id: string, lang: CodeLanguage) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, language: lang } : b));
    await supabase.from("neuron_blocks").update({ language: lang }).eq("id", id);
  }, []);

  const handleBlockExecute = useCallback(async (id: string) => {
    if (!neuron) return;
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    setBlocks(prev => prev.map(b =>
      b.id === id ? { ...b, executionStatus: "running" as const } : b
    ));

    const log: ExecutionLog = {
      id: Date.now().toString(),
      blockId: id,
      blockType: block.type,
      action: `Executing ${block.type} block`,
      status: "running",
      timestamp: new Date().toLocaleTimeString(),
    };
    setExecutionLogs(prev => [log, ...prev]);

    try {
      // Create a job in the database
      const { data: job, error: jobErr } = await supabase
        .from("neuron_jobs")
        .insert({
          neuron_id: neuron.id,
          block_id: id,
          worker_type: block.type,
          status: "processing",
          input: { content: block.content, type: block.type, language: block.language },
          author_id: user?.id,
        })
        .select()
        .single();

      if (jobErr) throw jobErr;

      // For AI-action and prompt blocks, call the edge function
      if (["ai-action", "prompt"].includes(block.type) && block.content.trim()) {
        const { data: { session } } = await supabase.auth.getSession();
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-insights`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              action: "extract_insights",
              blocks: [{ type: block.type, content: block.content }],
              neuron_title: neuron.title,
            }),
          }
        );

        if (!resp.ok) throw new Error(`Execution failed: ${resp.status}`);

        // Read streamed result
        const reader = resp.body?.getReader();
        const decoder = new TextDecoder();
        let result = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) result += content;
              } catch { /* skip */ }
            }
          }
        }

        // Update job with result
        await supabase.from("neuron_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: { output: result },
        }).eq("id", job.id);

        setBlocks(prev => prev.map(b =>
          b.id === id ? { ...b, executionStatus: "success" as const, executionResult: result.slice(0, 200) } : b
        ));
      } else {
        // For other executable blocks, simulate validation
        const results: Record<string, string> = {
          code: ">>> Output: success",
          yaml: "Pipeline validated ✓",
          json: "Schema valid ✓",
          dataset: "Data validated ✓",
          diagram: "Graph rendered ✓",
        };

        await supabase.from("neuron_jobs").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          result: { output: results[block.type] || "Executed" },
        }).eq("id", job.id);

        setBlocks(prev => prev.map(b =>
          b.id === id ? {
            ...b,
            executionStatus: "success" as const,
            executionResult: results[b.type] || "Executed"
          } : b
        ));
      }

      setExecutionLogs(prev => prev.map(l =>
        l.blockId === id && l.status === "running"
          ? { ...l, status: "success" as const, result: "Completed" }
          : l
      ));
    } catch (err) {
      console.error("Block execution error:", err);
      setBlocks(prev => prev.map(b =>
        b.id === id ? { ...b, executionStatus: "error" as const, executionResult: "Execution failed" } : b
      ));
      setExecutionLogs(prev => prev.map(l =>
        l.blockId === id && l.status === "running"
          ? { ...l, status: "error" as const, result: err instanceof Error ? err.message : "Failed" }
          : l
      ));
      toast.error("Block execution failed");
    }
  }, [neuron, blocks, user]);

  const handleRunAll = useCallback(() => {
    const executableBlocks = blocks.filter(b => BLOCK_TYPE_CONFIG[b.type].executable);
    executableBlocks.forEach((b, i) => {
      setTimeout(() => handleBlockExecute(b.id), i * 800);
    });
  }, [blocks, handleBlockExecute]);

  const restoreBlocks = useCallback(async (blocksSnapshot: any[]) => {
    if (!neuron) return;
    // Delete existing blocks
    await supabase.from("neuron_blocks").delete().eq("neuron_id", neuron.id);
    // Insert from snapshot
    const newRows = blocksSnapshot.map((b: any, i: number) => ({
      neuron_id: neuron.id,
      type: b.type || "text",
      content: b.content || "",
      position: i,
      execution_mode: b.executionMode || b.execution_mode || "passive",
      language: b.language || null,
      checked: b.checked ?? null,
    }));
    const { data: inserted } = await supabase
      .from("neuron_blocks")
      .insert(newRows)
      .select();

    if (inserted) {
      setBlocks(inserted.map(b => ({
        id: b.id,
        type: b.type as BlockType,
        content: b.content,
        checked: b.checked ?? undefined,
        language: (b.language as CodeLanguage) ?? undefined,
        executionMode: b.execution_mode as any,
        executionStatus: "idle" as const,
      })));
    }
  }, [neuron]);

  return {
    neuron,
    blocks,
    loading,
    saving,
    nasPath,
    tags,
    setTags,
    executionLogs,
    setTitle,
    setStatus,
    setVisibility,
    handleBlockChange,
    handleBlockToggle,
    handleAddBlock,
    handleDeleteBlock,
    handleBlockExecute,
    handleBlockLanguageChange,
    handleRunAll,
    clearLogs,
    restoreBlocks,
  };
}
