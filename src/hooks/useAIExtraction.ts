import { useState, useCallback } from "react";
import { Block } from "@/components/neuron/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-insights`;

type AIAction = "extract_insights" | "extract_frameworks" | "extract_questions" | "extract_quotes" | "extract_prompts";

const ACTION_LABELS: Record<string, string> = {
  extract_insights: "Extract Insights",
  extract_frameworks: "Extract Frameworks",
  extract_questions: "Extract Questions",
  extract_quotes: "Extract Quotes",
  extract_prompts: "Extract Prompts",
};

export function useAIExtraction() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<string>("");
  const [activeAction, setActiveAction] = useState<string>("");

  const extract = useCallback(async (
    action: string,
    blocks: Block[],
    neuronTitle: string,
    additionalContext?: string // optional: transcript/episode content as source
  ): Promise<string | null> => {
    if (isExtracting) return null;

    const contentBlocks = blocks.filter(b => b.content?.trim());
    
    // Allow extraction even with empty blocks if we have additional context
    if (contentBlocks.length === 0 && !additionalContext?.trim()) {
      toast.error("No content to analyze. Add some text or select a source transcript.");
      return null;
    }

    setIsExtracting(true);
    setActiveAction(action);
    setExtractionResult("");

    const label = ACTION_LABELS[action] || action;
    toast.info(`Running ${label}...`);

    try {
      // Build blocks array: include neuron blocks + additional context if provided
      const blocksToSend: Array<{ type: string; content: string }> = contentBlocks.map(b => ({ type: b.type, content: b.content }));
      
      if (additionalContext?.trim()) {
        blocksToSend.unshift({
          type: "source_transcript",
          content: additionalContext.trim(),
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action,
          blocks: blocksToSend,
          neuron_title: neuronTitle,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: "AI service error" }));
        throw new Error(errorData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response stream");

      // Parse SSE stream
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResult += content;
              setExtractionResult(fullResult);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Flush remaining
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResult += content;
              setExtractionResult(fullResult);
            }
          } catch { /* ignore */ }
        }
      }

      toast.success(`${label} complete`);
      setIsExtracting(false);
      setActiveAction("");
      return fullResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      toast.error(msg);
      setIsExtracting(false);
      setActiveAction("");
      return null;
    }
  }, [isExtracting]);

  const clearResult = useCallback(() => {
    setExtractionResult("");
    setActiveAction("");
  }, []);

  return {
    isExtracting,
    extractionResult,
    activeAction,
    extract,
    clearResult,
  };
}
