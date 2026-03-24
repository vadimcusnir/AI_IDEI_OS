import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Store, Star, Coins, DollarSign, Search, Tag, ShoppingCart, Crown, TrendingUp, Clock, MessageSquare, Loader2, CheckCircle2, FileText, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ControlledSection } from "@/components/ControlledSection";
import { useTranslation } from "react-i18next";

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

interface AssetReview {
  id: string;
  asset_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
}

type SortOption = "popular" | "newest" | "rating" | "price_low" | "price_high";

export default function Marketplace() {
  const { t } = useTranslation("pages");
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);
  const [featured, setFeatured] = useState<KnowledgeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");

  const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
    { value: "popular", label: t("marketplace.sort_popular"), icon: TrendingUp },
    { value: "newest", label: t("marketplace.sort_newest"), icon: Clock },
    { value: "rating", label: t("marketplace.sort_rating"), icon: Star },
    { value: "price_low", label: t("marketplace.sort_price_asc"), icon: Coins },
    { value: "price_high", label: t("marketplace.sort_price_desc"), icon: Coins },
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
        .limit(6);
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

  const types = [...new Set(assets.map(a => a.asset_type))];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Marketplace — AI-IDEI Knowledge Assets"
        description="Browse and purchase knowledge assets, templates, and intelligence packages on the AI-IDEI marketplace."
      />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Store className="h-3.5 w-3.5" />
            <span>{t("marketplace.breadcrumb")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("marketplace.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed mb-4">
            {t("marketplace.description")}
          </p>
          {user && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/marketplace/drafts")}>
                <FileText className="h-3.5 w-3.5" />
                Drafturi
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/marketplace/earnings")}>
                <BarChart3 className="h-3.5 w-3.5" />
                Câștiguri
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Featured Section */}
        {featured.length > 0 && (
          <ControlledSection elementId="marketplace.featured">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">{t("marketplace.featured")}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map(asset => (
                <AssetCard key={asset.id} asset={asset} currentUserId={user?.id} creditBalance={balance} isFeatured />
              ))}
            </div>
            <Separator className="mt-8" />
          </section>
          </ControlledSection>
        )}

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("marketplace.search_placeholder")}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-40 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type filters */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedType === null ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setSelectedType(null)}
          >
            {t("marketplace.all")}
          </Button>
          {types.map(tp => (
            <Button
              key={tp}
              variant={selectedType === tp ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSelectedType(tp)}
            >
              {tp}
            </Button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? t("marketplace.no_search_match") : t("marketplace.no_assets")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(asset => (
              <AssetCard key={asset.id} asset={asset} currentUserId={user?.id} creditBalance={balance} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset, currentUserId, creditBalance = 0, isFeatured }: { asset: KnowledgeAsset; currentUserId?: string; creditBalance?: number; isFeatured?: boolean }) {
  const { t } = useTranslation("pages");
  const cardNavigate = useNavigate();
  const [showReview, setShowReview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<AssetReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const isOwn = currentUserId === asset.author_id;
  const price = asset.price_neurons || 0;
  const isFree = price === 0 && (!asset.price_usd || Number(asset.price_usd) === 0);
  const canAfford = creditBalance >= price;

  const handlePurchase = async () => {
    if (!currentUserId) {
      toast.error(t("marketplace.sign_in_purchase"));
      return;
    }
    if (!isFree && !canAfford) {
      toast.error(t("marketplace.insufficient_credits", { price, balance: creditBalance }), {
        action: {
          label: "Top-up",
          onClick: () => cardNavigate("/credits"),
        },
      });
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
      if (!result?.success) throw new Error(result?.error || t("marketplace.purchase_failed"));

      setPurchased(true);
      toast.success(isFree ? t("marketplace.asset_acquired") : t("marketplace.purchased_for", { price: result.price }));
    } catch (err: any) {
      toast.error(t("marketplace.purchase_failed") + ": " + (err.message || "Try again"));
    } finally {
      setPurchasing(false);
    }
  };

  const loadReviews = useCallback(async () => {
    setLoadingReviews(true);
    const { data } = await supabase
      .from("asset_reviews")
      .select("*")
      .eq("asset_id", asset.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setReviews((data as AssetReview[]) || []);
    setLoadingReviews(false);
  }, [asset.id]);

  const handleSubmitReview = async () => {
    if (!currentUserId) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("asset_reviews")
      .upsert({
        asset_id: asset.id,
        user_id: currentUserId,
        rating,
        review_text: reviewText,
      } as any, { onConflict: "asset_id,user_id" });

    setSubmitting(false);
    if (error) {
      toast.error(t("marketplace.review_failed"));
    } else {
      toast.success(t("marketplace.review_submitted"));
      setShowReview(false);
      setReviewText("");
    }
  };

  const nav = useNavigate();

  return (
    <div
      onClick={() => nav(`/marketplace/${asset.id}`)}
      className={cn(
        "bg-card border rounded-xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer",
        isFeatured ? "border-amber-500/30 ring-1 ring-amber-500/10" : "border-border"
      )}
    >
      {isFeatured && (
        <div className="px-3 py-1 bg-amber-500/10 flex items-center gap-1.5">
          <Crown className="h-3 w-3 text-amber-500" />
          <span className="text-[9px] font-semibold text-amber-600">FEATURED</span>
        </div>
      )}

      {asset.preview_content && (
        <div className="p-4 bg-muted/30 border-b border-border">
          <p className="text-[10px] text-muted-foreground line-clamp-3">{asset.preview_content}</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <Badge variant="outline" className="text-[9px] mb-1.5">{asset.asset_type}</Badge>
          <h3 className="text-sm font-semibold line-clamp-2">{asset.title}</h3>
        </div>

        {asset.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">{asset.description}</p>
        )}

        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 4).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                <Tag className="h-2 w-2" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating + Reviews link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star
                key={s}
                className={cn(
                  "h-3 w-3",
                  s <= (asset.rating_avg || 0) ? "fill-primary text-primary" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <button
            onClick={() => { setShowReviews(true); loadReviews(); }}
            className="text-[9px] text-muted-foreground hover:text-primary transition-colors"
          >
            {(asset.rating_avg || 0).toFixed(1)} ({asset.rating_count || 0} {t("marketplace.reviews")})
          </button>
          <span className="text-[9px] text-muted-foreground ml-auto">
            {asset.sales_count || 0} {t("marketplace.sales")}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            {asset.price_neurons && asset.price_neurons > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-primary">
                <Coins className="h-3 w-3" /> {asset.price_neurons}
              </span>
            )}
            {asset.price_usd && Number(asset.price_usd) > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <DollarSign className="h-3 w-3" /> ${Number(asset.price_usd).toFixed(0)}
              </span>
            )}
            {(!asset.price_neurons || asset.price_neurons === 0) && (!asset.price_usd || Number(asset.price_usd) === 0) && (
              <span className="text-xs font-semibold text-primary">{t("marketplace.free")}</span>
            )}
          </div>

          <div className="flex gap-1.5">
            {currentUserId && !isOwn && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowReview(true)}>
                <Star className="h-3 w-3" /> {t("marketplace.review_label")}
              </Button>
            )}
            {!isOwn && (
              purchased ? (
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-emerald-600" disabled>
                  <CheckCircle2 className="h-3 w-3" /> {t("marketplace.owned")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handlePurchase}
                  disabled={purchasing || (!isFree && !canAfford)}
                >
                  {purchasing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-3 w-3" />
                  )}
                  {isFree ? t("marketplace.get_free") : `${price} N`}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Submit Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{t("marketplace.review_label")}: {asset.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={cn(
                    "h-7 w-7 transition-colors",
                    s <= rating ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-primary/50"
                  )} />
                </button>
              ))}
            </div>
            <Textarea
              placeholder={t("marketplace.share_experience")}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
            />
            <Button className="w-full" onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? t("marketplace.submitting") : t("marketplace.submit_review")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviews List Dialog */}
      <Dialog open={showReviews} onOpenChange={setShowReviews}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t("marketplace.reviews_for")} {asset.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">{t("marketplace.no_reviews")}</p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="p-3 bg-muted/30 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("h-3 w-3", s <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/20")} />
                    ))}
                    <span className="text-[9px] text-muted-foreground ml-2">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.review_text && <p className="text-xs text-foreground">{r.review_text}</p>}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
