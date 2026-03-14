import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Store, Star, Coins, DollarSign, Search, Tag, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SEOHead } from "@/components/SEOHead";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

export default function Marketplace() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<KnowledgeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      let query = supabase
        .from("knowledge_assets")
        .select("*")
        .eq("is_published", true)
        .order("sales_count", { ascending: false });

      if (selectedType) query = query.eq("asset_type", selectedType);

      const { data } = await query.limit(100);
      setAssets((data as KnowledgeAsset[]) || []);
      setLoading(false);
    };
    load();
  }, [selectedType]);

  const filtered = search.trim()
    ? assets.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.description || "").toLowerCase().includes(search.toLowerCase())
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
              onClick={() => setSelectedType(null)}
            >
              All
            </Button>
            {types.map(t => (
              <Button
                key={t}
                variant={selectedType === t ? "default" : "outline"}
                size="sm"
                className="text-xs h-8"
                onClick={() => setSelectedType(t)}
              >
                {t}
              </Button>
            ))}
          </div>
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
              <AssetCard key={asset.id} asset={asset} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset, currentUserId }: { asset: KnowledgeAsset; currentUserId?: string }) {
  const [showReview, setShowReview] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  const isOwn = currentUserId === asset.author_id;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      {/* Preview */}
      {asset.preview_content && (
        <div className="p-4 bg-muted/30 border-b border-border">
          <p className="text-[10px] text-muted-foreground line-clamp-3">{asset.preview_content}</p>
        </div>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Badge variant="outline" className="text-[9px] mb-1.5">{asset.asset_type}</Badge>
            <h3 className="text-sm font-semibold line-clamp-2">{asset.title}</h3>
          </div>
        </div>

        {asset.description && (
          <p className="text-[10px] text-muted-foreground line-clamp-2">{asset.description}</p>
        )}

        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 4).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                <Tag className="h-2 w-2" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
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
          <span className="text-[9px] text-muted-foreground">
            {(asset.rating_avg || 0).toFixed(1)} ({asset.rating_count || 0})
          </span>
          <span className="text-[9px] text-muted-foreground ml-auto">
            {asset.sales_count || 0} sales
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            {asset.price_neurons && asset.price_neurons > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono font-bold text-primary">
                <Coins className="h-3 w-3" /> {asset.price_neurons} NEURONS
              </span>
            )}
            {asset.price_usd && asset.price_usd > 0 && (
              <span className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <DollarSign className="h-3 w-3" /> ${Number(asset.price_usd).toFixed(0)}
              </span>
            )}
            {(!asset.price_neurons || asset.price_neurons === 0) && (!asset.price_usd || asset.price_usd === 0) && (
              <span className="text-xs font-semibold text-primary">FREE</span>
            )}
          </div>

          {!isOwn && (
            <Button size="sm" className="h-7 text-xs gap-1">
              <ShoppingCart className="h-3 w-3" /> Get
            </Button>
          )}
        </div>

        {/* Review button */}
        {currentUserId && !isOwn && (
          <Dialog open={showReview} onOpenChange={setShowReview}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                <Star className="h-3 w-3 mr-1" /> Write a Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-sm">Review: {asset.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={cn(
                        "h-6 w-6 transition-colors",
                        s <= rating ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-primary/50"
                      )} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Share your experience with this asset..."
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  rows={4}
                />
                <Button
                  className="w-full"
                  onClick={() => {
                    toast.success("Review submitted for moderation");
                    setShowReview(false);
                    setReviewText("");
                  }}
                >
                  Submit Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
