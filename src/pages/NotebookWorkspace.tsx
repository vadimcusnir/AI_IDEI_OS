import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { useNotebooks } from "@/hooks/useNotebook";
import { Plus, BookOpen, Trash2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function NotebookWorkspace() {
  const { notebooks, isLoading, createNotebook, deleteNotebook } = useNotebooks();
  const [newTitle, setNewTitle] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => {
    const title = newTitle.trim() || "Untitled Notebook";
    createNotebook.mutate(title, {
      onSuccess: (nb) => navigate(`/notebook/${nb.id}`),
    });
    setNewTitle("");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEOHead title="Notebooks — AI-IDEI" description="Knowledge workspaces powered by AI" />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notebooks</h1>
          <p className="text-sm text-muted-foreground mt-1">Your AI-powered knowledge workspaces</p>
        </div>
      </div>

      {/* Create new */}
      <div className="flex gap-2 mb-8">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New notebook title..."
          className="max-w-sm"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={createNotebook.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </div>

      {/* Notebook list */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notebooks yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notebooks.map((nb) => (
            <div
              key={nb.id}
              onClick={() => navigate(`/notebook/${nb.id}`)}
              className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/5 cursor-pointer transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">{nb.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {nb.source_count} sources · {formatDistanceToNow(new Date(nb.updated_at), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {nb.visibility === "public" ? (
                  <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/50" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotebook.mutate(nb.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
