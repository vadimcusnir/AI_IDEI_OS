
-- Function to get storage usage per user across all buckets
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(p_user_id UUID)
RETURNS TABLE (
  bucket_id TEXT,
  file_count BIGINT,
  total_bytes BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT 
    o.bucket_id,
    COUNT(*)::BIGINT AS file_count,
    COALESCE(SUM((o.metadata->>'size')::BIGINT), 0)::BIGINT AS total_bytes
  FROM storage.objects o
  WHERE (storage.foldername(o.name))[1] = p_user_id::text
     OR o.owner = p_user_id
  GROUP BY o.bucket_id;
$$;

-- Table to track storage limits per tier
CREATE TABLE IF NOT EXISTS public.storage_limits (
  tier TEXT PRIMARY KEY,
  max_bytes BIGINT NOT NULL,
  max_files INT NOT NULL DEFAULT 1000,
  description TEXT
);

-- Insert default limits
INSERT INTO public.storage_limits (tier, max_bytes, max_files, description) VALUES
  ('free', 524288000, 100, '500 MB - Free tier'),
  ('pro_monthly', 5368709120, 5000, '5 GB - Pro tier'),
  ('vip_monthly', 53687091200, 50000, '50 GB - VIP tier')
ON CONFLICT (tier) DO NOTHING;

-- RLS on storage_limits (read-only for all authenticated)
ALTER TABLE public.storage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read storage limits"
  ON public.storage_limits FOR SELECT
  TO authenticated
  USING (true);
