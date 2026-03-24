import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskTree } from "./TaskTree";
import { MemoryPanel } from "./MemoryPanel";
import type { ExecutionState } from "@/stores/executionStore";

interface SidePanelsProps {
  showTaskTree: boolean;
  showMemory: boolean;
  execution: ExecutionState;
  onCloseTaskTree: () => void;
  onCloseMemory: () => void;
  onSaveTemplate: () => void;
  onReplay: (intent: string) => void;
  onExecuteTemplate: (template: any) => void;
  sessions: any[];
  onLoadSession: (sid: string) => void;
  onDeleteSession: (sid: string) => void;
  currentSessionId: string;
}

export function SidePanels({
  showTaskTree, showMemory, execution,
  onCloseTaskTree, onCloseMemory, onSaveTemplate,
  onReplay, onExecuteTemplate,
  sessions, onLoadSession, onDeleteSession, currentSessionId,
}: SidePanelsProps) {
  const showRightPanel = showTaskTree && execution.phase !== "idle";

  return (
    <>
      {/* Desktop Task Tree */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden md:block border-l border-border bg-card overflow-hidden shrink-0"
          >
            <TaskTree execution={execution} onSaveTemplate={onSaveTemplate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Task Tree */}
      <AnimatePresence>
        {showRightPanel && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="md:hidden fixed inset-y-0 right-0 w-[280px] z-50 border-l border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border">
              <span className="text-xs font-bold">Task Tree</span>
              <button onClick={onCloseTaskTree} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <TaskTree execution={execution} onSaveTemplate={onSaveTemplate} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Panel */}
      <AnimatePresence>
        {showMemory && (
          <>
            <div className="hidden md:block">
              <MemoryPanel
                visible={showMemory}
                onClose={onCloseMemory}
                onReplay={onReplay}
                onExecuteTemplate={onExecuteTemplate}
                sessions={sessions}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
                currentSessionId={currentSessionId}
              />
            </div>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="md:hidden fixed inset-y-0 right-0 w-[300px] z-50 shadow-xl"
            >
              <MemoryPanel
                visible={showMemory}
                onClose={onCloseMemory}
                onReplay={onReplay}
                onExecuteTemplate={onExecuteTemplate}
                sessions={sessions}
                onLoadSession={onLoadSession}
                onDeleteSession={onDeleteSession}
                currentSessionId={currentSessionId}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {(showRightPanel || showMemory) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={() => { onCloseTaskTree(); onCloseMemory(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
