import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Folder, FolderOpen, ChevronRight, ChevronDown,
  Plus, MoreHorizontal, Trash2, Pencil, FolderPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
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
  storageKey: string;
  items: { id: string; label: string }[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  allLabel?: string;
  headerLabel?: string;
}

function loadJson<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}

let _ctr = Date.now();
function gid() { return `sf_${_ctr++}`; }

export function useFolderSidebar(storageKey: string) {
  const fk = `${storageKey}_folders`, ak = `${storageKey}_assignments`;
  const [folders, setFolders] = useState<FolderNode[]>(() => loadJson(fk, []));
  const [assignments, setAssignments] = useState<Record<string, string>>(() => loadJson(ak, {}));

  useEffect(() => { localStorage.setItem(fk, JSON.stringify(folders)); }, [folders, fk]);
  useEffect(() => { localStorage.setItem(ak, JSON.stringify(assignments)); }, [assignments, ak]);

  const addFolder = useCallback((name: string, parentId: string | null) => {
    const nf: FolderNode = { id: gid(), name, parentId, children: [] };
    setFolders(p => {
      if (!parentId) return [...p, nf];
      const add = (ns: FolderNode[]): FolderNode[] =>
        ns.map(n => n.id === parentId ? { ...n, children: [...n.children, nf] } : { ...n, children: add(n.children) });
      return add(p);
    });
  }, []);

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(p => {
      const ren = (ns: FolderNode[]): FolderNode[] => ns.map(n => n.id === id ? { ...n, name } : { ...n, children: ren(n.children) });
      return ren(p);
    });
  }, []);

  const deleteFolder = useCallback((id: string) => {
    setFolders(p => { const rm = (ns: FolderNode[]): FolderNode[] => ns.filter(n => n.id !== id).map(n => ({ ...n, children: rm(n.children) })); return rm(p); });
    setAssignments(p => { const n = { ...p }; for (const [k, v] of Object.entries(n)) { if (v === id) delete n[k]; } return n; });
  }, []);

  const assignItem = useCallback((itemId: string, folderId: string) => {
    setAssignments(p => ({ ...p, [itemId]: folderId }));
  }, []);

  return { folders, assignments, addFolder, renameFolder, deleteFolder, assignItem };
}

export function FolderSidebar({ storageKey, items, selectedFolderId, onSelectFolder, allLabel, headerLabel }: FolderSidebarProps) {
  const { t } = useTranslation("common");
  const resolvedAllLabel = allLabel || t("all");
  const resolvedHeaderLabel = headerLabel || t("folders.folders");
  const { folders, assignments, addFolder, renameFolder, deleteFolder, assignItem } = useFolderSidebar(storageKey);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null | "root">(null);
  const [newName, setNewName] = useState("");

  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleAdd = (parentId: string | null) => {
    if (!newName.trim()) { setAddingTo(null); return; }
    addFolder(newName.trim(), parentId);
    setNewName(""); setAddingTo(null);
    if (parentId) setExpanded(p => new Set(p).add(parentId));
  };

  const handleRename = (id: string) => { if (editName.trim()) renameFolder(id, editName.trim()); setEditingId(null); };

  const countItems = useCallback((fid: string): number => Object.values(assignments).filter(v => v === fid).length, [assignments]);

  const unassignedCount = useMemo(() => {
    const assigned = new Set(Object.keys(assignments));
    return items.filter(i => !assigned.has(i.id)).length;
  }, [items, assignments]);

  const renderFolder = (folder: FolderNode, depth: number) => {
    const isExp = expanded.has(folder.id);
    const isSel = selectedFolderId === folder.id;
    const cnt = countItems(folder.id);
    return (
      <div key={folder.id}>
        <div className={cn("flex items-center gap-1 py-1 px-1 rounded cursor-pointer transition-colors group text-sm",
          isSel ? "bg-primary/10 text-primary" : "hover:bg-accent/50")}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => { toggle(folder.id); onSelectFolder(isSel ? null : folder.id); }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("bg-primary/20"); }}
          onDragLeave={e => e.currentTarget.classList.remove("bg-primary/20")}
          onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("bg-primary/20");
            const iId = (window as any).__dragItemId; if (iId) { assignItem(iId, folder.id); (window as any).__dragItemId = null; } }}>
          <button className="h-4 w-4 flex items-center justify-center shrink-0" onClick={e => { e.stopPropagation(); toggle(folder.id); }}>
            {folder.children.length > 0 ? (isExp ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />) : <span className="w-3" />}
          </button>
          {isExp ? <FolderOpen className="h-3.5 w-3.5 text-primary/60 shrink-0" /> : <Folder className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />}
          {editingId === folder.id ? (
            <form className="flex-1 flex items-center gap-1" onSubmit={e => { e.preventDefault(); handleRename(folder.id); }}>
              <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none border-b border-primary px-0.5" onBlur={() => handleRename(folder.id)} />
            </form>
          ) : <span className="flex-1 text-xs truncate">{folder.name}</span>}
          {cnt > 0 && <span className="text-nano text-muted-foreground/50">{cnt}</span>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <button className="h-5 w-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"><MoreHorizontal className="h-3 w-3" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setAddingTo(folder.id); setNewName(""); }}><FolderPlus className="h-3 w-3 mr-2" />{t("folders.add_subfolder")}</DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }}><Pencil className="h-3 w-3 mr-2" />{t("folders.rename")}</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteFolder(folder.id); }}><Trash2 className="h-3 w-3 mr-2" />{t("delete")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {addingTo === folder.id && (
          <form className="flex items-center gap-1 py-1 ml-3" style={{ paddingLeft: `${(depth + 1) * 12 + 4}px` }}
            onSubmit={e => { e.preventDefault(); handleAdd(folder.id); }}>
            <FolderPlus className="h-3 w-3 text-primary/60 shrink-0" />
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("folders.subfolder_name")}
              className="flex-1 bg-transparent text-xs outline-none border-b border-primary/30 px-0.5" onBlur={() => handleAdd(folder.id)} />
          </form>
        )}
        {isExp && folder.children.map(c => renderFolder(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-56 shrink-0 border-r border-border bg-card/50 flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-micro font-semibold uppercase tracking-wider text-muted-foreground">{resolvedHeaderLabel}</span>
        <button onClick={() => { setAddingTo("root"); setNewName(""); }}
          className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/60 hover:text-foreground transition-colors" title={t("folders.new_folder")}>
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5">
        <div className={cn("flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm",
          !selectedFolderId ? "bg-primary/10 text-primary" : "hover:bg-accent/50")} onClick={() => onSelectFolder(null)}>
          <Folder className="h-3.5 w-3.5" /><span className="flex-1 text-xs">{resolvedAllLabel}</span>
          <span className="text-nano text-muted-foreground/50">{items.length}</span>
        </div>
        {unassignedCount > 0 && unassignedCount < items.length && (
          <div className={cn("flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer transition-colors text-sm",
            selectedFolderId === "__unassigned" ? "bg-primary/10 text-primary" : "hover:bg-accent/50")}
            onClick={() => onSelectFolder(selectedFolderId === "__unassigned" ? null : "__unassigned")}>
            <Folder className="h-3.5 w-3.5 text-muted-foreground/40" /><span className="flex-1 text-xs text-muted-foreground">{t("folders.uncategorized")}</span>
            <span className="text-nano text-muted-foreground/50">{unassignedCount}</span>
          </div>
        )}
        {folders.length > 0 && <div className="h-px bg-border/50 my-1" />}
        {folders.map(f => renderFolder(f, 0))}
        {addingTo === "root" && (
          <form className="flex items-center gap-1.5 py-1 px-2" onSubmit={e => { e.preventDefault(); handleAdd(null); }}>
            <FolderPlus className="h-3.5 w-3.5 text-primary/60 shrink-0" />
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("folders.folder_name")}
              className="flex-1 bg-transparent text-xs outline-none border-b border-primary/30" onBlur={() => handleAdd(null)} />
          </form>
        )}
      </div>
    </div>
  );
}
