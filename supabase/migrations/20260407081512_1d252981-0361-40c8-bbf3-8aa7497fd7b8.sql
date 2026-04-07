-- FIX 1: forum_votes — remove blanket read, keep own-only
DROP POLICY IF EXISTS "Authenticated read votes" ON public.forum_votes;

-- FIX 2: blog_topics — restrict to published or admin
DROP POLICY IF EXISTS "Anyone can read blog topics" ON public.blog_topics;

CREATE POLICY "Published topics readable by authenticated"
ON public.blog_topics FOR SELECT TO authenticated
USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));