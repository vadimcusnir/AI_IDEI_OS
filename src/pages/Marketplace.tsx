import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Store, Star, Coins, DollarSign, Search, Tag, ShoppingCart, Crown, TrendingUp, Clock, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
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

const SORT_OPTIONS: { value: SortOption; label: string; icon: typeof TrendingUp }[] = [
  { value: "popular", label: "Popular", icon: TrendingUp },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "rating", label: "Top Rated", icon: Star },
  { value: "price_low", label: "Price ↑", icon: Coins },
  { value: "price_high", label: "Price ↓", icon: Coins },
];

export default function Marketplace() {
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);
  const [featured, setFeatured] = useState<KnowledgeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("popular");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Featured assets
      const featuredQuery: any = supabase
        .from("knowledge_assets")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true);
      const { data: featuredData } = await featuredQuery
        .order("sales_count", { ascending: false })
        .limit(6);

      setFeatured((featuredData as KnowledgeAsset[]) || []);

      // All assets
      let query = supabase
        .from("knowledge_assets")
        .select("*")
        .eq("is_published", true);

      if (selectedType) query = query.eq("asset_type", selectedType);

      // Sort
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
        (a.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
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
            <span>Knowledge Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-3">Marketplace</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-[65ch] leading-relaxed">
            Browse knowledge assets, templates, and intelligence packages created by the community.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Featured Section */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold">Featured Assets</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map(asset => (
                <AssetCard key={asset.id} asset={asset} currentUserId={user?.id} creditBalance={balance} isFeatured />
              ))}
            </div>
            <Separator className="mt-8" />
          </section>
        )}

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets, tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-40 text-xs h-9">
              <SelectValue placeholder="Sort by" />
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
            All
          </Button>
          {types.map(t => (
            <Button
              key={t}
              variant={selectedType === t ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => setSelectedType(t)}
            >
              {t}
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
              {search ? "No assets match your search." : "No assets published yet."}
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

function AssetCard({ asset, currentUserId, isFeatured }: { asset: KnowledgeAsset; currentUserId?: string; isFeatured?: boolean }) {
  const [showReview, setShowReview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState<AssetReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const isOwn = currentUserId === asset.author_id;

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
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setShowReview(false);
      setReviewText("");
    }
  };

  return (
    <div className={cn(
      "bg-card border rounded-xl overflow-hidden hover:border-primary/30 transition-colors",
      isFeatured ? "border-amber-500/30 ring-1 ring-amber-500/10" : "border-border"
    )}>
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
            {(asset.rating_avg || 0).toFixed(1)} ({asset.rating_count || 0} reviews)
          </button>
          <span className="text-[9px] text-muted-foreground ml-auto">
            {asset.sales_count || 0} sales
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
              <span className="text-xs font-semibold text-primary">FREE</span>
            )}
          </div>

          <div className="flex gap-1.5">
            {currentUserId && !isOwn && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowReview(true)}>
                <Star className="h-3 w-3" /> Review
              </Button>
            )}
            {!isOwn && (
              <Button size="sm" className="h-7 text-xs gap-1">
                <ShoppingCart className="h-3 w-3" /> Get
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Review: {asset.title}</DialogTitle>
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
              placeholder="Share your experience..."
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              rows={4}
            />
            <Button className="w-full" onClick={handleSubmitReview} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Review"}
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
              Reviews for {asset.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loadingReviews ? (
              <div className="flex justify-center py-8">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No reviews yet.</p>
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
