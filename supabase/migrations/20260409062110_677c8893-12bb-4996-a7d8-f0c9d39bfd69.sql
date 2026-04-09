
-- Add public profile fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS public_profile_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS public_links JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seller_verified BOOLEAN NOT NULL DEFAULT false;

-- Add visibility control to artifacts
ALTER TABLE public.artifacts
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';

CREATE INDEX IF NOT EXISTS idx_artifacts_visibility ON public.artifacts(visibility);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON public.profiles(public_profile_enabled) WHERE public_profile_enabled = true;
