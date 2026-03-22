import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Copy, Wand2, Star } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useCallback } from "react";

interface PromptOutputProps {
  result: string;
  onSaveToHistory?: () => void;
}

export function PromptOutput({ result, onSaveToHistory }: PromptOutputProps) {
  const { t } = useTranslation("pages");

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    toast.success(t("prompt_forge.copied"));
  }, [result, t]);

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center">
        <Wand2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground/50">
          {t("prompt_forge.empty_hint")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("prompt_forge.result_label")}
        </span>
        <div className="flex gap-1">
          {onSaveToHistory && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onSaveToHistory}>
              <Star className="h-3 w-3" />
              Salvează
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={copyToClipboard}>
            <Copy className="h-3 w-3" />
            {t("prompt_forge.copy")}
          </Button>
        </div>
      </div>
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
    </div>
  );
}
