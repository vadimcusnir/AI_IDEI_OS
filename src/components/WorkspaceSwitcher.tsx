import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export function WorkspaceSwitcher({ collapsed = false }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const ws = await createWorkspace(newName.trim());
    setCreating(false);
    if (ws) {
      toast.success(`Workspace "${ws.name}" creat`);
      setShowCreate(false);
      setNewName("");
    } else {
      toast.error("Eroare la crearea workspace-ului");
    }
  };

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/15 transition-colors"
            title={currentWorkspace?.name || "Workspace"}
          >
            <Building2 className="h-4 w-4 text-primary" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="min-w-[200px]">
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              className="gap-2"
            >
              {ws.id === currentWorkspace?.id && <Check className="h-3 w-3" />}
              <span className={cn(ws.id !== currentWorkspace?.id && "ml-5")}>{ws.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-3 w-3" />
            Workspace nou
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Workspace</p>
              <p className="text-xs font-medium truncate">{currentWorkspace?.name || "—"}</p>
            </div>
            <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              className="gap-2 text-xs"
            >
              {ws.id === currentWorkspace?.id ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <div className="w-3" />
              )}
              <span className="truncate">{ws.name}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreate(true)} className="gap-2 text-xs">
            <Plus className="h-3 w-3" />
            Workspace nou
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Workspace Nou</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Numele workspace-ului"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Anulează</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? "Se creează…" : "Creează"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
