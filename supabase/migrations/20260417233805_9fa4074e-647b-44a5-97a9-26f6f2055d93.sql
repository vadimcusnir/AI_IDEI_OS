-- =============================================================
-- WAVE 1 — F-014: Replace exploitable add_credits
-- =============================================================

-- Drop legacy exposed function (was callable from browser via supabase.rpc).
DROP FUNCTION IF EXISTS public.add_credits(uuid, integer, text, text);

-- Recreate with p_*-named parameters; server-side only.
CREATE FUNCTION public.add_credits(
  p_user_id     uuid,
  p_amount      integer,
  p_description text DEFAULT 'topup',
  p_type        text DEFAULT 'topup'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_credits (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance      = public.user_credits.balance + p_amount,
      total_earned = public.user_credits.total_earned + p_amount,
      updated_at   = now();

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);

  RETURN true;
END;
$$;

-- Lock down: only service_role (edge functions) can call this.
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, text) TO service_role;

-- =============================================================
-- WAVE 1 — F-012: Create + harden user-uploads bucket
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  52428800,
  ARRAY[
    'audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/mp4','audio/m4a','audio/x-m4a',
    'audio/ogg','audio/webm','audio/flac',
    'video/mp4','video/webm','video/quicktime',
    'text/plain','text/csv','application/json','application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "user-uploads owner read"   ON storage.objects;
DROP POLICY IF EXISTS "user-uploads owner write"  ON storage.objects;
DROP POLICY IF EXISTS "user-uploads owner update" ON storage.objects;
DROP POLICY IF EXISTS "user-uploads owner delete" ON storage.objects;

-- Path layout used by AgentConsole: chat-uploads/<user_id>/<timestamp>_<file>
-- foldername(name)[1] = 'chat-uploads', [2] = '<user_id>'
CREATE POLICY "user-uploads owner read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "user-uploads owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "user-uploads owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "user-uploads owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'user-uploads'
  AND (storage.foldername(name))[2] = auth.uid()::text
);