/**
 * useSlashCommands — Extracted slash command detection and menu logic.
 */
import { useState, useCallback, useMemo } from "react";

export interface SlashCommand {
  command: string;
  label: string;
  description: string;
  category: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { command: "/extract", label: "Extract", description: "Extract neurons from content", category: "extract" },
  { command: "/analyze", label: "Analyze", description: "Deep content analysis", category: "analyze" },
  { command: "/generate", label: "Generate", description: "Generate content from knowledge", category: "generate" },
  { command: "/search", label: "Search", description: "Search your knowledge base", category: "search" },
  { command: "/compare", label: "Compare", description: "Compare documents or ideas", category: "compare" },
  { command: "/profile", label: "Profile", description: "Build intelligence profiles", category: "profile" },
  { command: "/pipeline", label: "Pipeline", description: "Run multi-step workflows", category: "pipeline" },
  { command: "/status", label: "Status", description: "Check account status & balance", category: "status" },
  { command: "/help", label: "Help", description: "Get help with commands", category: "help" },
];

export function useSlashCommands() {
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState("");

  const filteredCommands = useMemo(() => {
    if (!filter) return SLASH_COMMANDS;
    const lower = filter.toLowerCase();
    return SLASH_COMMANDS.filter(
      c => c.command.includes(lower) || c.label.toLowerCase().includes(lower)
    );
  }, [filter]);

  const detectSlash = useCallback((input: string) => {
    if (input.startsWith("/")) {
      setShowMenu(true);
      setFilter(input.slice(1));
    } else {
      setShowMenu(false);
      setFilter("");
    }
  }, []);

  const selectCommand = useCallback((command: string): string => {
    setShowMenu(false);
    setFilter("");
    return command + " ";
  }, []);

  return {
    showMenu,
    setShowMenu,
    filteredCommands,
    detectSlash,
    selectCommand,
    allCommands: SLASH_COMMANDS,
  };
}
