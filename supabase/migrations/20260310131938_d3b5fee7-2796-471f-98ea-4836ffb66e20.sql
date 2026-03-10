
-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  link text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- System inserts (via triggers with SECURITY DEFINER)
CREATE POLICY "System insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify on job completion/failure
CREATE OR REPLACE FUNCTION public.notify_job_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND (OLD.status IS NULL OR OLD.status NOT IN ('completed', 'failed')) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, meta)
    VALUES (
      NEW.author_id,
      CASE WHEN NEW.status = 'completed' THEN 'job_completed' ELSE 'job_failed' END,
      CASE WHEN NEW.status = 'completed' THEN 'Job finalizat ✓' ELSE 'Job eșuat ✗' END,
      REPLACE(NEW.worker_type, '-', ' ') || ' — ' || NEW.status,
      '/jobs',
      jsonb_build_object('job_id', NEW.id, 'neuron_id', NEW.neuron_id, 'worker_type', NEW.worker_type)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_job_status
  AFTER UPDATE ON public.neuron_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_job_status();

-- Trigger: notify on credits going below 50
CREATE OR REPLACE FUNCTION public.notify_credits_low()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.balance < 50 AND (OLD.balance IS NULL OR OLD.balance >= 50) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, meta)
    VALUES (
      NEW.user_id,
      'credits_low',
      'Credite scăzute ⚠',
      'Balanța ta: ' || NEW.balance || ' NEURONS. Consideră un top-up.',
      '/credits',
      jsonb_build_object('balance', NEW.balance)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_credits_low
  AFTER UPDATE ON public.user_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_credits_low();

-- Trigger: notify on neuron version created
CREATE OR REPLACE FUNCTION public.notify_version_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.author_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, meta)
    VALUES (
      NEW.author_id,
      'version_created',
      'Versiune nouă salvată',
      'v' || NEW.version || ' — ' || NEW.title,
      '/n/' || NEW.neuron_id,
      jsonb_build_object('neuron_id', NEW.neuron_id, 'version', NEW.version)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_version_created
  AFTER INSERT ON public.neuron_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_version_created();
