import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Store, Search, Star, ShoppingCart, Plus, Loader2, Tag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GoalSelector, GOALS } from "./GoalSelector";

interface MarketplaceTemplate {
  id: string;
  title: string;
  description: string;
  goal: string;
  context_template: string;
  details_template: string;
  category: string;
  price_neurons: number;
  sales_count: number;
  avg_rating: number | null;
  author_id: string | null;
  use_count: number;
}

interface TemplateMarketplaceProps {
  onSelect: (template: MarketplaceTemplate) => void;
}

export function TemplateMarketplace({ onSelect }: TemplateMarketplaceProps) {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());

  // Publish dialog
  const [publishOpen, setPublishOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newContext, setNewContext] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newPrice, setNewPrice] = useState(20);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadTemplates();
    if (user) loadPurchases();
  }, [user]);

  const loadTemplates = async () => {
    const { data } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("is_marketplace", true)
      .eq("is_public", true)
      .order("sales_count", { ascending: false })
      .limit(50);
    setTemplates((data as unknown as MarketplaceTemplate[]) || []);
    setLoading(false);
  };

  const loadPurchases = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prompt_template_purchases")
      .select("template_id")
      .eq("buyer_id", user.id);
    setOwnedIds(new Set((data || []).map(d => d.template_id)));
  };

  const handlePurchase = useCallback(async (template: MarketplaceTemplate) => {
    if (!user) return;
    if (template.author_id === user.id) {
      onSelect(template);
      return;
    }
    if (ownedIds.has(template.id)) {
      onSelect(template);
      return;
    }
    if (template.price_neurons > 0 && balance < template.price_neurons) {
      toast.error(`Credite insuficiente. Necesar: ${template.price_neurons} N`);
      return;
    }

    setPurchasing(template.id);

    if (template.price_neurons > 0) {
      const { data: reserved, error: reserveErr } = await supabase.rpc("reserve_neurons", {
        _user_id: user.id,
        _amount: template.price_neurons,
        _description: `RESERVE: Template: ${template.title}`,
      });
      if (reserveErr || !reserved) {
        toast.error("Achiziție eșuată");
        setPurchasing(null);
        return;
      }
    }

    await supabase.from("prompt_template_purchases").insert({
      template_id: template.id,
      buyer_id: user.id,
      price_neurons: template.price_neurons,
    });

    // SETTLE neurons after successful purchase
    if (template.price_neurons > 0) {
      await supabase.rpc("settle_neurons", {
        _user_id: user.id,
        _amount: template.price_neurons,
        _description: `SETTLE: Template: ${template.title}`,
      });
    }

    await supabase
      .from("prompt_templates")
      .update({ sales_count: (template.sales_count || 0) + 1 })
      .eq("id", template.id);

    setOwnedIds(prev => new Set([...prev, template.id]));
    setPurchasing(null);
    toast.success("Template achiziționat!");
    onSelect(template);
  }, [user, balance, ownedIds, onSelect]);

  const handlePublish = useCallback(async () => {
    if (!user || !newTitle.trim() || !newGoal) return;
    setPublishing(true);

    const { error } = await supabase.from("prompt_templates").insert({
      title: newTitle.trim(),
      description: newDesc.trim(),
      goal: newGoal,
      context_template: newContext.trim(),
      details_template: newDetails.trim(),
      author_id: user.id,
      is_public: true,
      is_marketplace: true,
      price_neurons: newPrice,
      category: "user",
    });

    if (error) {
      toast.error("Publicare eșuată");
    } else {
      toast.success("Template publicat pe marketplace!");
      setPublishOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewGoal("");
      setNewContext("");
      setNewDetails("");
      loadTemplates();
    }
    setPublishing(false);
  }, [user, newTitle, newDesc, newGoal, newContext, newDetails, newPrice]);

  const filtered = templates.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          {t("prompt_forge.marketplace_title", { defaultValue: "Template Marketplace" })}
        </h3>
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Plus className="h-3 w-3" />
              {t("prompt_forge.publish_template", { defaultValue: "Publică template" })}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Publică un Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Titlu template"
                className="text-sm"
              />
              <Textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Descriere scurtă"
                rows={2}
                className="text-sm"
              />
              <GoalSelector goal={newGoal} onSelect={setNewGoal} />
              <Textarea
                value={newContext}
                onChange={e => setNewContext(e.target.value)}
                placeholder="Context template (exemplu)"
                rows={2}
                className="text-sm"
              />
              <Textarea
                value={newDetails}
                onChange={e => setNewDetails(e.target.value)}
                placeholder="Detalii template"
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  max={500}
                  value={newPrice}
                  onChange={e => setNewPrice(Number(e.target.value))}
                  className="w-24 text-sm"
                />
                <span className="text-xs text-muted-foreground">NEURONS</span>
              </div>
              <Button
                onClick={handlePublish}
                disabled={publishing || !newTitle.trim() || !newGoal}
                className="w-full gap-2 text-sm"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                Publică ({newPrice} N)
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("prompt_forge.search_templates", { defaultValue: "Caută template-uri..." })}
          className="pl-9 h-8 text-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          Niciun template disponibil încă. Fii primul care publică!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
          {filtered.map(t => {
            const owned = ownedIds.has(t.id) || t.author_id === user?.id;
            const isFree = !t.price_neurons || t.price_neurons === 0;
            return (
              <div
                key={t.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  owned
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card hover:border-primary/20"
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-xs font-medium text-foreground truncate flex-1">{t.title}</p>
                  {t.avg_rating ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-primary">
                      <Star className="h-2.5 w-2.5 fill-primary" />
                      {t.avg_rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">
                    {t.sales_count || 0} vândute
                  </span>
                  <Button
                    size="sm"
                    variant={owned ? "ghost" : "default"}
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handlePurchase(t)}
                    disabled={purchasing === t.id}
                  >
                    {purchasing === t.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : owned ? (
                      "Folosește"
                    ) : (
                      <>
                        <ShoppingCart className="h-3 w-3" />
                        {isFree ? "Gratis" : `${t.price_neurons} N`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
