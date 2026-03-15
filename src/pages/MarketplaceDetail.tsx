import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Star, Coins, DollarSign, Tag, ShoppingCart, Crown,
  TrendingUp, MessageSquare, Loader2, CheckCircle2, Store, Clock,
} from "lucide-react";

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
  review_text: string | null;
  created_at: string;
}

export default function MarketplaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance } = useCreditBalance();
  const [asset, setAsset] = useState<KnowledgeAsset | null>(null);
  const [reviews, setReviews] = useState<AssetReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("knowledge_assets")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();
      setAsset(data as KnowledgeAsset | null);

      const { data: revData } = await supabase
        .from("asset_reviews")
        .select("*")
        .eq("asset_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      setReviews((revData as AssetReview[]) || []);
      setLoading(false);
    };
    load();
  }, [id]);

  const isOwn = user?.id === asset?.author_id;
  const price = asset?.price_neurons || 0;
  const isFree = price === 0 && (!asset?.price_usd || Number(asset.price_usd) === 0);
  const canAfford = balance >= price;

  const handlePurchase = async () => {
    if (!user) { toast.error("Please sign in to purchase."); return; }
    if (!isFree && !canAfford) { toast.error(`Insufficient NEURONS. Need ${price}, have ${balance}.`); return; }

    setPurchasing(true);
    try {
      const { data, error } = await supabase.rpc("purchase_marketplace_asset", {
        _buyer_id: user.id,
        _asset_id: asset!.id,
      });
      if (error) throw new Error(error.message);
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Purchase failed");
      setPurchased(true);
      toast.success(isFree ? "Asset acquired!" : `Purchased for ${result.price} NEURONS!`);
    } catch (err: any) {
      toast.error("Purchase failed: " + (err.message || "Try again"));
    } finally {
      setPurchasing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return;
    setSubmittingReview(true);
    const { error } = await supabase
      .from("asset_reviews")
      .upsert({ asset_id: asset!.id, user_id: user.id, rating, review_text: reviewText } as any, {
        onConflict: "asset_id,user_id",
      });
    setSubmittingReview(false);
    if (error) { toast.error("Failed to submit review"); return; }
    toast.success("Review submitted!");
    setReviewText("");
    // Reload reviews
    const { data } = await supabase
      .from("asset_reviews").select("*").eq("asset_id", asset!.id).eq("status", "published")
      .order("created_at", { ascending: false }).limit(50);
    setReviews((data as AssetReview[]) || []);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Store className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">Asset not found or no longer published.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/marketplace")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${asset.title} — AI-IDEI Marketplace`}
        description={asset.description || `Knowledge asset: ${asset.title}`}
      />

      {/* Back nav */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")} className="text-xs text-muted-foreground -ml-2">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Marketplace
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{asset.asset_type}</Badge>
            {asset.is_featured && (
              <Badge className="bg-amber-500/10 text-amber-600 text-[9px] border-amber-500/30">
                <Crown className="h-2.5 w-2.5 mr-1" /> Featured
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">{asset.title}</h1>
          {asset.description && (
            <p className="text-sm text-muted-foreground max-w-[65ch] leading-relaxed">{asset.description}</p>
          )}
        </div>

        {/* Stats + Price */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn("h-4 w-4", s <= Math.round(asset.rating_avg || 0) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20")} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              {(asset.rating_avg || 0).toFixed(1)} ({asset.rating_count || 0})
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> {asset.sales_count || 0} sales
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="h-3.5 w-3.5" /> {new Date(asset.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {asset.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                <Tag className="h-2.5 w-2.5" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Preview content */}
        {asset.preview_content && (
          <div className="bg-muted/30 border border-border rounded-xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Preview</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{asset.preview_content}</p>
          </div>
        )}

        {/* Purchase CTA */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {price > 0 && (
                <span className="flex items-center gap-1 text-lg font-bold font-mono text-primary">
                  <Coins className="h-4 w-4" /> {price}
                </span>
              )}
              {asset.price_usd && Number(asset.price_usd) > 0 && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5" /> {Number(asset.price_usd).toFixed(2)}
                </span>
              )}
              {isFree && <span className="text-sm font-semibold text-emerald-600">Free</span>}
            </div>
            {!isFree && user && (
              <p className="text-[10px] text-muted-foreground">Your balance: {balance} NEURONS</p>
            )}
          </div>
          <Button
            onClick={handlePurchase}
            disabled={purchasing || purchased || isOwn || (!isFree && !canAfford)}
            className="gap-2"
          >
            {purchased ? <><CheckCircle2 className="h-4 w-4" /> Acquired</> :
              purchasing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> :
              isOwn ? "Your Asset" :
              <><ShoppingCart className="h-4 w-4" /> {isFree ? "Get Free" : `Buy · ${price} N`}</>
            }
          </Button>
        </div>

        <Separator />

        {/* Reviews */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Reviews ({reviews.length})</h2>

          {/* Write review */}
          {user && !isOwn && (
            <div className="bg-muted/20 border border-border rounded-xl p-5 space-y-3">
              <p className="text-xs font-medium">Write a Review</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)}>
                    <Star className={cn("h-5 w-5 transition-colors", s <= rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20 hover:text-amber-300")} />
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                className="text-sm min-h-[80px]"
              />
              <Button size="sm" onClick={handleSubmitReview} disabled={submittingReview}>
                {submittingReview ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <MessageSquare className="h-3.5 w-3.5 mr-1.5" />}
                Submit
              </Button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn("h-3 w-3", s <= review.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20")} />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.review_text && <p className="text-sm text-muted-foreground">{review.review_text}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
