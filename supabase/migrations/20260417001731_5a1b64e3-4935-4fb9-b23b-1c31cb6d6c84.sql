
CREATE OR REPLACE FUNCTION public.touch_blog_comments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );
