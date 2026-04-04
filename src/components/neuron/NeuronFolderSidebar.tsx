import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Plus, MoreHorizontal, Trash2, Pencil, X, Check,
  Sparkles, Loader2, FolderPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
  neuronIds: number[];
}

interface NeuronFolderSidebarProps {
  neurons: { id: number; number: number; title: string; status: string }[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onAISuggest: () => void;
  aiSuggesting: boolean;
}

const FOLDERS_KEY = "neuron_folders";
const ASSIGNMENTS_KEY = "neuron_folder_assignments";

function loadFolders(): FolderNode[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFolders(folders: FolderNode[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

function loadAssignments(): Record<number, string> {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAssignments(assignments: Record<number, string>) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

let idCounter = Date.now();
function genId() { return `f_${idCounter++}`; }

export function useNeuronFolders() {
  const [folders, setFolders] = useState<FolderNode[]>(loadFolders);
  const [assignments, setAssignments] = useState<Record<number, string>>(loadAssignments);

  useEffect(() => { saveFolders(folders); }, [folders]);
  useEffect(() => { saveAssignments(assignments); }, [assignments]);

  const addFolder = useCallback((name: string, parentId: string | null) => {
    const newFolder: FolderNode = { id: genId(), name, parentId, children: [], neuronIds: [] };
    setFolders(prev => {
      if (!parentId) return [...prev, newFolder];
      const addChild = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => n.id === parentId
          ? { ...n, children: [...n.children, newFolder] }
          : { ...n, children: addChild(n.children) }
        );
      return addChild(prev);
    });
    return newFolder.id;
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setFolders(prev => {
      const rename = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => n.id === folderId ? { ...n, name } : { ...n, children: rename(n.children) });
      return rename(prev);
    });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders(prev => {
      const remove = (nodes: FolderNode[]): FolderNode[] =>
        nodes.filter(n => n.id !== folderId).map(n => ({ ...n, children: remove(n.children) }));
      return remove(prev);
    });
    setAssignments(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === folderId) delete next[Number(k) as unknown as number];
      }
      return next;
    });
  }, []);

  const assignNeuron = useCallback((neuronId: number, folderId: string) => {
    setAssignments(prev => ({ ...prev, [neuronId]: folderId }));
  }, []);

  const unassignNeuron = useCallback((neuronId: number) => {
    setAssignments(prev => {
      const next = { ...prev };
      delete next[neuronId];
      return next;
    });
  }, []);

  const importStructure = useCallback((structure: { name: string; children: { name: string; children: { name: string }[] }[] }[]) => {
    const newFolders: FolderNode[] = structure.map(cat => {
      const catId = genId();
      return {
        id: catId,
        name: cat.name,
        parentId: null,
        neuronIds: [],
        children: (cat.children || []).map(sub => ({
          id: genId(),
          name: sub.name,
          parentId: catId,
          neuronIds: [],
          children: (sub.children || []).map(leaf => ({
            id: genId(),
            name: leaf.name,
            parentId: null,
            neuronIds: [],
            children: [],
          }))
        }))
      };
    });
    setFolders(prev => [...prev, ...newFolders]);
  }, []);

  return { folders, assignments, addFolder, renameFolder, deleteFolder, assignNeuron, unassignNeuron, importStructure };
}

export function NeuronFolderSidebar({
  neurons, selectedFolderId, onSelectFolder, onAISuggest, aiSuggesting
}: NeuronFolderSidebarProps) {
  const { t } = useTranslation("common");
  const { folders, assignments, addFolder, renameFolder, deleteFolder, assignNeuron } = useNeuronFolders();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null | "root">(null);
  const [newName, setNewName] = useState("");
  const [dragNeuronId, setDragNeuronId] = useState<number | null>(null);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAdd = (parentId: string | null) => {
    if (!newName.trim()) { setAddingTo(null); return; }
    addFolder(newName.trim(), parentId);
    setNewName("");
    setAddingTo(null);
    if (parentId) setExpanded(prev => new Set(prev).add(parentId));
  };

  const handleRename = (id: string) => {
    if (editName.trim()) renameFolder(id, editName.trim());
    setEditingId(null);
  };

  const countNeurons = useCallback((folderId: string): number => {
    return Object.values(assignments).filter(v => v === folderId).length;
  }, [assignments]);

  const unassignedCount = useMemo(() => {
    const assigned = new Set(Object.keys(assignments).map(Number));
    return neurons.filter(n => !assigned.has(n.id)).length;
  }, [neurons, assignments]);

  const renderFolder = (folder: FolderNode, depth: number) => {
    const isExpanded = expanded.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const count = countNeurons(folder.id);

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors group text-sm",
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/50",
            depth > 0 && "ml-3"
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => { toggle(folder.id); onSelectFolder(isSelected ? null : folder.id); }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("bg-primary/20"); }}
          onDragLeave={e => { e.currentTarget.classList.remove("bg-primary/20"); }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.classList.remove("bg-primary/20");
            const nId = (window as any).__dragNeuronId;
            if (nId) { assignNeuron(nId, folder.id); (window as any).__dragNeuronId = null; }
          }}
        >
          <button className="h-4 w-4 flex items-center justify-center shrink-0" onClick={e => { e.stopPropagation(); toggle(folder.id); }}>
            {folder.children.length > 0 ? (
              isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
            ) : <span className="w-3" />}
          </button>
          {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}

          {editingId === folder.id ? (
            <form className="flex-1 flex items-center gap-1" onSubmit={e => { e.preventDefault(); handleRename(folder.id); }}>
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none border-b border-primary px-0.5"
                onBlur={() => handleRename(folder.id)}
              />
            </form>
          ) : (
            <span className="flex-1 text-xs truncate">{folder.name}</span>
          )}
          {count > 0 && <span className="text-nano text-muted-foreground/50">{count}</span>}

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setAddingTo(folder.id); setNewName(""); }}>
                <FolderPlus className="h-3 w-3 mr-2" />
                {t("folders.add_subfolder")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }}>
                <Pencil className="h-3 w-3 mr-2" />
                {t("folders.rename")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}>
                <Trash2 className="h-3 w-3 mr-2" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {addingTo === folder.id && (
          <form
            className="flex items-center gap-1 py-1 ml-3"
            style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            onSubmit={e => { e.preventDefault(); handleAdd(folder.id); }}
          >
            <FolderPlus className="h-3 w-3 text-primary/60 shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t("folders.subfolder_name")}
              className="flex-1 bg-transparent text-xs outline-none border-b border-primary/30 px-0.5"
              onBlur={() => handleAdd(folder.id)}
            />
          </form>
        )}

        {isExpanded && folder.children.map(child => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-56 shrink-0 border-r border-border bg-card/50 flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{t("folders.folders")}</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={onAISuggest}
            disabled={aiSuggesting}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
            title={t("folders.ai_suggest")}
          >
            {aiSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          </button>
          <button
            onClick={() => { setAddingTo("root"); setNewName(""); }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/60 hover:text-foreground transition-colors"
            title={t("folders.new_folder")}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
        <div
          className={cn(
            "flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm",
            !selectedFolderId ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
          )}
          onClick={() => onSelectFolder(null)}
        >
          <Folder className="h-3.5 w-3.5" />
          <span className="flex-1 text-xs">{t("folders.all_neurons")}</span>
          <span className="text-nano text-muted-foreground/50">{neurons.length}</span>
        </div>

        {unassignedCount > 0 && unassignedCount < neurons.length && (
          <div
            className={cn(
              "flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm",
              selectedFolderId === "__unassigned" ? "bg-primary/10 text-primary" : "hover:bg-accent/50"
            )}
            onClick={() => onSelectFolder(selectedFolderId === "__unassigned" ? null : "__unassigned")}
          >
            <Folder className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="flex-1 text-xs text-muted-foreground">{t("folders.uncategorized")}</span>
            <span className="text-nano text-muted-foreground/50">{unassignedCount}</span>
          </div>
        )}

        {folders.length > 0 && <div className="h-px bg-border/50 my-1" />}

        {folders.map(f => renderFolder(f, 0))}

        {addingTo === "root" && (
          <form className="flex items-center gap-1.5 py-1 px-2" onSubmit={e => { e.preventDefault(); handleAdd(null); }}>
            <FolderPlus className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={t("folders.folder_name")}
              className="flex-1 bg-transparent text-xs outline-none border-b border-primary/30"
              onBlur={() => handleAdd(null)}
            />
          </form>
        )}
      </div>
    </div>
  );
}
