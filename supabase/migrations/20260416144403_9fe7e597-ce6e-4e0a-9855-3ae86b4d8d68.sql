
-- ═══ 1. SERVICES SAFE VIEWS (correct columns per table) ═══
CREATE OR REPLACE VIEW public.services_level_1_public
WITH (security_invoker = on)
AS
SELECT
  id, service_name, service_slug, category, subcategory,
  description_public, price_usd, deliverable_name, deliverable_type,
  estimated_delivery_seconds, status, visibility,
  created_at, updated_at
FROM public.services_level_1;

CREATE OR REPLACE VIEW public.services_level_2_public
WITH (security_invoker = on)
AS
SELECT
  id, service_name, service_slug, category, subcategory,
  description_public, price_usd, deliverable_name, deliverable_type,
  estimated_delivery_seconds, status, visibility,
  created_at, updated_at
FROM public.services_level_2;

CREATE OR REPLACE VIEW public.services_level_3_public
WITH (security_invoker = on)
AS
SELECT
  id, service_name, service_slug, category, subcategory,
  description_public, price_usd, deliverable_name, deliverable_type,
  estimated_delivery_seconds, status, visibility,
  created_at, updated_at
FROM public.services_level_3;

-- ═══ 2. NEURON JOBS — restrict to own jobs only ═══
DROP POLICY IF EXISTS "Users can view jobs for accessible neurons" ON public.neuron_jobs;

CREATE POLICY "Users can view own neuron jobs"
ON public.neuron_jobs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM neurons n
    WHERE n.id = neuron_jobs.neuron_id
    AND n.author_id = auth.uid()
  )
);
