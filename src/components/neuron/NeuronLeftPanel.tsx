import { useState } from "react";
import {
  ChevronRight, ChevronDown, Network, Link2, AtSign,
  GitBranch, Zap, FolderTree, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  label: string;
  type: "category" | "cluster" | "neuron";
  children?: GraphNode[];
  isCurrent?: boolean;
}

interface BacklinkItem {
  id: string;
  title: string;
  relation: string;
}

interface NeuronLeftPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const graphTree: GraphNode[] = [
  {
    id: "1", label: "Knowledge Base", type: "category", children: [
      {
        id: "2", label: "Marketing", type: "cluster", children: [
          {
            id: "3", label: "Viral Ideas", type: "cluster", children: [
              {
                id: "4", label: "Psychology", type: "cluster", children: [
                  { id: "5", label: "Scarcity Attention Law", type: "neuron", isCurrent: true },
                ]
              },
              { id: "6", label: "Network Effects", type: "neuron" },
            ]
          },
          { id: "7", label: "Growth Hacking", type: "neuron" },
        ]
      },
      {
        id: "8", label: "Economics", type: "cluster", children: [
          { id: "9", label: "Attention Economy", type: "neuron" },
          { id: "10", label: "Token Models", type: "neuron" },
        ]
      },
    ]
  },
];

const backlinks: BacklinkItem[] = [
  { id: "bl1", title: "Attention Economy", relation: "references" },
  { id: "bl2", title: "Viral Content Framework", relation: "extends" },
  { id: "bl3", title: "Identity & Branding", relation: "supports" },
];

const mentions: BacklinkItem[] = [
  { id: "m1", title: "Growth Hacking Playbook", relation: "cited in" },
  { id: "m2", title: "Marketing Course v2", relation: "used in" },
];

const derived: BacklinkItem[] = [
  { id: "d1", title: "Scarcity Framework (Card)", relation: "derived_from" },
];

function TreeNode({ node, depth = 0 }: { node: GraphNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(
    node.children?.some(c => c.isCurrent || c.children?.some(cc => cc.isCurrent || cc.children?.some(ccc => ccc.isCurrent || ccc.children?.some(cccc => cccc.isCurrent)))) ?? false
  );

  const hasChildren = node.children && node.children.length > 0;
  const Icon = node.type === "category" ? FolderTree : node.type === "cluster" ? Network : Zap;

  return (
    <div>
      <button
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-1.5 py-1 px-1.5 rounded-md text-xs transition-colors text-left",
          node.isCurrent
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {hasChildren ? (
          isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
        ) : (
          <span className="w-3" />
        )}
        <Icon className={cn("h-3 w-3 shrink-0", node.isCurrent && "text-primary")} />
        <span className="truncate">{node.label}</span>
      </button>
      {isOpen && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinkSection({ title, icon: Icon, items }: { title: string; icon: React.ElementType; items: BacklinkItem[] }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="panel-section">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="panel-section-title flex items-center gap-1.5 w-full text-left"
      >
        <Icon className="h-3 w-3" />
        {title}
        <span className="text-[9px] bg-muted rounded-full px-1.5 ml-auto">{items.length}</span>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="space-y-0.5 mt-1">
          {items.map(item => (
            <button
              key={item.id}
              className="w-full flex items-center gap-2 py-1 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
            >
              <Zap className="h-3 w-3 shrink-0 text-primary/50" />
              <span className="truncate flex-1">{item.title}</span>
              <span className="text-[9px] text-muted-foreground/60">{item.relation}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function NeuronLeftPanel({ isCollapsed, onToggle }: NeuronLeftPanelProps) {
  if (isCollapsed) {
    return (
      <div className="w-10 border-r border-border bg-card flex flex-col items-center py-3 gap-3 shrink-0">
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          <Network className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Link2 className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <AtSign className="h-4 w-4" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <GitBranch className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-56 border-r border-border bg-card flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Knowledge Graph</span>
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md px-2 py-1">
          <Search className="h-3 w-3 text-muted-foreground" />
          <input
            placeholder="Search graph..."
            className="text-xs bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="panel-section">
          <div className="panel-section-title flex items-center gap-1.5">
            <FolderTree className="h-3 w-3" />
            Graph Position
          </div>
          {graphTree.map(node => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>

        <LinkSection title="Backlinks" icon={Link2} items={backlinks} />
        <LinkSection title="Mentions" icon={AtSign} items={mentions} />
        <LinkSection title="Derived" icon={GitBranch} items={derived} />
      </div>
    </div>
  );
}
