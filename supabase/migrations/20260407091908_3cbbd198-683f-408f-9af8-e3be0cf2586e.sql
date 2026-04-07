
-- FIX: neuron_jobs policies use 'public' role (allows anon access)
-- Restrict to 'authenticated' only

DROP POLICY IF EXISTS "Users can create jobs for own neurons" ON public.neuron_jobs;
CREATE POLICY "Users can create jobs for own neurons"
ON public.neuron_jobs FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_jobs.neuron_id
    AND n.author_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update jobs for own neurons" ON public.neuron_jobs;
CREATE POLICY "Users can update jobs for own neurons"
ON public.neuron_jobs FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_jobs.neuron_id
    AND n.author_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view jobs for accessible neurons" ON public.neuron_jobs;
CREATE POLICY "Users can view jobs for accessible neurons"
ON public.neuron_jobs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = neuron_jobs.neuron_id
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  )
);
