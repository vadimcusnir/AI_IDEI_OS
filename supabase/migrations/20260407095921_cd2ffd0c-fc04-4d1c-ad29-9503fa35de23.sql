DROP POLICY IF EXISTS "Admins manage plan templates" ON public.agent_plan_templates;
CREATE POLICY "Admins manage plan templates"
ON public.agent_plan_templates FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));