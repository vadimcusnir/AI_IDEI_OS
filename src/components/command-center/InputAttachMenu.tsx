/**
 * InputAttachMenu — Input Injection Only.
 * "+" button → strictly input sources: file upload, URL paste, voice.
 * No service shortcuts (those live in ModeChipBar).
 */
import { useState, useRef, useEffect } from "react";
import { Plus, Upload, Globe, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputAttachMenuProps {
  onFileClick: () => void;
  onAction: (action: string) => void;
}

const INPUT_ITEMS = [
  { id: "upload", label: "Upload file", icon: Upload, desc: "Text, audio, video, PDF" },
  { id: "analyze_url", label: "Paste URL", icon: Globe, desc: "YouTube, article, website" },
  { id: "voice_input", label: "Voice input", icon: Mic, desc: "Dictate your command" },
];

export function InputAttachMenu({ onFileClick, onAction }: InputAttachMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-8 w-8 rounded-[10px] flex items-center justify-center transition-all duration-200",
          "text-muted-foreground/50 hover:text-foreground hover:bg-muted",
          open && "bg-muted text-foreground rotate-45"
        )}
        title="Add input"
        aria-label="Add input"
      >
        <Plus className="h-4 w-4 transition-transform duration-200" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full left-0 mb-2 w-[220px] z-50",
              "bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-lg shadow-black/10",
              "overflow-hidden"
            )}
          >
            <div className="py-1">
              {INPUT_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    if (item.id === "upload") onFileClick();
                    else onAction(item.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/60 transition-colors group"
                >
                  <div className="h-7 w-7 rounded-md bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-compact font-medium text-foreground leading-tight">{item.label}</p>
                    <p className="text-micro text-muted-foreground/60 leading-tight">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
