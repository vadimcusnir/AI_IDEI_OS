
-- FIX 2: dedup_clusters — restrict to own neurons (use author_id)
DROP POLICY IF EXISTS "Users read own dedup clusters" ON public.dedup_clusters;

CREATE POLICY "Users read own dedup clusters"
ON public.dedup_clusters
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.dedup_cluster_members dcm
    JOIN public.neurons n ON n.id = dcm.neuron_id
    WHERE dcm.cluster_id = dedup_clusters.id
      AND (n.author_id = auth.uid() OR n.visibility = 'public')
  )
);

-- FIX 3: dedup_cluster_members — restrict to own neurons
DROP POLICY IF EXISTS "Users read own cluster members" ON public.dedup_cluster_members;

CREATE POLICY "Users read own cluster members"
ON public.dedup_cluster_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = dedup_cluster_members.neuron_id
      AND (n.author_id = auth.uid() OR n.visibility = 'public')
  )
);

-- FIX 4: Onboarding credit grant — 100 NEURONS on signup
CREATE OR REPLACE FUNCTION public.grant_onboarding_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_transactions (user_id, amount, transaction_type, description)
  VALUES (NEW.id, 100, 'onboarding_grant', 'Welcome bonus: 100 NEURONS');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_onboarding_credits ON public.profiles;
CREATE TRIGGER trigger_onboarding_credits
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.grant_onboarding_credits();
