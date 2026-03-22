
-- Fix search_path on functions
ALTER FUNCTION public.compute_content_hash(_content text) SET search_path = 'public';
ALTER FUNCTION public.auto_content_hash() SECURITY DEFINER SET search_path = 'public';
