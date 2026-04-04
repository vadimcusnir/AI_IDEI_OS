import { useState } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Navigate } from "react-router-dom";
import { Loader2, Brain, Layers, Network, Target, Shapes, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RSOVersionViewer } from "@/components/pipeline/RSOVersionViewer";
import { ClassificationEngine } from "@/components/pipeline/ClassificationEngine";
import { SemanticLinkGraph } from "@/components/pipeline/SemanticLinkGraph";
import { ScoringRadar } from "@/components/pipeline/ScoringRadar";
import { PatternExtractor } from "@/components/pipeline/PatternExtractor";
import { CognitiveChainViewer } from "@/components/pipeline/CognitiveChainViewer";
import { ThreeAxisViewer } from "@/components/intelligence/ThreeAxisViewer";
import { ContentCategoryManager } from "@/components/intelligence/ContentCategoryManager";

export default function AdminPipelineIntelligence() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const [neuronId, setNeuronId] = useState<number | null>(null);
  const [inputVal, setInputVal] = useState("");

  if (authLoading || adminLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!isAdmin) return <Navigate to="/home" replace />;

  const handleLookup = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed > 0) setNeuronId(parsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Admin — Pipeline Intelligence" description="6-layer cognitive pipeline analysis." />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Pipeline Intelligence</h1>
          <p className="text-sm text-muted-foreground">RSO → Classification → Semantic Graph → Scoring → Patterns → Cognitive Chain</p>
        </div>

        {/* Neuron lookup */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Enter Neuron ID..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLookup()}
            className="max-w-xs font-mono"
          />
          <Button size="sm" onClick={handleLookup} disabled={!inputVal.trim()}>
            Analyze
          </Button>
        </div>

        {neuronId ? (
          <Tabs defaultValue="rso" className="space-y-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="rso" className="text-xs gap-1"><History className="h-3 w-3" /> RSO</TabsTrigger>
              <TabsTrigger value="classification" className="text-xs gap-1"><Brain className="h-3 w-3" /> Classification</TabsTrigger>
              <TabsTrigger value="semantic" className="text-xs gap-1"><Network className="h-3 w-3" /> Semantic</TabsTrigger>
              <TabsTrigger value="scoring" className="text-xs gap-1"><Target className="h-3 w-3" /> Scoring</TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs gap-1"><Shapes className="h-3 w-3" /> Patterns</TabsTrigger>
              <TabsTrigger value="chain" className="text-xs gap-1"><Layers className="h-3 w-3" /> Chain</TabsTrigger>
              <TabsTrigger value="axes" className="text-xs gap-1"><Brain className="h-3 w-3" /> 3-Axis</TabsTrigger>
            </TabsList>

            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground mb-4">
                Analyzing Neuron <span className="font-mono text-foreground font-medium">N{neuronId}</span>
              </div>

              <TabsContent value="rso"><RSOVersionViewer neuronId={neuronId} /></TabsContent>
              <TabsContent value="classification"><ClassificationEngine neuronId={neuronId} /></TabsContent>
              <TabsContent value="semantic"><SemanticLinkGraph neuronId={neuronId} /></TabsContent>
              <TabsContent value="scoring"><ScoringRadar neuronId={neuronId} /></TabsContent>
              <TabsContent value="patterns"><PatternExtractor userId={user?.id} /></TabsContent>
              <TabsContent value="chain"><CognitiveChainViewer neuronId={neuronId} /></TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <Brain className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Enter a Neuron ID to inspect its full intelligence pipeline.</p>
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {["RSO Versions", "3D Classification", "Semantic Graph", "Multi-Axial Scoring", "Pattern Extraction", "6-Layer Chain"].map(label => (
                <span key={label} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground">{label}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
