import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Loader2, Shield, BookOpen, Search, X, Copy, GitFork, Link2, Upload, Sparkles, ClipboardList, Coins, BarChart3, Sun, Moon } from "lucide-react";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { TemplatePicker } from "@/components/neuron/TemplatePicker";

interface NeuronListItem {
  id: number;
  number: number;
  title: string;
  status: string;
  updated_at: string;
}

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [neurons, setNeurons] = useState<NeuronListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NeuronListItem[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchNeurons = async () => {
      const { data, error } = await supabase
        .from("neurons")
        .select("id, number, title, status, updated_at")
        .eq("author_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) setNeurons(data);
      if (error) toast.error("Failed to load neurons");
      setLoading(false);
    };

    fetchNeurons();
  }, [user, authLoading, navigate]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    const { data, error } = await supabase
      .from("neurons")
      .select("id, number, title, status, updated_at")
      .textSearch("title", query)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) setSearchResults(data);
    if (error) {
      // Fallback to ilike search
      const { data: fallback } = await supabase
        .from("neurons")
        .select("id, number, title, status, updated_at")
        .ilike("title", `%${query}%`)
        .order("updated_at", { ascending: false })
        .limit(20);
      setSearchResults(fallback || []);
    }
    setSearching(false);
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const displayNeurons = searchResults !== null ? searchResults : neurons;

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ai-idei.com" className="h-6 w-6" />
          <span className="text-base font-serif">ai-idei.com</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/admin")}>
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/extractor")}>
            <Upload className="h-3.5 w-3.5" />
            Extractor
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/services")}>
            <Sparkles className="h-3.5 w-3.5" />
            Services
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/jobs")}>
            <ClipboardList className="h-3.5 w-3.5" />
            Jobs
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/credits")}>
            <Coins className="h-3.5 w-3.5" />
            Credits
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/intelligence")}>
            <BarChart3 className="h-3.5 w-3.5" />
            Intelligence
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/architecture")}>
            <BookOpen className="h-3.5 w-3.5" />
            Docs
          </Button>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/links")}>
            <Link2 className="h-3.5 w-3.5" />
            Links
          </Button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowTemplatePicker(true)}>
          <Plus className="h-3.5 w-3.5" />
          New Neuron
        </Button>
      </div>

      {/* Neuron list */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-serif">Your Neurons</h1>
          <span className="text-xs text-muted-foreground">{neurons.length} total</span>
        </div>

        {/* Search bar */}
        <div className="relative mb-5">
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
            {searching ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <input
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search neurons..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {searchResults !== null && (
            <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
            </p>
          )}
        </div>

        {displayNeurons.length === 0 ? (
          <div className="text-center py-16">
            {searchResults !== null ? (
              <>
                <Search className="h-8 w-8 opacity-20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No neurons match your search.</p>
                <Button variant="outline" onClick={clearSearch} className="gap-1.5 text-xs">
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <img src={logo} className="h-10 w-10 opacity-30 mx-auto mb-3" alt="" />
                <p className="text-sm text-muted-foreground mb-4">No neurons yet. Create your first knowledge atom.</p>
                <Button onClick={() => setShowTemplatePicker(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Create Neuron
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {displayNeurons.map(n => (
              <button
                key={n.id}
                onClick={() => navigate(`/n/${n.number}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-card border border-transparent hover:border-border transition-colors text-left"
              >
                <span className="text-xs font-mono text-primary font-bold">#{n.number}</span>
                <span className="flex-1 text-sm font-medium truncate">{n.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(n.updated_at).toLocaleDateString()}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {n.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Template Picker Modal */}
      <TemplatePicker isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} />
    </div>
  );
}
