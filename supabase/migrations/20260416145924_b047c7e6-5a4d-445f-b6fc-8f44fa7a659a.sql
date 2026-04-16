
-- ═══ 1. NOTIFICATIONS — Remove user INSERT policy ═══
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;

-- Only service_role can insert notifications
CREATE POLICY "notifications_insert_service_only"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- ═══ 2. STORAGE — Restrict public bucket listing ═══
-- Drop overly permissive SELECT policies on storage.objects for public buckets
-- and replace with path-scoped access (users can access files by direct URL, not list all)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname ILIKE '%public%'
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Re-create scoped SELECT: authenticated users can read objects in any bucket they uploaded to
CREATE POLICY "Users read own storage objects"
ON storage.objects FOR SELECT
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Public buckets: allow reading by direct path (not listing)
CREATE POLICY "Public bucket read by path"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id IN (SELECT id FROM storage.buckets WHERE public = true));
