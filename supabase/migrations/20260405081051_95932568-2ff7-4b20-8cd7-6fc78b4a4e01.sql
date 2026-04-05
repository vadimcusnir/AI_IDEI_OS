
-- FIX 1: Notebook-files INSERT policy - add path ownership check
DROP POLICY IF EXISTS "Users can upload notebook files" ON storage.objects;
CREATE POLICY "Users can upload own notebook files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notebook-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- FIX 2: Profiles - replace blanket read with split policies
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Allow users to read their own full profile
CREATE POLICY "Users can read own full profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create a secure view for cross-user profile reads (public fields only)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, user_id, username, avatar_url, bio, display_name, created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
