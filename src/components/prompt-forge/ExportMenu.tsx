import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Brain, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ExportMenuProps {
  result: string;
  goal: string;
}

export function ExportMenu({ result, goal }: ExportMenuProps) {
  const { t } = useTranslation("pages");
  const { user } = useAuth();

  const exportAsText = () => {
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-forge-${goal.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("prompt_forge.exported", { defaultValue: "Exportat cu succes!" }));
  };

  const exportAsNeuron = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("neurons")
      .insert({
        title: `Prompt Forge: ${goal}`,
        author_id: user.id,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !data) {
      toast.error("Nu s-a putut crea neuronul");
      return;
    }

    // Create a text block with the result
    await supabase.from("neuron_blocks").insert({
      neuron_id: data.id,
      type: "text",
      content: result,
      position: 0,
    });

    toast.success(t("prompt_forge.exported_neuron", { defaultValue: "Salvat ca Neuron!" }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success(t("prompt_forge.copied"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Download className="h-3 w-3" />
          {t("prompt_forge.export", { defaultValue: "Export" })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyToClipboard} className="text-xs gap-2">
          <Edit3 className="h-3.5 w-3.5" />
          Copiază în clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsText} className="text-xs gap-2">
          <FileText className="h-3.5 w-3.5" />
          Download Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsNeuron} className="text-xs gap-2">
          <Brain className="h-3.5 w-3.5" />
          Salvează ca Neuron
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
