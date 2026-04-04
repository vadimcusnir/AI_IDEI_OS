/**
 * StructureStage — Auto-structure neurons into relations and entities
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Network, ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  episodeId: string;
  neuronCount: number;
  onNext: () => void;
}

export function StructureStage({ episodeId, neuronCount, onNext }: Props) {
  const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
  const [stats, setStats] = useState<{ links: number; entities: number } | null>(null);

  const runStructuring = async () => {
    setStatus("running");
    try {
      const { data, error } = await supabase.functions.invoke("auto-structure-neurons", {
        body: { episode_id: episodeId },
      });
      if (error) throw error;
      setStats({
        links: data?.links_created ?? 0,
        entities: data?.entities_created ?? 0,
      });
      setStatus("done");
      toast.success("Knowledge structured successfully");
    } catch (err: any) {
      toast.error(err.message || "Structuring failed");
      setStatus("idle");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center"
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Network className="h-6 w-6 text-primary" />
      </div>

      {status === "idle" && (
        <>
          <h3 className="text-h3 font-bold text-foreground mb-2">
            Structure Knowledge
          </h3>
          <p className="text-caption text-muted-foreground mb-6">
            Connect {neuronCount} neurons into a knowledge graph with relations and entities.
          </p>
          <Button onClick={runStructuring} size="lg" className="w-full">
            Auto-Structure <Network className="ml-2 h-4 w-4" />
          </Button>
          <button
            onClick={onNext}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip — structure later
          </button>
        </>
      )}

      {status === "running" && (
        <>
          <h3 className="text-h3 font-semibold text-foreground mb-2">
            Structuring...
          </h3>
          <p className="text-caption text-muted-foreground mb-4">
            Detecting relations, building knowledge graph.
          </p>
          <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
        </>
      )}

      {status === "done" && stats && (
        <>
          <h3 className="text-h3 font-bold text-foreground mb-2">
            <Check className="inline h-5 w-5 text-primary mr-1" />
            Structured
          </h3>
          <div className="flex gap-4 justify-center mb-6">
            <div className="bg-muted/50 rounded-lg px-4 py-2">
              <p className="text-lg font-bold text-foreground">{stats.links}</p>
              <span className="text-xs text-muted-foreground">Relations</span>
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-2">
              <p className="text-lg font-bold text-foreground">{stats.entities}</p>
              <span className="text-xs text-muted-foreground">Entities</span>
            </div>
          </div>
          <Button onClick={onNext} size="lg" className="w-full">
            Generate Deliverables <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </>
      )}
    </motion.div>
  );
}
