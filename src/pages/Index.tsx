import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Loader2, Shield, BookOpen } from "lucide-react";
import logo from "@/assets/logo.gif";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminCheck } from "@/hooks/useAdminCheck";

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
  const navigate = useNavigate();
  const [neurons, setNeurons] = useState<NeuronListItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleCreateNeuron = () => {
    navigate("/n/new");
  };

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
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate("/architecture")}>
            <BookOpen className="h-3.5 w-3.5" />
            Architecture
          </Button>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleCreateNeuron}>
          <Plus className="h-3.5 w-3.5" />
          New Neuron
        </Button>
      </div>

      {/* Neuron list */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-xl font-serif mb-6">Your Neurons</h1>

        {neurons.length === 0 ? (
          <div className="text-center py-16">
            <img src={logo} className="h-10 w-10 opacity-30 mx-auto mb-3" alt="" />
            <p className="text-sm text-muted-foreground mb-4">No neurons yet. Create your first knowledge atom.</p>
            <Button onClick={handleCreateNeuron} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Neuron
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {neurons.map(n => (
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
    </div>
  );
}
