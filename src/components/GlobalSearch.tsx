import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackInternalEvent, AnalyticsEvents } from "@/lib/internalAnalytics";
import { Search, Brain, FileText, Users, X, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "neuron" | "artifact" | "guest";
  path: string;
}

const TYPE_CONFIG = {
  neuron: { icon: Brain, label: "Neuron", color: "text-primary" },
  artifact: { icon: FileText, label: "Artefact", color: "text-accent-foreground" },
  guest: { icon: Users, label: "Guest", color: "text-muted-foreground" },
};

export function GlobalSearch() {
  const { user } = useAuth();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!user || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const pattern = `%${q.trim()}%`;

    const [neuronsRes, artifactsRes, guestsRes] = await Promise.all([
      supabase
        .from("neurons")
        .select("id, number, title, status")
        .eq("author_id", user.id)
        .ilike("title", pattern)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("artifacts")
        .select("id, title, artifact_type, service_key")
        .eq("author_id", user.id)
        .ilike("title", pattern)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("guest_profiles")
        .select("id, full_name, role, slug")
        .eq("author_id", user.id)
        .ilike("full_name", pattern)
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const mapped: SearchResult[] = [
      ...(neuronsRes.data || []).map((n: any) => ({
        id: `n-${n.id}`,
        title: n.title,
        subtitle: `#${n.number} · ${n.status}`,
        type: "neuron" as const,
        path: `/n/${n.number}`,
      })),
      ...(artifactsRes.data || []).map((a: any) => ({
        id: `a-${a.id}`,
        title: a.title,
        subtitle: `${a.artifact_type}${a.service_key ? ` · ${a.service_key}` : ""}`,
        type: "artifact" as const,
        path: `/library/${a.id}`,
      })),
      ...(guestsRes.data || []).map((g: any) => ({
        id: `g-${g.id}`,
        title: g.full_name,
        subtitle: g.role,
        type: "guest" as const,
        path: `/guest/${g.slug}`,
      })),
    ];

    setResults(mapped);
    trackInternalEvent({ event: AnalyticsEvents.SEARCH_PERFORMED, params: { query: q, results_count: mapped.length } });
    setSelectedIndex(0);
    setLoading(false);
  }, [user]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-muted-foreground text-xs"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("search")}...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground/60">
          ⌘K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">{t("search")}</DialogTitle>
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("search_placeholder")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {query && !loading && (
              <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto">
            {query.length >= 2 && results.length === 0 && !loading && (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">{t("no_results_for", { query })}</p>
              </div>
            )}

            {query.length < 2 && (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground/60">{t("search_min_chars")}</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-1">
                {results.map((result, idx) => {
                  const cfg = TYPE_CONFIG[result.type];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        idx === selectedIndex ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-muted")}>
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50 shrink-0">{cfg.label}</span>
                      {idx === selectedIndex && <ArrowRight className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground/50">
            <span>↑↓ {t("navigate")}</span>
            <span>↵ {t("select")}</span>
            <span>esc {t("close")}</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
