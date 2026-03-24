/**
 * InputAttachMenu — Execution Launcher.
 * "+" button → service categories, sources, insights.
 * NOT just file attach. This is the SERVICE ENGINE.
 */
import { useState, useRef, useEffect } from "react";
import {
  Plus, Upload, Globe, Search, Sparkles, FileText, Mic,
  Brain, BarChart3, Layers, Target, PenTool, Lightbulb,
  TrendingUp, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface InputAttachMenuProps {
  onFileClick: () => void;
  onAction: (action: string) => void;
}

interface MenuSection {
  id: string;
  label: string;
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    desc: string;
  }>;
}

const MENU_SECTIONS: MenuSection[] = [
  {
    id: "services",
    label: "Execută",
    items: [
      { id: "extract_neurons", label: "Extrage neuroni", icon: Brain, desc: "Din conținut sau transcriere" },
      { id: "generate_content", label: "Generează conținut", icon: PenTool, desc: "Articole, copy, strategii" },
      { id: "analyze_data", label: "Analizează", icon: BarChart3, desc: "Competitori, piață, performanță" },
      { id: "build_funnel", label: "Construiește", icon: Layers, desc: "Funnel, strategie, sistem" },
    ],
  },
  {
    id: "sources",
    label: "Surse",
    items: [
      { id: "upload", label: "Încarcă fișiere", icon: Upload, desc: "Text, audio, video, PDF" },
      { id: "analyze_url", label: "Analizează URL", icon: Globe, desc: "YouTube, site, articol" },
      { id: "deep_research", label: "Cercetare aprofundată", icon: Search, desc: "Analiză multi-sursă" },
      { id: "voice_input", label: "Input vocal", icon: Mic, desc: "Dictează comanda" },
    ],
  },
  {
    id: "insights",
    label: "Acțiuni rapide",
    items: [
      { id: "trending", label: "Pattern-uri trending", icon: TrendingUp, desc: "Cele mai frecvente tipare" },
      { id: "recommended", label: "Acțiuni recomandate", icon: Lightbulb, desc: "Bazat pe datele tale" },
    ],
  },
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
        title="Servicii și surse"
        aria-label="Servicii și surse"
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
              "absolute bottom-full left-0 mb-2 w-[260px] z-50",
              "bg-card/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-lg shadow-black/10",
              "overflow-hidden max-h-[380px] overflow-y-auto"
            )}
          >
            {MENU_SECTIONS.map((section, sIdx) => (
              <div key={section.id}>
                {sIdx > 0 && <div className="border-t border-border/30" />}
                <div className="px-3.5 pt-2.5 pb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
                    {section.label}
                  </span>
                </div>
                <div className="pb-1">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setOpen(false);
                        if (item.id === "upload") onFileClick();
                        else onAction(item.id);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2 text-left hover:bg-muted/60 transition-colors group"
                    >
                      <div className="h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground/60 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}