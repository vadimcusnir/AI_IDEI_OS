/**
 * useCommandSession — Session lifecycle, persistence, restore.
 * Extracted from useCommandCenter for SOC.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useChatHistory } from "@/hooks/useChatHistory";
import { executionActions, getExecutionState } from "@/stores/executionStore";
import {
  persistMessages, restoreMessages, clearPersistedMessages,
  persistOutputs, restoreOutputs,
} from "@/services/chatSessionService";
import { clearDraft } from "@/services/chatSessionService";
import { trackSessionAction } from "@/lib/commandCenterTelemetry";

export function useCommandSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    sessionId, sessions,
    saveMessage, loadSession, loadCurrentSession,
    deleteSession, newSession, refreshSessions,
  } = useChatHistory();

  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Load session on mount — restore from DB or sessionStorage
  useEffect(() => {
    if (!user || sessionLoaded) return;
    setSessionLoaded(true);
    loadCurrentSession().then((loaded) => {
      if (loaded.length > 0) {
        executionActions.setMessages(loaded);
      } else {
        const restored = restoreMessages();
        if (restored.length > 0) executionActions.setMessages(restored);
        const restoredOutputs = restoreOutputs();
        if (restoredOutputs.length > 0) executionActions.setOutputs(restoredOutputs);
      }
    });
  }, [user, sessionLoaded, loadCurrentSession]);

  // Persist messages/outputs on change
  const messages = getExecutionState().messages;
  const outputs = getExecutionState().outputs;

  const clearChat = useCallback(() => {
    trackSessionAction("started");
    newSession();
    executionActions.reset();
    executionActions.clearMessages();
    executionActions.setOutputs([]);
    clearDraft();
    clearPersistedMessages();
    navigate("/home", { replace: true });
  }, [newSession, navigate]);

  return {
    sessionId, sessions, sessionLoaded,
    saveMessage, loadSession, deleteSession,
    clearChat, refreshSessions,
  };
}
