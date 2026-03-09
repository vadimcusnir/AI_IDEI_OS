-- Allow admins to see all neurons
CREATE POLICY "Admins can read all neurons"
ON public.neurons
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));