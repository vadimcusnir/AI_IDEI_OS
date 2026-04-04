import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import {
  Store, Star, Coins, DollarSign, Search, Tag, ShoppingCart, Crown,
  TrendingUp, Clock, Loader2, CheckCircle2, FileText, BarChart3,
  Sparkles, ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ControlledSection } from "@/components/ControlledSection";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

interface KnowledgeAsset {
  id: string;
  title: string;
  description: string | null;
  asset_type: string;
  price_neurons: number | null;
  price_usd: number | null;
  rating_avg: number | null;
  rating_count: number | null;
  sales_count: number | null;
  tags: string[] | null;
  preview_content: string | null;
  author_id: string;
  created_at: string;
  is_featured?: boolean;
}

type SortOption = "popular" | "newest" | "rating" | "price_low" | "price_high";

export default function Marketplace() {
  const { t } = useTranslation("pages");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);
  const [featured, setFeatured] = useState<KnowledgeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");

  const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: "popular", label: t("marketplace.sort_popular") },
    { value: "newest", label: t("marketplace.sort_newest") },
    { value: "rating", label: t("marketplace.sort_rating") },
    { value: "price_low", label: t("marketplace.sort_price_asc") },
    { value: "price_high", label: t("marketplace.sort_price_desc") },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const featuredQuery: any = supabase
        .from("knowledge_assets")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true);
      const { data: featuredData } = await featuredQuery
        .order("sales_count", { ascending: false })
        .limit(4);
      setFeatured((featuredData as KnowledgeAsset[]) || []);

      let query = supabase
        .from("knowledge_assets")
        .select("*")
        .eq("is_published", true);
      if (selectedType) query = query.eq("asset_type", selectedType);
      switch (sort) {
        case "popular": query = query.order("sales_count", { ascending: false }); break;
        case "newest": query = query.order("created_at", { ascending: false }); break;
        case "rating": query = query.order("rating_avg", { ascending: false }); break;
        case "price_low": query = query.order("price_neurons", { ascending: true }); break;
        case "price_high": query = query.order("price_neurons", { ascending: false }); break;
      }
      const { data } = await query.limit(100);
      setAssets((data as KnowledgeAsset[]) || []);
      setLoading(false);
    };
    load();
  }, [selectedType, sort]);

  const filtered = search.trim()
    ? assets.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (a.tags || []).some(tg => tg.toLowerCase().includes(search.toLowerCase()))
      )
    : assets;

  const PREMIUM_CATEGORIES = [
    { key: "course", label: "Courses", icon: "🎓" },
    { key: "playbook", label: "Playbooks", icon: "📘" },
    { key: "framework", label: "Frameworks", icon: "🧩" },
    { key: "template", label: "Templates", icon: "📄" },
    { key: "intelligence", label: "Intelligence", icon: "🧠" },
    { key: "strategy", label: "Strategy", icon: "🎯" },
  ];

  const types = [...new Set(assets.map(a => a.asset_type))];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Marketplace — AI-IDEI Knowledge Assets"
        description="Browse and purchase knowledge assets, templates, and intelligence packages on the AI-IDEI marketplace."
      />

      {/* ═══ Hero ═══ */}
      <div className="relative border-b border-border overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(var(--gold-oxide)/0.05)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="text-[length:var(--eyebrow-size)] font-semibold uppercase tracking-[var(--tracking-eyebrow)] text-[hsl(var(--gold-oxide))] mb-2">
              Knowledge Exchange
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground mb-2 tracking-tight">
              {t("marketplace.title")}
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed mb-5">
              {t("marketplace.description")}
            </p>

            {/* Quick actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {user && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8"
                    onClick={() => navigate("/marketplace/drafts")}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    My Drafts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8"
                    onClick={() => navigate("/marketplace/earnings")}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Earnings
                  </Button>
                </>
              )}
              {user && (
                <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  <span className="font-mono font-semibold text-foreground">{balance}</span>
                  NEURONS
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ═══ Featured ═══ */}
        {featured.length > 0 && (
          <ControlledSection elementId="marketplace.featured">
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-4 w-4 text-[hsl(var(--gold-oxide))]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  {t("marketplace.featured")}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featured.map((asset, i) => (
                  <FeaturedCard key={asset.id} asset={asset} index={i} />
                ))}
              </div>
            </motion.section>
          </ControlledSection>
        )}

        {/* ═══ Search + Filter Bar ═══ */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm -mx-4 px-4 sm:-mx-6 sm:px-6 py-3 border-b border-border/50">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("marketplace.search_placeholder")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 text-sm h-9"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-36 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type pills */}
          {types.length > 0 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedType(null)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-dense font-medium transition-colors",
                  selectedType === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {types.map(tp => (
                <button
                  key={tp}
                  onClick={() => setSelectedType(tp)}
                  className={cn(
                    "shrink-0 px-3 py-1 rounded-full text-dense font-medium transition-colors whitespace-nowrap",
                    selectedType === tp
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {tp}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Asset Grid ═══ */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState search={search} t={t} />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filtered.map((asset, i) => (
              <AssetCard key={asset.id} asset={asset} currentUserId={user?.id} creditBalance={balance} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ─── Featured Card ─── */
function FeaturedCard({ asset, index }: { asset: KnowledgeAsset; index: number }) {
  const navigate = useNavigate();
  const price = asset.price_neurons || 0;
  const isFree = price === 0 && (!asset.price_usd || Number(asset.price_usd) === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      onClick={() => navigate(`/marketplace/${asset.id}`)}
      className="group relative bg-card border border-[hsl(var(--gold-oxide)/0.2)] rounded-xl overflow-hidden cursor-pointer hover:border-[hsl(var(--gold-oxide)/0.4)] transition-all hover:shadow-md hover:shadow-[hsl(var(--gold-oxide)/0.05)]"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(var(--gold-oxide)/0.5)] to-transparent" />
      <div className="p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown className="h-3 w-3 text-[hsl(var(--gold-oxide))] shrink-0" />
              <Badge variant="outline" className="text-nano px-1.5 py-0">{asset.asset_type}</Badge>
            </div>
            <h3 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors">{asset.title}</h3>
          </div>
          <div className="text-right shrink-0">
            {isFree ? (
              <span className="text-xs font-bold text-emerald-600">FREE</span>
            ) : (
              <span className="flex items-center gap-0.5 text-sm font-bold font-mono text-primary">
                <Coins className="h-3 w-3" />{price}
              </span>
            )}
          </div>
        </div>
        {asset.description && (
          <p className="text-dense text-muted-foreground line-clamp-2">{asset.description}</p>
        )}
        <div className="flex items-center justify-between text-micro text-muted-foreground">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn("h-2.5 w-2.5", s <= (asset.rating_avg || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
            ))}
            <span className="ml-1">{(asset.rating_avg || 0).toFixed(1)}</span>
          </div>
          <span>{asset.sales_count || 0} sales</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Asset Card ─── */
function AssetCard({ asset, currentUserId, creditBalance = 0, index }: {
  asset: KnowledgeAsset;
  currentUserId?: string;
  creditBalance?: number;
  index: number;
}) {
  const navigate = useNavigate();
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const { t } = useTranslation("pages");

  const isOwn = currentUserId === asset.author_id;
  const price = asset.price_neurons || 0;
  const isFree = price === 0 && (!asset.price_usd || Number(asset.price_usd) === 0);
  const canAfford = creditBalance >= price;

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) { toast.error(t("marketplace.sign_in_purchase")); return; }
    if (!isFree && !canAfford) {
      toast.error(t("marketplace.insufficient_credits", { price, balance: creditBalance }));
      return;
    }
    setPurchasing(true);
    try {
      const { data, error } = await supabase.rpc("purchase_marketplace_asset", {
        _buyer_id: currentUserId,
        _asset_id: asset.id,
      });
      if (error) throw new Error(error.message);
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Purchase failed");
      setPurchased(true);
      toast.success(isFree ? t("marketplace.asset_acquired") : t("marketplace.purchased_for", { price: result.price }));
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
      onClick={() => navigate(`/marketplace/${asset.id}`)}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
    >
      {/* Preview snippet */}
      {asset.preview_content && (
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <p className="text-micro text-muted-foreground/70 line-clamp-2 italic">{asset.preview_content}</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Type + Title */}
        <div>
          <Badge variant="outline" className="text-nano px-1.5 py-0 mb-1.5">{asset.asset_type}</Badge>
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{asset.title}</h3>
        </div>

        {asset.description && (
          <p className="text-micro text-muted-foreground line-clamp-2">{asset.description}</p>
        )}

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-nano px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-nano text-muted-foreground/50">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Rating + Sales */}
        <div className="flex items-center gap-2 text-micro text-muted-foreground">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn("h-2.5 w-2.5", s <= (asset.rating_avg || 0) ? "fill-amber-500 text-amber-500" : "text-muted-foreground/20")} />
            ))}
          </div>
          <span>{(asset.rating_avg || 0).toFixed(1)} ({asset.rating_count || 0})</span>
          <span className="ml-auto">{asset.sales_count || 0} sales</span>
        </div>

        {/* Price + Buy */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            {isFree ? (
              <span className="text-xs font-bold text-emerald-600">FREE</span>
            ) : (
              <span className="flex items-center gap-1 text-sm font-bold font-mono text-primary">
                <Coins className="h-3 w-3" />{price}
              </span>
            )}
          </div>
          {!isOwn && (
            purchased ? (
              <span className="flex items-center gap-1 text-micro text-emerald-600 font-medium">
                <CheckCircle2 className="h-3 w-3" /> Owned
              </span>
            ) : (
              <Button
                size="sm"
                className="h-7 text-dense gap-1 px-3"
                onClick={handlePurchase}
                disabled={purchasing || (!isFree && !canAfford)}
              >
                {purchasing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3 w-3" />
                )}
                {isFree ? "Get" : `${price} N`}
              </Button>
            )
          )}
          {isOwn && (
            <span className="text-micro text-muted-foreground/60 font-medium">Your asset</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ search, t }: { search: string; t: any }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Store className="h-7 w-7 text-muted-foreground/30" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {search ? t("marketplace.no_search_match") : "No assets yet"}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        {search ? "Try different keywords" : "Be the first to publish a knowledge asset"}
      </p>
      {!search && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate("/library")}>
          <Sparkles className="h-3.5 w-3.5" />
          Create Asset
        </Button>
      )}
    </motion.div>
  );
}
