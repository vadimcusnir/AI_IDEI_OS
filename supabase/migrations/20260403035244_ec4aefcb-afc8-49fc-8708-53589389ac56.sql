
CREATE POLICY "Users insert own triggers" ON public.automation_triggers FOR INSERT TO authenticated WITH CHECK (job_id IN (SELECT id FROM public.automation_jobs WHERE user_id = auth.uid()));
CREATE POLICY "Users update own triggers" ON public.automation_triggers FOR UPDATE TO authenticated USING (job_id IN (SELECT id FROM public.automation_jobs WHERE user_id = auth.uid()));
CREATE POLICY "Users delete own triggers" ON public.automation_triggers FOR DELETE TO authenticated USING (job_id IN (SELECT id FROM public.automation_jobs WHERE user_id = auth.uid()));
