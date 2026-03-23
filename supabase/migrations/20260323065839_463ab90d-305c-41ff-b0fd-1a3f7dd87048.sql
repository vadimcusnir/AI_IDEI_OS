
-- Add preferred_language to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred UI language: en, ro, ru. NULL = auto-detect.';
