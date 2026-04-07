CREATE OR REPLACE FUNCTION public.search_public_profiles(query text, lim int DEFAULT 5)
RETURNS TABLE(user_id uuid, display_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT user_id, display_name
  FROM public.profiles
  WHERE display_name ILIKE '%' || query || '%'
  LIMIT lim;
$$;