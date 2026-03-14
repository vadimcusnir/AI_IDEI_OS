
-- Asset reviews table
CREATE TABLE public.asset_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.knowledge_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text DEFAULT '',
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, user_id)
);

ALTER TABLE public.asset_reviews ENABLE ROW LEVEL SECURITY;

-- RLS
CREATE POLICY "Anyone can read published reviews"
  ON public.asset_reviews FOR SELECT TO public
  USING (status = 'published');

CREATE POLICY "Users can insert own reviews"
  ON public.asset_reviews FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON public.asset_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON public.asset_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage all reviews"
  ON public.asset_reviews FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger to update rating_avg and rating_count on knowledge_assets
CREATE OR REPLACE FUNCTION public.update_asset_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE knowledge_assets SET
    rating_avg = COALESCE((
      SELECT AVG(rating)::numeric(3,2) FROM asset_reviews
      WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id) AND status = 'published'
    ), 0),
    rating_count = COALESCE((
      SELECT COUNT(*) FROM asset_reviews
      WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id) AND status = 'published'
    ), 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.asset_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_asset_rating();

-- Add featured flag to knowledge_assets
ALTER TABLE public.knowledge_assets ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Indexes
CREATE INDEX idx_asset_reviews_asset ON public.asset_reviews(asset_id);
CREATE INDEX idx_asset_reviews_user ON public.asset_reviews(user_id);
CREATE INDEX idx_knowledge_assets_featured ON public.knowledge_assets(is_featured) WHERE is_featured = true;

-- Updated_at trigger
CREATE TRIGGER update_asset_reviews_updated_at
  BEFORE UPDATE ON public.asset_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
