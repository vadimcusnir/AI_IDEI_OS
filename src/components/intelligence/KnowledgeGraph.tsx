import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ZoomIn, ZoomOut, Maximize2, Info, Download, Clock, Focus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ForceGraph2D = lazy(() => import("react-force-graph-2d").then(m => ({ default: m.default })));

interface GraphNode {
  id: string;
  numericId: number;
  label: string;
  number: number;
  category: string | null;
  status: string;
  val: number;
  color: string;
  cluster?: number;
  createdAt: string;
}

interface GraphLink {
  source: string;
  target: string;
  relationType: string;
  confidence?: number;
}

const MAX_NODES = 500;

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

const CLUSTER_COLORS = [
  "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6", "#f97316", "#a855f7", "#06b6d4",
];

const RELATION_COLORS: Record<string, string> = {
  supports: "#10b981",
  contradicts: "#ef4444",
  extends: "#3b82f6",
  references: "#64748b",
  derived_from: "#8b5cf6",
  exemplify: "#f59e0b",
  apply: "#06b6d4",
};

type ColorMode = "category" | "cluster";

function detectClusters(nodes: GraphNode[], links: GraphLink[]): Map<string, number> {
  // Simple connected-component clustering
  const adj = new Map<string, Set<string>>();
  nodes.forEach(n => adj.set(n.id, new Set()));
  links.forEach(l => {
    const s = typeof l.source === "string" ? l.source : (l.source as any).id;
    const t = typeof l.target === "string" ? l.target : (l.target as any).id;
    adj.get(s)?.add(t);
    adj.get(t)?.add(s);
  });

  const clusters = new Map<string, number>();
  let clusterId = 0;
  const visited = new Set<string>();

  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const queue = [node.id];
    visited.add(node.id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      clusters.set(current, clusterId);
      for (const neighbor of adj.get(current) || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    clusterId++;
  }
  return clusters;
}

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
  const [truncated, setTruncated] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("category");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [focusedNode, setFocusedNode] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (graphRef.current) {
        graphRef.current.pauseAnimation?.();
        graphRef.current._destructor?.();
      }
    };
  }, []);

  const loadGraph = async () => {
    const [neuronsRes, linksRes] = await Promise.all([
      supabase.from("neurons")
        .select("id, number, title, content_category, status, score, created_at")
        .eq("author_id", user!.id)
        .order("score", { ascending: false })
        .limit(MAX_NODES),
      supabase.from("neuron_links")
        .select("id, source_neuron_id, target_neuron_id, relation_type"),
    ]);

    const neuronsList = neuronsRes.data || [];
    const linksList = linksRes.data || [];
    const neuronIdSet = new Set(neuronsList.map(n => n.id));

    setTruncated(neuronsList.length >= MAX_NODES);

    const graphNodes: GraphNode[] = neuronsList.map(n => ({
      id: String(n.id),
      numericId: n.id,
      label: n.title,
      number: n.number,
      category: n.content_category,
      status: n.status,
      val: Math.max(2, Math.min(8, (n.score || 0) / 12)),
      color: CATEGORY_COLORS[n.content_category || ""] || "#64748b",
      createdAt: n.created_at,
    }));

    const graphLinks: GraphLink[] = linksList
      .filter(l => neuronIdSet.has(l.source_neuron_id) && neuronIdSet.has(l.target_neuron_id))
      .map(l => ({
        source: String(l.source_neuron_id),
        target: String(l.target_neuron_id),
        relationType: l.relation_type,
      }));

    // Detect clusters
    const clusterMap = detectClusters(graphNodes, graphLinks);
    graphNodes.forEach(n => { n.cluster = clusterMap.get(n.id) || 0; });

    setNodes(graphNodes);
    setLinks(graphLinks);
    setLoading(false);
  };

  // Time filter
  const filteredData = useMemo(() => {
    if (timeFilter === "all" && !focusedNode) return { nodes, links };

    let filteredNodes = nodes;
    if (timeFilter !== "all") {
      const cutoff = new Date();
      if (timeFilter === "7d") cutoff.setDate(cutoff.getDate() - 7);
      else if (timeFilter === "30d") cutoff.setDate(cutoff.getDate() - 30);
      else if (timeFilter === "90d") cutoff.setDate(cutoff.getDate() - 90);
      filteredNodes = nodes.filter(n => new Date(n.createdAt) >= cutoff);
    }

    if (focusedNode) {
      // Show only 1-hop neighborhood
      const neighborIds = new Set<string>([focusedNode]);
      links.forEach(l => {
        const s = typeof l.source === "string" ? l.source : (l.source as any).id;
        const t = typeof l.target === "string" ? l.target : (l.target as any).id;
        if (s === focusedNode) neighborIds.add(t);
        if (t === focusedNode) neighborIds.add(s);
      });
      filteredNodes = filteredNodes.filter(n => neighborIds.has(n.id));
    }

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(l => {
      const s = typeof l.source === "string" ? l.source : (l.source as any).id;
      const t = typeof l.target === "string" ? l.target : (l.target as any).id;
      return nodeIds.has(s) && nodeIds.has(t);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, timeFilter, focusedNode]);

  const graphData = useMemo(() => ({
    nodes: filteredData.nodes,
    links: filteredData.links,
  }), [filteredData]);

  const handleNodeClick = useCallback((node: any) => {
    if (focusedNode === node.id) {
      // Double-click: navigate
      navigate(`/n/${node.number}`);
    } else {
      setFocusedNode(node.id);
    }
  }, [navigate, focusedNode]);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.3, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.3, 300);
  const handleFit = () => { setFocusedNode(null); graphRef.current?.zoomToFit(400, 40); };

  const handleExportSVG = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "knowledge-graph.png";
    link.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
    link.click();
  }, []);

  const getNodeColor = useCallback((node: any) => {
    if (focusedNode && node.id !== focusedNode) {
      // Check if it's a neighbor
      const isNeighbor = links.some(l => {
        const s = typeof l.source === "string" ? l.source : (l.source as any).id;
        const t = typeof l.target === "string" ? l.target : (l.target as any).id;
        return (s === focusedNode && t === node.id) || (t === focusedNode && s === node.id);
      });
      if (!isNeighbor) return "rgba(100,116,139,0.15)";
    }
    if (colorMode === "cluster") {
      return CLUSTER_COLORS[(node.cluster || 0) % CLUSTER_COLORS.length];
    }
    return node.color;
  }, [colorMode, focusedNode, links]);

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filteredData.nodes.length} neurons · {filteredData.links.length} connections
            {truncated && <span className="text-warning ml-1">(top {MAX_NODES})</span>}
          </span>
          {focusedNode && (
            <Button variant="ghost" size="sm" className="h-6 text-micro text-primary" onClick={() => setFocusedNode(null)}>
              <Focus className="h-3 w-3 mr-1" /> Clear focus
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Select value={colorMode} onValueChange={(v) => setColorMode(v as ColorMode)}>
            <SelectTrigger className="h-7 text-micro w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="cluster">Cluster</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="h-7 text-micro w-[80px]">
              <Clock className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="90d">90d</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleFit}>
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleExportSVG} title="Export as PNG">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="relative bg-card border border-border rounded-xl overflow-hidden"
        style={{ height: 500 }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        }>
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={dimensions.width}
            height={500}
            nodeLabel={(node: any) => `#${node.number} ${node.label}`}
            nodeColor={getNodeColor}
            nodeVal={(node: any) => node.val}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const r = Math.sqrt(node.val || 2) * 3;
              const isFocused = focusedNode === node.id;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r * (isFocused ? 1.5 : 1), 0, 2 * Math.PI);
              ctx.fillStyle = getNodeColor(node);
              ctx.fill();
              ctx.strokeStyle = isFocused ? "#fff" : hoveredNode?.id === node.id ? "#fff" : "rgba(255,255,255,0.15)";
              ctx.lineWidth = isFocused ? 2.5 : hoveredNode?.id === node.id ? 2 : 0.5;
              ctx.stroke();
              if (globalScale > 1.5 || isFocused) {
                ctx.font = `${Math.max(3, (isFocused ? 12 : 10) / globalScale)}px sans-serif`;
                ctx.fillStyle = "rgba(255,255,255,0.9)";
                ctx.textAlign = "center";
                ctx.fillText(node.label?.slice(0, 24) || "", node.x, node.y + r + 8 / globalScale);
              }
            }}
            linkColor={(link: any) => RELATION_COLORS[link.relationType] || "rgba(100,116,139,0.3)"}
            linkWidth={1.5}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={0.9}
            onNodeClick={handleNodeClick}
            onNodeHover={(node: any) => setHoveredNode(node)}
            onBackgroundClick={() => setFocusedNode(null)}
            backgroundColor="transparent"
            cooldownTicks={100}
            d3VelocityDecay={0.3}
          />
        </Suspense>

        {/* Hovered node info */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg pointer-events-none">
            <p className="text-xs font-semibold">#{hoveredNode.number} {hoveredNode.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-nano font-mono uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {hoveredNode.category || "uncategorized"}
              </span>
              <span className="text-nano text-muted-foreground">{hoveredNode.status}</span>
              {colorMode === "cluster" && (
                <span className="text-nano text-muted-foreground">Cluster {hoveredNode.cluster}</span>
              )}
            </div>
            <p className="text-nano text-muted-foreground/60 mt-0.5">Click to focus · Double-click to open</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-nano font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          {colorMode === "category" ? "Categories" : "Clusters"}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {colorMode === "category"
            ? Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-micro text-muted-foreground capitalize">{cat.replace("_", " ")}</span>
                </div>
              ))
            : CLUSTER_COLORS.slice(0, Math.min(10, new Set(nodes.map(n => n.cluster)).size)).map((color, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-micro text-muted-foreground">Cluster {i}</span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
