import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Eye, EyeOff, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/AdminSubComponents";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface NeuronRow {
  id: number; number: number; title: string; status: string; visibility: string;
  author_id: string; created_at: string; score: number; lifecycle: string;
}

export function AdminNeuronsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [neurons, setNeurons] = useState<NeuronRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("neurons")
      .select("id, number, title, status, visibility, author_id, created_at, score, lifecycle")
      .order("created_at", { ascending: false }).limit(50);
    setNeurons(data as NeuronRow[] || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleVisibility = async (neuronId: number, currentVis: string) => {
    const newVis = currentVis === "public" ? "private" : "public";
    const { error } = await supabase.from("neurons").update({ visibility: newVis }).eq("id", neuronId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Visibility changed to ${newVis}`);
    load();
  };

  const deleteNeuron = async (neuronId: number) => {
    const { error } = await supabase.from("neurons").delete().eq("id", neuronId);
    if (error) { toast.error(error.message); return; }
    toast.success("Neuron deleted");
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={load}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] w-16">#</TableHead>
              <TableHead className="text-[10px]">Title</TableHead>
              <TableHead className="text-[10px]">Status</TableHead>
              <TableHead className="text-[10px]">Visibility</TableHead>
              <TableHead className="text-[10px]">Lifecycle</TableHead>
              <TableHead className="text-[10px] text-right">Score</TableHead>
              <TableHead className="text-[10px]">Created</TableHead>
              <TableHead className="text-[10px] w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {neurons.map(n => (
              <TableRow key={n.id}>
                <TableCell className="text-xs font-mono text-primary font-bold">
                  <button onClick={() => navigate(`/n/${n.number}`)} className="hover:underline">{n.number}</button>
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  <button onClick={() => navigate(`/n/${n.number}`)} className="hover:underline">{n.title}</button>
                </TableCell>
                <TableCell><StatusBadge status={n.status} /></TableCell>
                <TableCell><StatusBadge status={n.visibility} /></TableCell>
                <TableCell><StatusBadge status={n.lifecycle} /></TableCell>
                <TableCell className="text-xs font-mono text-right">{n.score.toFixed(1)}</TableCell>
                <TableCell className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(n.id, n.visibility)}>
                      {n.visibility === "public" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Neuron #{n.number}?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. The neuron and all related data will be permanently deleted.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteNeuron(n.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
