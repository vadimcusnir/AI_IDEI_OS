/**
 * GlobalDropZone — Page-wide drop overlay for /home.
 * Detects dragenter on the document, shows a centered overlay,
 * and forwards files to a single handler. Auto-pre-fills "extract" intent.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { Upload, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GlobalDropZoneProps {
  onDrop: (files: File[]) => void;
  /** Disable when a modal/gate is active to avoid hijacking */
  disabled?: boolean;
}

export function GlobalDropZone({ onDrop, disabled = false }: GlobalDropZoneProps) {
  const [active, setActive] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (disabled) return;
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setActive(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setActive(false);
    }
  }, [disabled]);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (disabled) return;
    if (!e.dataTransfer?.types.includes("Files")) return;
    e.preventDefault();
  }, [disabled]);

  const handleDrop = useCallback((e: DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setActive(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length > 0) onDrop(files);
  }, [disabled, onDrop]);

  useEffect(() => {
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-background/85 backdrop-blur-md"
          aria-hidden="true"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col items-center gap-4 px-10 py-12 rounded-3xl border-2 border-dashed border-gold/40 bg-card/60 max-w-md mx-4"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gold/15 flex items-center justify-center">
                <Upload className="h-7 w-7 text-gold" />
              </div>
              <Sparkles className="h-4 w-4 text-gold absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground mb-1">Eliberează pentru a extrage</p>
              <p className="text-sm text-muted-foreground">
                Fișierele vor fi atașate automat la chat
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
