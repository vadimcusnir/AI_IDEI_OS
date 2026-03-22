import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatSession {
  id: string;
  notebook_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useNotebookSessions(notebookId: string | undefined) {
  const qc = useQueryClient();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ["notebook-sessions", notebookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notebook_chat_sessions")
        .select("*")
        .eq("notebook_id", notebookId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as ChatSession[];
    },
    enabled: !!notebookId,
  });

  // Auto-select first session or create one
  const ensureSession = useCallback(async () => {
    if (!notebookId) return null;
    if (activeSessionId) return activeSessionId;
    
    if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
      return sessions[0].id;
    }

    // Create default session
    const { data, error } = await supabase
      .from("notebook_chat_sessions")
      .insert({ notebook_id: notebookId, title: "Chat 1" })
      .select()
      .single();
    if (error) return null;
    qc.invalidateQueries({ queryKey: ["notebook-sessions", notebookId] });
    setActiveSessionId(data.id);
    return data.id;
  }, [notebookId, activeSessionId, sessions, qc]);

  const createSession = useMutation({
    mutationFn: async (title?: string) => {
      const sessionTitle = title || `Chat ${sessions.length + 1}`;
      const { data, error } = await supabase
        .from("notebook_chat_sessions")
        .insert({ notebook_id: notebookId!, title: sessionTitle })
        .select()
        .single();
      if (error) throw error;
      return data as ChatSession;
    },
    onSuccess: (data) => {
      setActiveSessionId(data.id);
      qc.invalidateQueries({ queryKey: ["notebook-sessions", notebookId] });
    },
  });

  const renameSession = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("notebook_chat_sessions")
        .update({ title })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notebook-sessions", notebookId] }),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notebook_chat_sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      if (activeSessionId === deletedId) {
        const remaining = sessions.filter((s) => s.id !== deletedId);
        setActiveSessionId(remaining[0]?.id || null);
      }
      qc.invalidateQueries({ queryKey: ["notebook-sessions", notebookId] });
    },
  });

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    ensureSession,
    createSession,
    renameSession,
    deleteSession,
  };
}
