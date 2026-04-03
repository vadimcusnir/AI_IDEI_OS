-- Allow anonymous (unauthenticated) users to read active services from service_catalog
CREATE POLICY "service_catalog_anon_read" ON public.service_catalog
  FOR SELECT TO anon
  USING (is_active = true);

-- Allow anonymous users to read service_units (public browsing)
CREATE POLICY "service_units_anon_read" ON public.service_units
  FOR SELECT TO anon
  USING (true);