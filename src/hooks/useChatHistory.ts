import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  session_id: string;
  last_message: string;
  created_at: string;
  message_count: number;
}

const LAST_SESSION_KEY = "agent-console-last-session";

export function useChatHistory() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>(() => {
    // Try to resume last session
    const stored = localStorage.getItem(LAST_SESSION_KEY);
    return stored || crypto.randomUUID();
  });
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Persist current session ID
  useEffect(() => {
    localStorage.setItem(LAST_SESSION_KEY, sessionId);
  }, [sessionId]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setIsLoadingSessions(true);
    try {
      const { data } = await supabase
        .from("chat_messages")
        .select("session_id, content, created_at, role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!data) { setSessions([]); return; }

      const sessionMap = new Map<string, ChatSession>();
      const counts = new Map<string, number>();

      for (const row of data) {
        counts.set(row.session_id, (counts.get(row.session_id) || 0) + 1);
        if (!sessionMap.has(row.session_id) && row.role === "user") {
          sessionMap.set(row.session_id, {
            session_id: row.session_id,
            last_message: row.content.slice(0, 80),
            created_at: row.created_at,
            message_count: 0,
          });
        }
      }

      // Enrich with counts
      const result = Array.from(sessionMap.values()).map(s => ({
        ...s,
        message_count: counts.get(s.session_id) || 0,
      }));

      setSessions(result.slice(0, 30));
    } finally {
      setIsLoadingSessions(false);
    }
  }, [user]);

  // Load sessions on mount
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const saveMessage = useCallback(async (msg: ChatMessage) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata || {},
    });

    // Debounce session list refresh
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => fetchSessions(), 1000);
  }, [user, sessionId, fetchSessions]);

  const loadSession = useCallback(async (sid: string): Promise<ChatMessage[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_id", sid)
      .order("created_at", { ascending: true });

    setSessionId(sid);
    return (data || []).map((r: any) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      content: r.content,
      timestamp: new Date(r.created_at),
      metadata: r.metadata,
    }));
  }, [user]);

  const deleteSession = useCallback(async (sid: string) => {
    if (!user) return;
    await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("session_id", sid);
    setSessions(prev => prev.filter(s => s.session_id !== sid));
    // If deleted current session, start fresh
    if (sid === sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [user, sessionId]);

  const newSession = useCallback(() => {
    const newId = crypto.randomUUID();
    setSessionId(newId);
  }, []);

  // Auto-load last session's messages
  const loadCurrentSession = useCallback(async (): Promise<ChatMessage[]> => {
    return loadSession(sessionId);
  }, [sessionId, loadSession]);

  return {
    sessionId,
    sessions,
    isLoadingSessions,
    saveMessage,
    loadSession,
    loadCurrentSession,
    deleteSession,
    newSession,
    refreshSessions: fetchSessions,
  };
}
