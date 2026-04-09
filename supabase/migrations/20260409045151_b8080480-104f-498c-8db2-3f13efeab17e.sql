
-- Add licensing and commercialization columns to knowledge_assets
ALTER TABLE public.knowledge_assets 
  ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'private_use_only',
  ADD COLUMN IF NOT EXISTS commercialization_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS conflict_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conflict_details JSONB DEFAULT '{}';

-- Add index for marketplace queries filtering by license
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_license_type ON public.knowledge_assets(license_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_commercialization ON public.knowledge_assets(commercialization_status);
