-- Fix security definer on public_contributions view
DROP VIEW IF EXISTS public.public_contributions;
CREATE VIEW public.public_contributions
WITH (security_invoker = true)
AS
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