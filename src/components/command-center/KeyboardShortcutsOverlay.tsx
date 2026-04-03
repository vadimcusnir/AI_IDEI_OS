/**
 * KeyboardShortcutsOverlay — triggered by "?" key or Ctrl+/
 * Shows all available keyboard shortcuts for Command Center.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

const SHORTCUT_GROUPS = [
  {
    label: "Command Center",
    shortcuts: [
      { keys: ["⌘", "K"], desc: "Focus input" },
      { keys: ["Esc"], desc: "Stop / Close panel" },
      { keys: ["Enter"], desc: "Send message" },
      { keys: ["Shift", "Enter"], desc: "New line" },
      { keys: ["/"], desc: "Slash commands" },
    ],
  },
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["Alt", "H"], desc: "Home" },
      { keys: ["Alt", "E"], desc: "Extractor" },
      { keys: ["Alt", "S"], desc: "Services" },
      { keys: ["Alt", "L"], desc: "Library" },
      { keys: ["Alt", "C"], desc: "Credits" },
      { keys: ["Alt", "N"], desc: "Neurons" },
      { keys: ["Alt", "I"], desc: "Intelligence" },
    ],
  },
  {
    label: "Help",
    shortcuts: [
      { keys: ["?"], desc: "Show shortcuts" },
    ],
  },
];

export function KeyboardShortcutsOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-bold">Keyboard Shortcuts</h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-muted transition-colors">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.shortcuts.map((s) => (
                      <div key={s.desc} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{s.desc}</span>
                        <div className="flex items-center gap-1">
                          {s.keys.map((k) => (
                            <kbd
                              key={k}
                              className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[10px] font-mono font-medium rounded border border-border bg-muted/50 text-muted-foreground"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border/30 bg-muted/20">
              <p className="text-[10px] text-center text-muted-foreground/50">
                Press <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 text-[9px] font-mono">?</kbd> or <kbd className="px-1 py-0.5 rounded border border-border bg-muted/50 text-[9px] font-mono">Esc</kbd> to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
