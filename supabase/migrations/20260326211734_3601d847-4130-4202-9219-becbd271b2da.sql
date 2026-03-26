
-- ═══════════════════════════════════════════════════
-- ZERO TRUST IAM: Security Events + Session Audit
-- ═══════════════════════════════════════════════════

-- 1. Security events table for login/auth audit trail
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  ip_hint text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user-scoped queries and admin monitoring
CREATE INDEX idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON public.security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON public.security_events(severity, created_at DESC) WHERE severity IN ('warning', 'critical');

-- RLS: users see own events, admins see all
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all security events"
  ON public.security_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert security events"
  ON public.security_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Login attempt tracking for brute-force protection
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_hint text,
  success boolean NOT NULL DEFAULT false,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_hint, created_at DESC) WHERE ip_hint IS NOT NULL;

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access login attempts (via edge functions)
-- No user-facing policies needed

-- 3. Function to check failed login count (brute-force detection)
CREATE OR REPLACE FUNCTION public.check_login_attempts(
  p_email text,
  p_window_minutes integer DEFAULT 15,
  p_max_attempts integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'attempts', COALESCE(COUNT(*), 0),
    'locked', COALESCE(COUNT(*), 0) >= p_max_attempts,
    'oldest_attempt', MIN(created_at)
  )
  FROM public.login_attempts
  WHERE email = lower(p_email)
    AND success = false
    AND created_at > (now() - (p_window_minutes || ' minutes')::interval);
$$;

-- 4. Function to log security events from edge functions
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_event_type text,
  p_severity text DEFAULT 'info',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, severity, metadata)
  VALUES (p_user_id, p_event_type, p_severity, p_metadata);
END;
$$;

-- 5. Invalidate sessions function (for password reset)
-- Uses Supabase admin API pattern - logs the event
CREATE OR REPLACE FUNCTION public.log_password_change(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (user_id, event_type, severity, metadata)
  VALUES (p_user_id, 'password_changed', 'warning', 
    jsonb_build_object('action', 'all_sessions_should_refresh', 'changed_at', now()));
END;
$$;
