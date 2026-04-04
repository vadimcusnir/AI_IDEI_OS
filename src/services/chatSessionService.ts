/**
 * chatSessionService — Handles session persistence beyond sessionStorage.
 * Persists messages and outputs to survive page refresh (A5 fix).
 */
import type { Message, OutputItem } from "@/stores/executionStore";

const MESSAGES_KEY = "ai-idei-chat-messages";
const OUTPUTS_KEY = "ai-idei-chat-outputs";
const DRAFT_KEY = "cc_draft_input";
const MAX_PERSISTED_MESSAGES = 100;

// ═══ Messages ═══

export function persistMessages(messages: Message[]): void {
  try {
    // Keep only the last N messages to avoid quota issues
    const toSave = messages.slice(-MAX_PERSISTED_MESSAGES).map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    }));
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(toSave));
  } catch { /* quota exceeded */ }
}

export function restoreMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Message & { timestamp: string }>;
    return parsed.map(m => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

export function clearPersistedMessages(): void {
  sessionStorage.removeItem(MESSAGES_KEY);
  sessionStorage.removeItem(OUTPUTS_KEY);
}

// ═══ Outputs ═══

export function persistOutputs(outputs: OutputItem[]): void {
  try {
    sessionStorage.setItem(OUTPUTS_KEY, JSON.stringify(outputs));
  } catch { /* quota exceeded */ }
}

export function restoreOutputs(): OutputItem[] {
  try {
    const raw = sessionStorage.getItem(OUTPUTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OutputItem[];
  } catch {
    return [];
  }
}

// ═══ Draft ═══

export function saveDraft(input: string): void {
  if (input.trim()) {
    localStorage.setItem(DRAFT_KEY, input);
  } else {
    localStorage.removeItem(DRAFT_KEY);
  }
}

export function restoreDraft(): string {
  return localStorage.getItem(DRAFT_KEY) || "";
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}
