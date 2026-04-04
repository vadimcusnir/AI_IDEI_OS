import { useTranslation } from "react-i18next";
import { useState, useRef, useCallback } from "react";
import { Plus, FileText, Globe, Search, Trash2, Check, X, Upload, Brain, Loader2, Link, Eye, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotebookSource } from "@/hooks/useNotebook";
import type { UseMutationResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  sources: NotebookSource[];
  addSource: UseMutationResult<void, Error, { title: string; content: string; source_type: string; file_url?: string }>;
  toggleSource: UseMutationResult<void, Error, { id: string; selected: boolean }>;
  deleteSource: UseMutationResult<void, Error, string>;
  notebook?: { id: string } | undefined;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  url: Globe,
  pdf: FileText,
  neuron: Brain,
};

type AddMode = "text" | "file" | "neuron" | "url" | null;

interface NeuronResult {
  id: number;
  title: string;
  number: number;
}

export function NotebookSourcesPanel({ sources, addSource, toggleSource, deleteSource, notebook }: Props) {
  const { t } = useTranslation();
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [filter, setFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [neuronSearch, setNeuronSearch] = useState("");
  const [neuronResults, setNeuronResults] = useState<NeuronResult[]>([]);
  const [searchingNeurons, setSearchingNeurons] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredSources = sources.filter((s) =>
    s.title.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addSource.mutate(
      { title: newTitle.trim(), content: newContent, source_type: "text" },
      { onSuccess: () => { setAddMode(null); setNewTitle(""); setNewContent(""); } }
    );
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !notebook) return;
    setUploading(true);
    try {
      // Read text content for text-based files
      let content = "";
      const textTypes = ["text/plain", "text/markdown", "text/csv", "application/json", ""];
      const isTextFile = textTypes.includes(file.type) || /\.(txt|md|csv|json)$/i.test(file.name);
      
      if (isTextFile) {
        content = await file.text();
      }

      // Upload file to storage
      const filePath = `${notebook.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("notebook-files")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Get the public/signed URL
      const { data: urlData } = supabase.storage
        .from("notebook-files")
        .getPublicUrl(filePath);

      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

      addSource.mutate(
        {
          title: file.name,
          content: content || (isPdf ? `[PDF file: ${file.name}]` : `[File: ${file.name}]`),
          source_type: isPdf ? "pdf" : "text",
          file_url: urlData?.publicUrl || filePath,
        },
        {
          onSuccess: () => {
            toast.success(`${file.name} added`);
            setAddMode(null);
          },
        }
      );
    } catch (err: any) {
      console.error("File upload error:", err);
      toast.error(t("common:upload_failed", "Upload failed") + ": " + (err.message || err.statusCode || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setAddMode("file");
      handleFileUpload(file);
    }
  }, [notebook]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) return;
    setScraping(true);
    try {
      const SCRAPE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-url`;
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { toast.error(t("toast_not_authenticated")); setScraping(false); return; }

      const resp = await fetch(SCRAPE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Scrape failed");

      addSource.mutate(
        {
          title: data.title || urlInput.trim(),
          content: data.content,
          source_type: "url",
        },
        {
          onSuccess: () => {
            toast.success(t("toast_url_imported"));
            setUrlInput("");
            setAddMode(null);
          },
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to import URL");
    } finally {
      setScraping(false);
    }
  };

  const searchNeurons = async (query: string) => {
    setNeuronSearch(query);
    if (query.trim().length < 2) {
      setNeuronResults([]);
      return;
    }
    setSearchingNeurons(true);
    try {
      const { data, error } = await supabase
        .from("neurons")
        .select("id, title, number")
        .ilike("title", `%${query.trim()}%`)
        .limit(10);
      if (error) throw error;
      setNeuronResults((data as NeuronResult[]) || []);
    } catch {
      setNeuronResults([]);
    } finally {
      setSearchingNeurons(false);
    }
  };

  const importNeuron = async (neuron: NeuronResult) => {
    try {
      const { data: blocks, error } = await supabase
        .from("neuron_blocks")
        .select("content, type")
        .eq("neuron_id", neuron.id)
        .order("position", { ascending: true });
      if (error) throw error;
      const content = (blocks || []).map((b) => b.content).join("\n\n");
      addSource.mutate(
        {
          title: `Neuron #${neuron.number}: ${neuron.title}`,
          content: content || neuron.title,
          source_type: "neuron",
        },
        {
          onSuccess: () => {
            toast.success(`Neuron #${neuron.number} imported`);
            setNeuronSearch("");
            setNeuronResults([]);
            setAddMode(null);
          },
        }
      );
    } catch {
      toast.error("Import failed");
    }
  };

  const selectAll = () => {
    sources.forEach((s) => {
      if (!s.is_selected) toggleSource.mutate({ id: s.id, selected: true });
    });
  };

  const deselectAll = () => {
    sources.forEach((s) => {
      if (s.is_selected) toggleSource.mutate({ id: s.id, selected: false });
    });
  };

  const selectedCount = sources.filter((s) => s.is_selected).length;

  return (
    <div
      className="flex flex-col h-full bg-card"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg backdrop-blur-sm"
          >
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">Drop file here</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Sources
            {sources.length > 0 && (
              <span className="text-micro font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {selectedCount}/{sources.length}
              </span>
            )}
          </h3>
          {sources.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-micro px-2"
              onClick={selectedCount === sources.length ? deselectAll : selectAll}
            >
              {selectedCount === sources.length ? "Deselect" : "Select all"}
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search sources..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Add buttons */}
      <div className="px-3 py-2 border-b border-border shrink-0">
        <div className="flex gap-1">
          {([
            { mode: "text" as AddMode, icon: Plus, label: "Text" },
            { mode: "url" as AddMode, icon: Link, label: "URL" },
            { mode: "file" as AddMode, icon: Upload, label: "File" },
            { mode: "neuron" as AddMode, icon: Brain, label: "Neuron" },
          ]).map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              variant={addMode === mode ? "default" : "outline"}
              size="sm"
              className="h-7 text-micro flex-1 gap-1 px-1.5"
              onClick={() => setAddMode(addMode === mode ? null : mode)}
            >
              <Icon className="h-3 w-3" /> {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Add forms */}
      <AnimatePresence>
        {addMode === "text" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-4 py-3 space-y-2">
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Source title" className="h-8 text-xs" />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste content here..."
                className="w-full h-20 text-xs bg-background border border-border rounded-md px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex gap-1.5">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={handleAdd} disabled={addSource.isPending}>
                  <Check className="h-3 w-3 mr-1" /> Add
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddMode(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {addMode === "url" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="h-8 pl-8 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleScrapeUrl()}
                />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="h-7 text-xs flex-1" onClick={handleScrapeUrl} disabled={scraping || !urlInput.trim()}>
                  {scraping ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                  {scraping ? "Importing..." : "Import"}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setAddMode(null); setUrlInput(""); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {addMode === "file" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-4 py-3">
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md,.csv,.json" onChange={handleFileInputChange} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center gap-2 py-6 rounded-lg border-2 border-dashed border-border hover:border-primary/30 transition-colors text-muted-foreground hover:text-foreground"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6" />}
                <span className="text-xs">{uploading ? "Uploading..." : "Click or drag & drop"}</span>
                <span className="text-micro text-muted-foreground">PDF, TXT, MD, CSV, JSON • Max 20MB</span>
              </button>
            </div>
          </motion.div>
        )}

        {addMode === "neuron" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-4 py-3 space-y-2">
              <div className="relative">
                <Brain className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={neuronSearch}
                  onChange={(e) => searchNeurons(e.target.value)}
                  placeholder="Search neurons by title..."
                  className="h-8 pl-8 text-xs"
                />
              </div>
              {searchingNeurons && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                </div>
              )}
              {neuronResults.length > 0 && (
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  {neuronResults.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => importNeuron(n)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/10 text-left transition-colors"
                    >
                      <Brain className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs text-foreground truncate flex-1">{n.title}</span>
                      <span className="text-nano text-muted-foreground font-mono">#{n.number}</span>
                    </button>
                  ))}
                </div>
              )}
              {neuronSearch.trim().length >= 2 && !searchingNeurons && neuronResults.length === 0 && (
                <p className="text-micro text-muted-foreground text-center py-2">No neurons found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Source list */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-0.5">
          {filteredSources.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 px-6">
              <div className="h-12 w-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs font-medium text-muted-foreground mb-1">No sources yet</p>
              <p className="text-micro text-muted-foreground/60 leading-relaxed">Add text, URLs, files, or<br />import neurons to get started</p>
            </motion.div>
          ) : (
            filteredSources.map((src, idx) => {
              const Icon = SOURCE_ICONS[src.source_type] || FileText;
              const isPreview = previewId === src.id;
              return (
                <motion.div
                  key={src.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <div className="group flex items-start gap-2 px-2 py-2 rounded-md hover:bg-accent/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={src.is_selected}
                      onChange={() => toggleSource.mutate({ id: src.id, selected: !src.is_selected })}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
                    />
                    <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <button
                      onClick={() => setPreviewId(isPreview ? null : src.id)}
                      className={cn(
                        "flex-1 text-xs truncate text-left",
                        src.is_selected ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {src.title}
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPreviewId(isPreview ? null : src.id)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSource.mutate(src.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {/* Content preview */}
                  <AnimatePresence>
                    {isPreview && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-2 mb-1 p-2 rounded bg-muted/30 text-micro text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {src.content?.slice(0, 1000) || "No content"}
                          {(src.content?.length || 0) > 1000 && "..."}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
