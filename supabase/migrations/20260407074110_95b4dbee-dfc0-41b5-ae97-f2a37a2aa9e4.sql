-- Create profiles_public alias view
CREATE OR REPLACE VIEW public.profiles_public WITH (security_invoker=on) AS
SELECT id, user_id, username, avatar_url, bio, display_name, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated, anon;

-- Batch profile lookup RPC (SECURITY DEFINER to bypass own-data RLS)
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, display_name, username, avatar_url
  FROM public.profiles
  WHERE user_id = ANY(user_ids);
$$;