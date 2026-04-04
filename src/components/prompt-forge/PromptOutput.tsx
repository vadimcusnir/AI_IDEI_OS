import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Copy, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useCallback } from "react";
import { RatingStars } from "./RatingStars";
import { ExportMenu } from "./ExportMenu";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PromptOutputProps {
  result: string;
  goal?: string;
}

export function PromptOutput({ result, goal }: PromptOutputProps) {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(result);
    toast.success(t("prompt_forge.copied"));
  }, [result, t]);

  const handleRate = useCallback(async (newRating: number) => {
    setRating(newRating);
    if (newRating >= 1) setShowFeedback(true);
  }, []);

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
        <span className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          {t("prompt_forge.result_label")}
        </span>
        <div className="flex items-center gap-1">
          <RatingStars value={rating} onChange={handleRate} />
          {goal && <ExportMenu result={result} goal={goal} />}
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
