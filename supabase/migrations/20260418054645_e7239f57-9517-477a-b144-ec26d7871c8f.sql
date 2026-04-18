CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'neurons',  (SELECT COUNT(*) FROM public.neurons),
    'episodes', (SELECT COUNT(*) FROM public.episodes),
    'services', (SELECT COUNT(*) FROM public.service_units WHERE status = 'active'),
    'articles', (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published')
  );
$$;

REVOKE ALL ON FUNCTION public.get_public_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;