
-- Table for VAPID keys and internal config (service role only)
CREATE TABLE IF NOT EXISTS public.push_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service role can access

-- Generate internal secret for trigger -> edge function auth
INSERT INTO public.push_config (key, value) 
VALUES ('internal_secret', gen_random_uuid()::text)
ON CONFLICT (key) DO NOTHING;

-- Add unique constraint on push_subscriptions endpoint
ALTER TABLE public.push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Trigger function to send push via edge function
CREATE OR REPLACE FUNCTION public.trigger_send_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  internal_key text;
BEGIN
  -- Get internal secret
  SELECT value INTO internal_key FROM public.push_config WHERE key = 'internal_secret';
  
  -- Call send-push edge function via pg_net
  PERFORM net.http_post(
    url := 'https://swghuuxkcilayybesadm.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', internal_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'link', NEW.link,
      'type', NEW.type
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger on notifications insert
CREATE TRIGGER trg_send_push_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_send_push();
