import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Plus, MoreHorizontal, Trash2, Pencil, FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FolderNode[];
}

interface FolderSidebarProps {
  /** localStorage key prefix for persistence */
  storageKey: string;
  /** Items that can be assigned to folders */
  items: { id: string; label: string }[];
  /** Currently selected folder */
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  /** Label for "All" option */
  allLabel?: string;
  /** Label for header */
  headerLabel?: string;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

let idCounter = Date.now();
function genId() { return `sf_${idCounter++}`; }

export function useFolderSidebar(storageKey: string) {
  const fKey = `${storageKey}_folders`;
  const aKey = `${storageKey}_assignments`;
  const [folders, setFolders] = useState<FolderNode[]>(() => loadFromStorage(fKey, []));
  const [assignments, setAssignments] = useState<Record<string, string>>(() => loadFromStorage(aKey, {}));

  useEffect(() => { localStorage.setItem(fKey, JSON.stringify(folders)); }, [folders, fKey]);
  useEffect(() => { localStorage.setItem(aKey, JSON.stringify(assignments)); }, [assignments, aKey]);

  const addFolder = useCallback((name: string, parentId: string | null) => {
    const nf: FolderNode = { id: genId(), name, parentId, children: [] };
    setFolders(prev => {
      if (!parentId) return [...prev, nf];
      const addChild = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => n.id === parentId ? { ...n, children: [...n.children, nf] } : { ...n, children: addChild(n.children) });
      return addChild(prev);
    });
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(prev => {
      const ren = (nodes: FolderNode[]): FolderNode[] =>
        nodes.map(n => n.id === id ? { ...n, name } : { ...n, children: ren(n.children) });
      return ren(prev);
    });
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => {
      const rm = (nodes: FolderNode[]): FolderNode[] =>
        nodes.filter(n => n.id !== id).map(n => ({ ...n, children: rm(n.children) }));
      return rm(prev);
    });
    setAssignments(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) { if (v === id) delete next[k]; }
      return next;
    });
  }, []);

  const assignItem = useCallback((itemId: string, folderId: string) => {
    setAssignments(prev => ({ ...prev, [itemId]: folderId }));
  }, []);

  return { folders, assignments, addFolder, renameFolder, deleteFolder, assignItem };
}

export function FolderSidebar({
  storageKey, items, selectedFolderId, onSelectFolder,
  allLabel = "All", headerLabel = "Folders",
}: FolderSidebarProps) {
  const { folders, assignments, addFolder, renameFolder, deleteFolder, assignItem } = useFolderSidebar(storageKey);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null | "root">(null);
  const [newName, setNewName] = useState("");

  const toggle = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
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

  const countItems = useCallback((folderId: string): number => {
    return Object.values(assignments).filter(v => v === folderId).length;
  }, [assignments]);

  const unassignedCount = useMemo(() => {
    const assigned = new Set(Object.keys(assignments));
    return items.filter(i => !assigned.has(i.id)).length;
  }, [items, assignments]);

  const renderFolder = (folder: FolderNode, depth: number) => {
    const isExpanded = expanded.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const count = countItems(folder.id);

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors group text-sm",
            isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent/50",
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => { toggle(folder.id); onSelectFolder(isSelected ? null : folder.id); }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("bg-primary/20"); }}
          onDragLeave={e => { e.currentTarget.classList.remove("bg-primary/20"); }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.classList.remove("bg-primary/20");
            const iId = (window as any).__dragItemId;
            if (iId) { assignItem(iId, folder.id); (window as any).__dragItemId = null; }
          }}
        >
          <button className="h-4 w-4 flex items-center justify-center shrink-0" onClick={e => { e.stopPropagation(); toggle(folder.id); }}>
            {folder.children.length > 0 ? (isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : <span className="w-3" />}
          </button>
          {isExpanded ? <FolderOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}

          {editingId === folder.id ? (
            <form className="flex-1 flex items-center gap-1" onSubmit={e => { e.preventDefault(); handleRename(folder.id); }}>
              <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none border-b border-primary px-0.5" onBlur={() => handleRename(folder.id)} />
            </form>
          ) : (
            <span className="flex-1 text-xs truncate">{folder.name}</span>
          )}
          {count > 0 && <span className="text-[9px] text-muted-foreground/50">{count}</span>}

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setAddingTo(folder.id); setNewName(""); }}>
                <FolderPlus className="h-3 w-3 mr-2" /> Add subfolder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }}>
                <Pencil className="h-3 w-3 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}>
                <Trash2 className="h-3 w-3 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {addingTo === folder.id && (
          <form className="flex items-center gap-1 py-1 ml-3" style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            onSubmit={e => { e.preventDefault(); handleAdd(folder.id); }}>
            <FolderPlus className="h-3 w-3 text-primary/60 shrink-0" />
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Subfolder name..."
              className="flex-1 bg-transparent text-xs outline-none border-b border-primary/30 px-0.5" onBlur={() => handleAdd(folder.id)} />
          </form>
        )}

        {isExpanded && folder.children.map(child => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-56 shrink-0 border-r border-border bg-card/50 flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{headerLabel}</span>
        <button onClick={() => { setAddingTo("root"); setNewName(""); }}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/60 hover:text-foreground transition-colors" title="New folder">
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
        <div className={cn("flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm",
          !selectedFolderId ? "bg-primary/10 text-primary" : "hover:bg-accent/50")} onClick={() => onSelectFolder(null)}>
          <Folder className="h-3.5 w-3.5" />
          <span className="flex-1 text-xs">{allLabel}</span>
          <span className="text-[9px] text-muted-foreground/50">{items.length}</span>
        </div>

        {unassignedCount > 0 && unassignedCount < items.length && (
          <div className={cn("flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm",
            selectedFolderId === "__unassigned" ? "bg-primary/10 text-primary" : "hover:bg-accent/50")}
            onClick={() => onSelectFolder(selectedFolderId === "__unassigned" ? null : "__unassigned")}>
            <Folder className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="flex-1 text-xs text-muted-foreground">Uncategorized</span>
            <span className="text-[9px] text-muted-foreground/50">{unassignedCount}</span>
          </div>
        )}

        {folders.length > 0 && <div className="h-px bg-border/50 my-1" />}
        {folders.map(f => renderFolder(f, 0))}

        {addingTo === "root" && (
          <form className="flex items-center gap-1.5 py-1 px-2" onSubmit={e => { e.preventDefault(); handleAdd(null); }}>
            <FolderPlus className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Folder name..."
              className="flex-1 bg-transparent text-xs outline-none border-b border-primary/30" onBlur={() => handleAdd(null)} />
          </form>
        )}
      </div>
    </div>
  );
}
