-- Fix: restrict agent_plan_templates INSERT to admins only
-- Any authenticated user could previously insert arbitrary templates
DROP POLICY "Authenticated users can save templates" ON public.agent_plan_templates;

CREATE POLICY "Admins can insert plan templates"
ON public.agent_plan_templates
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));