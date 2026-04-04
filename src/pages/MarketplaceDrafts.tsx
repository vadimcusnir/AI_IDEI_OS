/**
 * MarketplaceDrafts — Approval UI for auto-listed marketplace drafts.
 * Users review, edit price, and publish or delete draft assets.
 */
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/motion/PageTransition";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, CheckCircle, Trash2, Package, Coins, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListPageSkeleton } from "@/components/skeletons/ListPageSkeleton";

interface DraftAsset {
  id: string;
  title: string;
  description: string;
  asset_type: string;
  price_neurons: number;
  created_at: string;
  is_published: boolean;
  preview_text: string | null;
}

export default function MarketplaceDrafts() {
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<DraftAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editPrices, setEditPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    fetchDrafts();
  }, [user]);

  const fetchDrafts = async () => {
    const { data } = await (supabase
      .from("knowledge_assets")
      .select("id, title, description, asset_type, price_neurons, created_at, is_published") as any)
      .eq("creator_id", user!.id)
      .eq("is_published", false)
      .order("created_at", { ascending: false });

    if (data) {
      setDrafts((data as any[]).map(d => ({ ...d, preview_text: null })));
      const prices: Record<string, number> = {};
      (data as any[]).forEach((d: any) => { prices[d.id] = d.price_neurons; });
      setEditPrices(prices);
    }
    setLoading(false);
  };

  const publishDraft = async (id: string) => {
    setActionId(id);
    const price = editPrices[id] || drafts.find(d => d.id === id)?.price_neurons || 0;

    const { error } = await supabase
      .from("knowledge_assets")
      .update({ is_published: true, price_neurons: price })
      .eq("id", id);

    if (error) {
      toast.error("Eroare la publicare");
    } else {
      toast.success("Asset publicat în Marketplace!");
      setDrafts(prev => prev.filter(d => d.id !== id));
    }
    setActionId(null);
  };

  const deleteDraft = async (id: string) => {
    setActionId(id);
    const { error } = await supabase
      .from("knowledge_assets")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Eroare la ștergere");
    } else {
      toast.success("Draft șters");
      setDrafts(prev => prev.filter(d => d.id !== id));
    }
    setActionId(null);
  };

  if (loading) return <ListPageSkeleton columns={1} />;

  return (
    <PageTransition>
      <SEOHead title="Marketplace Drafts — AI-IDEI" description="Review and publish your generated marketplace assets" />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Marketplace Drafts</h1>
            <p className="text-micro text-muted-foreground">
              Aprobă sau editează asset-urile generate automat din execuții
            </p>
          </div>
          <Badge variant="outline" className="ml-auto text-micro">
            {drafts.length} drafturi
          </Badge>
        </div>

        {/* Empty state */}
        {drafts.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-8 w-8 opacity-20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nu ai drafturi de aprobat</p>
            <p className="text-micro text-muted-foreground/60 mt-1">
              Execută un serviciu pentru a genera automat asset-uri marketplace
            </p>
          </div>
        )}

        {/* Draft cards */}
        <div className="space-y-3">
          {drafts.map(draft => (
            <div
              key={draft.id}
              className="bg-card border border-border rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-nano">{draft.asset_type}</Badge>
                    <span className="text-sm font-medium truncate">{draft.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{draft.description}</p>
                  <p className="text-nano text-muted-foreground/50 mt-1">
                    {new Date(draft.created_at).toLocaleString("ro-RO")}
                  </p>
                </div>
              </div>

              {/* Preview */}
              {draft.preview_text && (
                <div className="bg-muted/30 rounded-lg p-3 max-h-[120px] overflow-y-auto">
                  <p className="text-micro font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Preview
                  </p>
                  <p className="text-xs whitespace-pre-wrap">{draft.preview_text.slice(0, 300)}...</p>
                </div>
              )}

              {/* Price editor + Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={editPrices[draft.id] || 0}
                    onChange={e => setEditPrices(p => ({ ...p, [draft.id]: Number(e.target.value) }))}
                    className="h-7 w-24 text-xs"
                    min={1}
                  />
                  <span className="text-nano text-muted-foreground">NEURONS</span>
                </div>

                <div className="flex-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => deleteDraft(draft.id)}
                  disabled={actionId === draft.id}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Șterge
                </Button>

                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => publishDraft(draft.id)}
                  disabled={actionId === draft.id}
                >
                  {actionId === draft.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  Publică
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
