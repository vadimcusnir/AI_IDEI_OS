-- P0 FIX: Replace the overly permissive public policy on content_contributions
-- The old policy exposes reviewer_id, quality_score, review_note to anon users
DROP POLICY IF EXISTS "Published contributions are public" ON content_contributions;

-- New policy: public can only see approved contributions, but we create a secure view
-- to control which columns are exposed
CREATE OR REPLACE VIEW public.public_contributions AS
SELECT 
  id,
  title,
  content,
  contribution_type,
  tags,
  word_count,
  status,
  neurons_awarded,
  created_at,
  updated_at
FROM content_contributions
WHERE status = 'approved';

-- Re-create the public policy but only for authenticated users reading their own + admins
-- Public access goes through the view instead
CREATE POLICY "Approved contributions visible to authenticated"
ON content_contributions
FOR SELECT
TO authenticated
USING (
  status = 'approved' 
  OR author_id = auth.uid() 
  OR has_role(auth.uid(), 'admin')
);

-- P1 FIX: Secure the neuron_lifecycle_pricing view
-- Views inherit the security of underlying tables, but let's ensure
-- the neurons table RLS is the gate. Add security_invoker to the view.
DROP VIEW IF EXISTS public.neuron_lifecycle_pricing;
CREATE VIEW public.neuron_lifecycle_pricing
WITH (security_invoker = true)
AS
SELECT 
  id AS neuron_id,
  lifecycle,
  credits_cost AS base_cost,
  CASE lifecycle
    WHEN 'ingested' THEN 1.0
    WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8
    WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END AS lifecycle_multiplier,
  round(credits_cost::numeric * CASE lifecycle
    WHEN 'ingested' THEN 1.0
    WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8
    WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END) AS adjusted_cost
FROM neurons n;