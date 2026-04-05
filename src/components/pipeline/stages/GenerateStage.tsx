/**
 * GenerateStage — Select and run a service to produce deliverables.
 * Includes pre-flight cost confirmation via EconomicGate.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Loader2, Coins, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEconomicGate } from "@/hooks/useEconomicGate";
import { EconomicGate } from "@/components/command-center/EconomicGate";
import { useDynamicPrice } from "@/hooks/useCapitalization";

interface Service {
  id: string;
  service_key: string;
  name: string;
  description: string;
  credits_cost: number;
}

interface Props {
  episodeId: string;
  neuronIds?: number[];
  onNext: (artifactId?: string) => void;
}

export function GenerateStage({ episodeId, neuronIds, onNext }: Props) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const gate = useEconomicGate();

  const selectedService = services.find(s => s.service_key === selected);
  const { data: dynamicPrice } = useDynamicPrice(selectedService?.credits_cost ?? 0);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("service_catalog")
        .select("id, service_key, name, description, credits_cost")
        .eq("is_active", true)
        .order("credits_cost", { ascending: true })
        .limit(8);
      setServices((data as unknown as Service[]) || []);
      setLoading(false);
    };
    fetchServices();
  }, []);

  const handleExecuteClick = () => {
    if (!selectedService) return;
    if (gate.shouldSkipGate(selectedService.credits_cost)) {
      runService();
    } else {
      gate.setShowGate(true);
    }
  };

  const runService = async () => {
    if (!selected || !user) return;
    gate.setShowGate(false);
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-service", {
        body: {
          service_key: selected,
          neuron_ids: neuronIds || [],
          episode_id: episodeId,
        },
      });
      if (error) throw error;
      toast.success("Deliverable generated!");
      onNext(data?.artifact_id);
    } catch (err: any) {
      toast.error(err.message || "Service execution failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      <div className="text-center mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-h3 font-bold text-foreground">
          Generate Deliverables
        </h3>
        <p className="text-caption text-muted-foreground mt-1">
          Choose a service to produce actionable outputs.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {services.map(svc => (
            <button
              key={svc.id}
              type="button"
              onClick={() => setSelected(svc.service_key)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                selected === svc.service_key
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{svc.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{svc.description}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground whitespace-nowrap ml-2">
                  <Coins className="h-3 w-3" />
                  {svc.credits_cost}N
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pre-flight EconomicGate */}
      <AnimatePresence>
        {gate.showGate && selectedService && (
          <div className="mb-4">
            <EconomicGate
              balance={gate.balance}
              estimatedCost={selectedService.credits_cost}
              tierDiscount={gate.tierDiscount}
              tier={gate.tier}
              onProceed={runService}
              onCancel={() => gate.setShowGate(false)}
            />
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <Button
          onClick={handleExecuteClick}
          disabled={!selected || running || gate.showGate}
          size="lg"
          className="flex-1"
        >
          {running ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
          ) : (
            <>Execute <ArrowRight className="ml-2 h-4 w-4" /></>
          )}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => onNext()}>
          Skip
        </Button>
      </div>
    </motion.div>
  );
}
