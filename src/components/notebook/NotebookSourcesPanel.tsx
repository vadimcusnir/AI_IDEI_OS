import { useState } from "react";
import { Plus, FileText, Globe, Search, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotebookSource } from "@/hooks/useNotebook";
import type { UseMutationResult } from "@tanstack/react-query";

interface Props {
  sources: NotebookSource[];
  addSource: UseMutationResult<void, Error, { title: string; content: string; source_type: string }>;
  toggleSource: UseMutationResult<void, Error, { id: string; selected: boolean }>;
  deleteSource: UseMutationResult<void, Error, string>;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  url: Globe,
  pdf: FileText,
};

export function NotebookSourcesPanel({ sources, addSource, toggleSource, deleteSource }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [filter, setFilter] = useState("");

  const filteredSources = sources.filter((s) =>
    s.title.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSource.mutate(
      { title: newTitle.trim(), content: newContent, source_type: "text" },
      { onSuccess: () => { setShowAdd(false); setNewTitle(""); setNewContent(""); } }
    );
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Sources</h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowAdd(!showAdd)}
          >
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search sources..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="px-4 py-3 border-b border-border space-y-2 shrink-0">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Source title"
            className="h-8 text-xs"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Paste content here..."
            className="w-full h-20 text-xs bg-background border border-border rounded-md px-3 py-2 resize-none outline-none"
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd} disabled={addSource.isPending}>
              <Check className="h-3 w-3 mr-1" /> Add
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAdd(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Source list */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-0.5">
          {filteredSources.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No sources added yet
            </div>
          ) : (
            filteredSources.map((src) => {
              const Icon = SOURCE_ICONS[src.source_type] || FileText;
              return (
                <div
                  key={src.id}
                  className="group flex items-start gap-2 px-2 py-2 rounded-md hover:bg-accent/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={src.is_selected}
                    onChange={() => toggleSource.mutate({ id: src.id, selected: !src.is_selected })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                  />
                  <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className={cn(
                    "flex-1 text-xs truncate",
                    src.is_selected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {src.title}
                  </span>
                  <button
                    onClick={() => deleteSource.mutate(src.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
