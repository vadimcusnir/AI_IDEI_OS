-- SEC_003: Fix remaining RLS gaps

-- 1. translations: restrict INSERT/UPDATE to admin only  
DROP POLICY IF EXISTS "Authenticated users can insert translations" ON public.translations;
DROP POLICY IF EXISTS "Authenticated users can update translations" ON public.translations;

CREATE POLICY "Admins can insert translations" ON public.translations
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update translations" ON public.translations
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. public_contributions: if it's a table, enable RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'public_contributions') THEN
    EXECUTE 'ALTER TABLE public.public_contributions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY "Authenticated read public_contributions" ON public.public_contributions FOR SELECT TO authenticated USING (true)';
  END IF;
END$$;