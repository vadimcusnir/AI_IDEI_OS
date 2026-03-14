import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>(() => crypto.randomUUID());
  const [sessions, setSessions] = useState<{ session_id: string; last_message: string; created_at: string }[]>([]);

  // Load previous sessions
  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_messages")
      .select("session_id, content, created_at")
      .eq("user_id", user.id)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data) return;
        const seen = new Map<string, { session_id: string; last_message: string; created_at: string }>();
        for (const row of data) {
          if (!seen.has(row.session_id)) {
            seen.set(row.session_id, {
              session_id: row.session_id,
              last_message: row.content.slice(0, 80),
              created_at: row.created_at,
            });
          }
        }
        setSessions(Array.from(seen.values()).slice(0, 20));
      });
  }, [user]);

  const saveMessage = useCallback(async (msg: ChatMessage) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      session_id: sessionId,
      role: msg.role,
      content: msg.content,
      metadata: msg.metadata || {},
    });
  }, [user, sessionId]);

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

  const newSession = useCallback(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  return { sessionId, sessions, saveMessage, loadSession, newSession };
}
