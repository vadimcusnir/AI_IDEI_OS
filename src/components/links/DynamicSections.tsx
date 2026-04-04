import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp, FileText, Clock, Brain, Star, ArrowRight,
  Loader2, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NeuronPreview {
  id: number;
  number: number;
  title: string;
  score: number;
  status: string;
  updated_at: string;
}

interface TemplatePreview {
  id: string;
  name: string;
  category: string;
  usage_count: number;
}

export function PopularNeuronsBlock() {
  const navigate = useNavigate();
  const [neurons, setNeurons] = useState<NeuronPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("neurons")
        .select("id, number, title, score, status, updated_at")
        .eq("visibility", "public")
        .eq("status", "published")
        .order("score", { ascending: false })
        .limit(5);
      if (data) setNeurons(data as NeuronPreview[]);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Neuroni populari
        </h2>
        <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : neurons.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-4">
          Nu există neuroni publici încă.
        </p>
      ) : (
        <div className="space-y-2">
          {neurons.map(n => (
            <button
              key={n.id}
              onClick={() => navigate(`/n/${n.number}`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all group text-left"
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium group-hover:text-primary transition-colors truncate block">
                  #{n.number} — {n.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-nano text-muted-foreground flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 text-primary/60" />
                    {n.score.toFixed(1)}
                  </span>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecommendedTemplatesBlock() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TemplatePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("neuron_templates")
        .select("id, name, category, usage_count")
        .eq("is_public", true)
        .order("usage_count", { ascending: false })
        .limit(4);
      if (data) setTemplates(data as TemplatePreview[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!user) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Șabloane recomandate
        </h2>
        <Layers className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-4">
          Niciun șablon disponibil momentan.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => navigate("/n/new")}
              className="px-3 py-3 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-md hover:shadow-primary/5 transition-all group text-left"
            >
              <FileText className="h-4 w-4 text-primary mb-1.5" />
              <span className="text-xs font-medium group-hover:text-primary transition-colors line-clamp-1 block">
                {t.name}
              </span>
              <span className="text-nano text-muted-foreground mt-0.5 block">
                {t.category} · {t.usage_count} utilizări
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LatestVersionsBlock() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [versions, setVersions] = useState<{ neuron_id: number; title: string; version: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("neuron_versions")
        .select("neuron_id, title, version, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setVersions(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (!user || (!loading && versions.length === 0)) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
          Ultimele versiuni
        </h2>
        <Clock className="h-3 w-3 text-muted-foreground/40" />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v, i) => (
            <button
              key={`${v.neuron_id}-${v.version}-${i}`}
              onClick={() => navigate(`/n/${v.neuron_id}`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/25 transition-all group text-left"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium group-hover:text-primary transition-colors truncate block">
                  {v.title}
                </span>
                <span className="text-nano text-muted-foreground">
                  v{v.version} · {new Date(v.created_at).toLocaleDateString("ro-RO")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
