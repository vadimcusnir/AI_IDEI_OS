-- FIX: mpi_scores — restrict to own neurons/entities or public
DROP POLICY IF EXISTS "mpi_scores_select" ON public.mpi_scores;
DROP POLICY IF EXISTS "Authenticated users can read mpi_scores" ON public.mpi_scores;
CREATE POLICY "Users read own or public mpi_scores"
ON public.mpi_scores FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.neurons n
    WHERE n.id = mpi_scores.neuron_id
    AND (n.visibility = 'public' OR n.author_id = auth.uid())
  )
  OR NOT EXISTS (SELECT 1 FROM public.neurons n WHERE n.id = mpi_scores.neuron_id)
);

-- FIX: dedup_clusters — admin only
DROP POLICY IF EXISTS "dedup_clusters_select" ON public.dedup_clusters;
DROP POLICY IF EXISTS "Authenticated users can read dedup_clusters" ON public.dedup_clusters;
CREATE POLICY "Admins read dedup_clusters"
ON public.dedup_clusters FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- FIX: dedup_cluster_members — admin only
DROP POLICY IF EXISTS "dedup_cluster_members_select" ON public.dedup_cluster_members;
DROP POLICY IF EXISTS "Authenticated users can read dedup_cluster_members" ON public.dedup_cluster_members;
CREATE POLICY "Admins read dedup_cluster_members"
ON public.dedup_cluster_members FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));