
DROP POLICY IF EXISTS "Authenticated users insert SEO" ON public.public_figure_seo;
DROP POLICY IF EXISTS "Authenticated users update SEO" ON public.public_figure_seo;

CREATE POLICY "Owner inserts SEO"
  ON public.public_figure_seo FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.intelligence_profiles ip
      WHERE ip.id = profile_id AND ip.created_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owner updates SEO"
  ON public.public_figure_seo FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.intelligence_profiles ip
      WHERE ip.id = profile_id AND ip.created_by = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
