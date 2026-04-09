import { useState } from "react";
import { usePersonalOS } from "@/hooks/usePersonalOS";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Layers, AlertTriangle, Sparkles, Shield, Lightbulb, Target, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

const LAYER_ICONS: Record<string, typeof Brain> = {
  identity: Brain,
  knowledge: Lightbulb,
  execution: Target,
  adaptation: Shield,
  monetization: Sparkles,
};

const LAYER_COLORS: Record<string, string> = {
  identity: "text-violet-400",
  knowledge: "text-blue-400",
  execution: "text-emerald-400",
  adaptation: "text-amber-400",
  monetization: "text-rose-400",
};

export default function PersonalOS() {
  const { user } = useAuth();
  const { dimensions, layers, gaps, loading, extracting, extractIdentity, overallCompleteness } = usePersonalOS();
  const [selectedDim, setSelectedDim] = useState<string | null>(null);

  if (!user) return <Navigate to="/auth" replace />;

  const handleExtract = async () => {
    try {
      const result = await extractIdentity();
      if (result?.success) {
        toast.success(`Extracted ${result.dimensions_extracted} dimensions from ${result.total_neurons_analyzed} neurons`);
      }
    } catch {
      toast.error("Extraction failed. Ensure you have at least 3 neurons.");
    }
  };

  const activeDim = dimensions.find((d) => d.dimension_key === selectedDim);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-h2 font-bold text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            Personal OS
          </h1>
          <p className="text-caption text-muted-foreground mt-1">
            Your cognitive identity extracted, structured, and ready for amplification.
          </p>
        </div>
        <Button onClick={handleExtract} disabled={extracting} className="gap-2">
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          {dimensions.length > 0 ? "Re-Extract Identity" : "Extract Identity"}
        </Button>
      </div>

      {/* Overall Progress */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">OS Completeness</span>
            <span className="text-sm font-bold text-primary">{overallCompleteness}%</span>
          </div>
          <Progress value={overallCompleteness} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {overallCompleteness < 30
              ? "Start by extracting your identity from your neurons."
              : overallCompleteness < 70
                ? "Good progress. Upload more content to strengthen weak dimensions."
                : "Strong profile. Your Personal OS is taking shape."}
          </p>
        </CardContent>
      </Card>

      {/* Gaps Alert */}
      {gaps.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Profile Gaps Detected ({gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gaps.map((g) => (
                <div key={g.id} className="flex items-start gap-2 text-xs">
                  <Badge variant={g.gap_severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                    {g.gap_severity}
                  </Badge>
                  <span className="text-muted-foreground">{g.suggestion_text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OS Layers */}
      <div>
        <h2 className="text-h3 font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          OS Layers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {layers.map((layer) => {
            const Icon = LAYER_ICONS[layer.layer_key] || Layers;
            const color = LAYER_COLORS[layer.layer_key] || "text-muted-foreground";
            return (
              <Card key={layer.id} className="relative overflow-hidden">
                <CardContent className="pt-4 pb-3 px-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", color)} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {layer.layer_label}
                    </span>
                  </div>
                  <Progress value={layer.completeness_pct} className="h-1.5" />
                  <span className="text-[10px] text-muted-foreground">{layer.completeness_pct}% complete</span>
                  {layer.gap_details && layer.gap_details.length > 0 && (
                    <Badge variant="secondary" className="text-[9px]">
                      {layer.gap_details.length} gap{layer.gap_details.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Identity Dimensions */}
      {dimensions.length > 0 && (
        <div>
          <h2 className="text-h3 font-semibold text-foreground mb-4">Identity Dimensions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dimensions.map((dim) => (
              <Card
                key={dim.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary/40",
                  selectedDim === dim.dimension_key && "border-primary ring-1 ring-primary/20"
                )}
                onClick={() => setSelectedDim(selectedDim === dim.dimension_key ? null : dim.dimension_key)}
              >
                <CardContent className="pt-4 pb-3 px-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{dim.dimension_label}</span>
                    <Badge variant={dim.confidence >= 0.7 ? "default" : dim.confidence >= 0.4 ? "secondary" : "destructive"} className="text-[10px]">
                      {Math.round(dim.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {dim.extraction?.summary || "No summary available"}
                  </p>
                  {dim.extraction?.traits && dim.extraction.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dim.extraction.traits.slice(0, 4).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-[9px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selected Dimension Detail */}
      {activeDim && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">{activeDim.dimension_label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Summary</h4>
              <p className="text-sm text-foreground">{activeDim.extraction?.summary}</p>
            </div>
            {activeDim.extraction?.traits && activeDim.extraction.traits.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Key Traits</h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeDim.extraction.traits.map((t, i) => (
                    <Badge key={i} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
            {activeDim.extraction?.evidence && activeDim.extraction.evidence.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Evidence</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  {activeDim.extraction.evidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {activeDim.extraction?.recommendations && activeDim.extraction.recommendations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Recommendations</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  {activeDim.extraction.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              Based on {activeDim.source_neuron_ids?.length || 0} neurons • Updated {new Date(activeDim.updated_at).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {dimensions.length === 0 && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Identity Extracted Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Upload content and extract neurons first. Then click "Extract Identity" to build your cognitive profile and Personal OS.
            </p>
            <Button onClick={handleExtract} disabled={extracting} className="gap-2">
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Begin Extraction
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
