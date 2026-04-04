CREATE POLICY "Authenticated users can save templates"
ON public.agent_plan_templates
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update own templates"
ON public.agent_plan_templates
FOR UPDATE
TO authenticated
USING (true);
