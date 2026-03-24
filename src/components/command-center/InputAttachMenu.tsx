/**
 * InputAttachMenu — Perplexity/ChatGPT style "+" button dropdown.
 * Attach files, deep research, search web, etc.
 */
import { useState, useRef, useEffect } from "react";
import {
  Plus, Paperclip, Globe, Search, Sparkles,
  FileText, Mic, Upload, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputAttachMenuProps {
  onFileClick: () => void;
  onAction: (action: string) => void;
}

const MENU_ITEMS = [
  { id: "upload", label: "Încarcă fișiere", icon: Upload, desc: "Text, audio, video, PDF" },
  { id: "web_search", label: "Căutare pe internet", icon: Globe, desc: "Caută informații live" },
  { id: "deep_research", label: "Cercetare aprofundată", icon: Search, desc: "Analiză multi-sursă" },
  { id: "generate_image", label: "Generează conținut", icon: Sparkles, desc: "Articole, copy, strategii" },
  { id: "analyze_url", label: "Analizează URL", icon: FileText, desc: "YouTube, site, articol" },
  { id: "voice_input", label: "Input vocal", icon: Mic, desc: "Dictează comanda" },
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
          "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200",
          "text-muted-foreground/50 hover:text-foreground hover:bg-muted",
          open && "bg-muted text-foreground rotate-45"
        )}
        title="Atașează sau acțiune"
      >
        <Plus className="h-4.5 w-4.5 transition-transform duration-200" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full left-0 mb-2 w-[260px] z-50",
              "bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-2xl shadow-black/20",
              "overflow-hidden"
            )}
          >
            <div className="py-1.5">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    if (item.id === "upload") onFileClick();
                    else onAction(item.id);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-muted/60 transition-colors group"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground/70">{item.desc}</p>
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
