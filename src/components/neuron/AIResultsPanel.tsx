import { X, Loader2, Copy, Plus, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface AIResultsPanelProps {
  result: string;
  isExtracting: boolean;
  activeAction: string;
  onClose: () => void;
  onInsertAsBlock?: (content: string) => void;
}

const ACTION_TITLES: Record<string, string> = {
  extract_insights: "Extracted Insights",
  extract_frameworks: "Extracted Frameworks",
  extract_questions: "Extracted Questions",
  extract_quotes: "Extracted Quotes",
  extract_prompts: "Generated Prompts",
};

export function AIResultsPanel({ result, isExtracting, activeAction, onClose, onInsertAsBlock }: AIResultsPanelProps) {
  if (!result && !isExtracting) return null;

  const { t } = useTranslation("common");

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success(t("copied_to_clipboard"));
  };

  const handleInsert = () => {
    onInsertAsBlock?.(result);
    toast.success(t("inserted_as_block"));
  };

  return (
    <div className="border-t border-ai-border bg-ai-bg flex flex-col max-h-[50vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-ai-border shrink-0">
        <div className="flex items-center gap-1.5">
          {isExtracting ? (
            <Loader2 className="h-3 w-3 text-ai-accent animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 text-ai-accent" />
          )}
          <span className="text-micro font-semibold uppercase tracking-wider text-ai-accent">
            {isExtracting ? "Extracting..." : ACTION_TITLES[activeAction] || "AI Result"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {result && !isExtracting && (
            <>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCopy} title="Copy">
                <Copy className="h-3 w-3" />
              </Button>
              {onInsertAsBlock && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleInsert} title="Insert as block">
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="prose prose-sm max-w-none text-xs leading-relaxed
          prose-headings:text-foreground prose-headings:prose-headings:mt-3 prose-headings:mb-1.5
          prose-h2:text-sm prose-h3:text-xs
          prose-p:text-muted-foreground prose-p:my-1
          prose-strong:text-foreground
          prose-blockquote:border-ai-accent prose-blockquote:text-muted-foreground prose-blockquote:italic
          prose-code:text-micro prose-code:bg-muted prose-code:px-1 prose-code:rounded
          prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:text-micro
          prose-li:text-muted-foreground prose-li:my-0.5
          prose-ul:my-1 prose-ol:my-1
        ">
          <ReactMarkdown>{result || ""}</ReactMarkdown>
          {isExtracting && (
            <span className="inline-block w-1.5 h-4 bg-ai-accent animate-pulse ml-0.5 -mb-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}
