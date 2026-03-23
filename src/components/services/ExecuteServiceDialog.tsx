import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Coins, Play, Loader2, CheckCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type RegistryServiceItem, LEVEL_META, TIER_COLORS } from "./RegistryCard";

interface ExecuteServiceDialogProps {
  service: RegistryServiceItem | null;
  open: boolean;
  onClose: () => void;
}

type ExecState = "configure" | "executing" | "done" | "error";

export function ExecuteServiceDialog({ service, open, onClose }: ExecuteServiceDialogProps) {
  const [input, setInput] = useState("");
  const [state, setState] = useState<ExecState>("configure");
  const [output, setOutput] = useState("");

  if (!service) return null;
  const meta = LEVEL_META[service.service_level as keyof typeof LEVEL_META];
  const Icon = meta?.icon || Zap;

  const handleExecute = async () => {
    if (!input.trim()) {
      toast.error("Please provide input for the service");
      return;
    }

    setState("executing");
    setOutput("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to execute services");
        setState("configure");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            serviceId: service.id,
            serviceName: service.name,
            serviceLevel: service.service_level,
            category: service.category,
            input: input.trim(),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded, please try again later");
          setState("configure");
          return;
        }
        if (response.status === 402) {
          toast.error("Insufficient credits. Please add funds.");
          setState("configure");
          return;
        }
        throw new Error("Service execution failed");
      }

      // Stream SSE response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullOutput = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;

        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullOutput += content;
              setOutput(fullOutput);
            }
          } catch {
            // partial JSON, continue
          }
        }
      }

      setState("done");
      toast.success("Service executed successfully!");
    } catch (err) {
      console.error("Execute error:", err);
      setState("error");
      toast.error("Execution failed. Please try again.");
    }
  };

  const handleClose = () => {
    setState("configure");
    setInput("");
    setOutput("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted">
              <Icon className={cn("h-5 w-5", meta?.color)} />
            </div>
            <div>
              <DialogTitle className="text-base">{service.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-[9px] px-1.5 border", TIER_COLORS[service.score_tier] || TIER_COLORS.C)}>
                  Tier {service.score_tier}
                </Badge>
                <Badge variant="outline" className="text-[9px] px-1.5">{service.service_level}</Badge>
                <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  <span className="font-mono">{service.neurons_cost_min}–{service.neurons_cost_max}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Input */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Input
            </label>
            <Textarea
              placeholder="Paste your content, topic, or context here..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="min-h-[120px] text-sm"
              disabled={state === "executing"}
            />
            <p className="text-[9px] text-muted-foreground mt-1">
              {service.intent && `Intent: ${service.intent}`}
            </p>
          </div>

          {/* Execute button */}
          {state === "configure" && (
            <Button className="w-full gap-2" size="lg" onClick={handleExecute}>
              <Play className="h-4 w-4" />
              Execute — {service.neurons_cost_min} NEURONS
            </Button>
          )}

          {/* Executing */}
          {state === "executing" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating output...
              </div>
              {output && (
                <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {output}
                </div>
              )}
            </div>
          )}

          {/* Done */}
          {(state === "done" || state === "error") && output && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {state === "done" ? (
                  <><CheckCircle className="h-4 w-4 text-green-500" /> Output ready</>
                ) : (
                  <span className="text-destructive">Execution encountered an error</span>
                )}
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto border">
                {output}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(output)}>
                  Copy Output
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setState("configure"); setOutput(""); }}>
                  Run Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
