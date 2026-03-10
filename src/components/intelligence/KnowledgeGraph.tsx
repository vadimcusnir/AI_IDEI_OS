import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ForceGraph2D from "react-force-graph-2d";
import { Loader2, ZoomIn, ZoomOut, Maximize2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  numericId: number;
  label: string;
  number: number;
  category: string | null;
  status: string;
  val: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
  relationType: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  transcript: "#64748b",
  insight: "#8b5cf6",
  framework: "#10b981",
  strategy: "#f59e0b",
  formula: "#ef4444",
  pattern: "#3b82f6",
  avatar: "#ec4899",
  argument_map: "#14b8a6",
  narrative: "#f97316",
  psychological: "#a855f7",
  commercial: "#06b6d4",
};

const RELATION_COLORS: Record<string, string> = {
  supports: "#10b981",
  contradicts: "#ef4444",
  extends: "#3b82f6",
  references: "#64748b",
  derived_from: "#8b5cf6",
};

export function KnowledgeGraph() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    if (!user) return;
    loadGraph();
  }, [user]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: Math.max(500, rect.height) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const loadGraph = async () => {
    const [neuronsRes, linksRes] = await Promise.all([
      supabase.from("neurons")
        .select("id, number, title, content_category, status, score")
        .eq("author_id", user!.id)
        .order("number", { ascending: true }),
      supabase.from("neuron_links")
        .select("id, source_neuron_id, target_neuron_id, relation_type"),
    ]);

    const neuronsList = neuronsRes.data || [];
    const linksList = linksRes.data || [];
    const neuronIdSet = new Set(neuronsList.map(n => n.id));

    const graphNodes: GraphNode[] = neuronsList.map(n => ({
      id: String(n.id),
      numericId: n.id,
      label: n.title,
      number: n.number,
      category: n.content_category,
      status: n.status,
      val: Math.max(2, Math.min(8, (n.score || 0) / 12)),
      color: CATEGORY_COLORS[n.content_category || ""] || "#64748b",
    }));

    const graphLinks: GraphLink[] = linksList
      .filter(l => neuronIdSet.has(l.source_neuron_id) && neuronIdSet.has(l.target_neuron_id))
      .map(l => ({
        source: String(l.source_neuron_id),
        target: String(l.target_neuron_id),
        relationType: l.relation_type,
      }));

    setNodes(graphNodes);
    setLinks(graphLinks);
    setLoading(false);
  };

  const handleNodeClick = useCallback((node: any) => {
    navigate(`/n/${node.number}`);
  }, [navigate]);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 300);
  const handleFit = () => graphRef.current?.zoomToFit(400, 40);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-card border border-border rounded-xl">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-card border-2 border-dashed border-border rounded-xl">
        <Info className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground mb-1">No neurons yet</p>
        <p className="text-xs text-muted-foreground/60">Create neurons to see the knowledge graph</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {nodes.length} neuroni · {links.length} conexiuni
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleFit}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="relative bg-card border border-border rounded-xl overflow-hidden"
        style={{ height: 500 }}
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          width={dimensions.width}
          height={500}
          nodeLabel={(node: any) => `#${node.number} ${node.label}`}
          nodeColor={(node: any) => node.color}
          nodeVal={(node: any) => node.val}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const r = Math.sqrt(node.val || 2) * 3;
            // Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = node.color;
            ctx.fill();
            ctx.strokeStyle = hoveredNode?.id === node.id ? "#fff" : "rgba(255,255,255,0.15)";
            ctx.lineWidth = hoveredNode?.id === node.id ? 2 : 0.5;
            ctx.stroke();
            // Label (only if zoomed enough)
            if (globalScale > 1.5) {
              ctx.font = `${Math.max(3, 10 / globalScale)}px sans-serif`;
              ctx.fillStyle = "rgba(255,255,255,0.9)";
              ctx.textAlign = "center";
              ctx.fillText(node.label?.slice(0, 20) || "", node.x, node.y + r + 8 / globalScale);
            }
          }}
          linkColor={(link: any) => RELATION_COLORS[link.relationType] || "rgba(100,116,139,0.3)"}
          linkWidth={1.5}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={0.9}
          onNodeClick={handleNodeClick}
          onNodeHover={(node: any) => setHoveredNode(node)}
          backgroundColor="transparent"
          cooldownTicks={100}
          d3VelocityDecay={0.3}
        />

        {/* Hovered node info */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none">
            <p className="text-xs font-semibold">#{hoveredNode.number} {hoveredNode.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {hoveredNode.category || "uncategorized"}
              </span>
              <span className="text-[9px] text-muted-foreground">{hoveredNode.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Categorii</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground capitalize">{cat.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
