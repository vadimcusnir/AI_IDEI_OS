import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Notebook {
  id: string;
  title: string;
  description: string;
  visibility: string;
  source_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotebookSource {
  id: string;
  notebook_id: string;
  source_type: string;
  title: string;
  content: string;
  file_url: string | null;
  is_selected: boolean;
  created_at: string;
}

export interface NotebookMessage {
  id: string;
  notebook_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface NotebookArtifact {
  id: string;
  notebook_id: string;
  artifact_type: string;
  title: string;
  content: string;
  created_at: string;
}

export function useNotebooks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: ["notebooks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebooks")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Notebook[];
    },
    enabled: !!user,
  });

  const createNotebook = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from("notebooks")
        .insert({ owner_id: user!.id, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notebooks"] });
      toast.success("Notebook created");
    },
  });

  const deleteNotebook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notebooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notebooks"] });
      toast.success("Notebook deleted");
    },
  });

  return { notebooks, isLoading, createNotebook, deleteNotebook };
}

export function useNotebookDetail(notebookId: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notebook } = useQuery({
    queryKey: ["notebook", notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebooks")
        .select("*")
        .eq("id", notebookId!)
        .single();
      if (error) throw error;
      return data as Notebook;
    },
    enabled: !!notebookId && !!user,
  });

  const { data: sources = [] } = useQuery({
    queryKey: ["notebook-sources", notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebook_sources")
        .select("*")
        .eq("notebook_id", notebookId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as NotebookSource[];
    },
    enabled: !!notebookId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["notebook-messages", notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebook_messages")
        .select("*")
        .eq("notebook_id", notebookId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as NotebookMessage[];
    },
    enabled: !!notebookId,
  });

  const { data: artifacts = [] } = useQuery({
    queryKey: ["notebook-artifacts", notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebook_artifacts")
        .select("*")
        .eq("notebook_id", notebookId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as NotebookArtifact[];
    },
    enabled: !!notebookId,
  });

  const addSource = useMutation({
    mutationFn: async (source: { title: string; content: string; source_type: string; file_url?: string }) => {
      const { error } = await supabase
        .from("notebook_sources")
        .insert({ notebook_id: notebookId!, ...source });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notebook-sources", notebookId] });
      qc.invalidateQueries({ queryKey: ["notebook", notebookId] });
    },
  });

  const toggleSource = useMutation({
    mutationFn: async ({ id, selected }: { id: string; selected: boolean }) => {
      const { error } = await supabase
        .from("notebook_sources")
        .update({ is_selected: selected })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notebook-sources", notebookId] }),
  });

  const deleteSource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notebook_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notebook-sources", notebookId] });
      qc.invalidateQueries({ queryKey: ["notebook", notebookId] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase
        .from("notebook_messages")
        .insert({ notebook_id: notebookId!, role: "user", content });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notebook-messages", notebookId] }),
  });

  const updateTitle = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase
        .from("notebooks")
        .update({ title })
        .eq("id", notebookId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notebook", notebookId] });
      qc.invalidateQueries({ queryKey: ["notebooks"] });
    },
  });

  return {
    notebook, sources, messages, artifacts,
    addSource, toggleSource, deleteSource, sendMessage, updateTitle,
  };
}
