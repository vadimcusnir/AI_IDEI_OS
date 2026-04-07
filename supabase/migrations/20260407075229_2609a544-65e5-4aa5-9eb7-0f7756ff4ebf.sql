-- 1. psychological_profiles: remove broad public guest read
DROP POLICY IF EXISTS "Authenticated can read psycho profiles of public guests" ON public.psychological_profiles;

-- 2. intelligence_profiles: add consent enforcement
DROP POLICY IF EXISTS "Anyone can read published profiles" ON public.intelligence_profiles;
CREATE POLICY "Read published profiles with consent"
ON public.intelligence_profiles FOR SELECT TO authenticated, anon
USING (
  visibility_status = 'published'
  AND risk_flag <> 'high'
  AND consent_required = false
);

-- 3. abuse_events: remove user INSERT
DROP POLICY IF EXISTS "abuse_events_insert_own" ON public.abuse_events;

-- 4. decision_ledger: remove user INSERT
DROP POLICY IF EXISTS "Authenticated users insert own ledger entries" ON public.decision_ledger;