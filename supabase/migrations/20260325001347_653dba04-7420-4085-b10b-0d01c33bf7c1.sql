
-- PART 3: Admin full access policies for critical tables

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN VALUES
    ('profiles'),
    ('notifications'),
    ('credits'),
    ('wallets'),
    ('subscriptions'),
    ('conversations'),
    ('messages'),
    ('audit_logs'),
    ('activity_log'),
    ('neurons'),
    ('workspaces'),
    ('teams'),
    ('orgs')
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'admin_full_access_' || tbl, tbl);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))', 'admin_full_access_' || tbl, tbl);
    END IF;
  END LOOP;
END $$;
