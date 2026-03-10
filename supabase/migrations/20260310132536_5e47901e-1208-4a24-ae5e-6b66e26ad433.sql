
-- Feedback table
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'review' CHECK (type IN ('testimonial', 'review', 'proposal', 'complaint', 'feedback')),
  rating smallint CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  title text NOT NULL,
  message text NOT NULL,
  context_page text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'published')),
  admin_response text,
  admin_responded_at timestamptz,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_user ON public.feedback(user_id, created_at DESC);
CREATE INDEX idx_feedback_status ON public.feedback(status, type);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
CREATE POLICY "Users read own feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

-- Users can insert feedback
CREATE POLICY "Users insert feedback"
  ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own pending feedback
CREATE POLICY "Users update own pending feedback"
  ON public.feedback FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- Admins can read all feedback
CREATE POLICY "Admins read all feedback"
  ON public.feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update feedback (respond, change status)
CREATE POLICY "Admins update feedback"
  ON public.feedback FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: notify admins when new feedback arrives
CREATE OR REPLACE FUNCTION public.notify_feedback_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  admin_record RECORD;
  type_label text;
BEGIN
  type_label := CASE NEW.type
    WHEN 'testimonial' THEN 'Testimonial'
    WHEN 'review' THEN 'Recenzie'
    WHEN 'proposal' THEN 'Propunere'
    WHEN 'complaint' THEN 'Plângere'
    ELSE 'Feedback'
  END;

  -- Notify all admins
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, link, meta)
    VALUES (
      admin_record.user_id,
      'feedback_new',
      'Feedback nou: ' || type_label,
      LEFT(NEW.title, 80),
      '/admin',
      jsonb_build_object('feedback_id', NEW.id, 'feedback_type', NEW.type, 'rating', NEW.rating)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feedback_submitted
  AFTER INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feedback_submitted();

-- Trigger: notify user when admin responds
CREATE OR REPLACE FUNCTION public.notify_feedback_responded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.admin_response IS NOT NULL AND (OLD.admin_response IS NULL OR OLD.admin_response != NEW.admin_response) THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, meta)
    VALUES (
      NEW.user_id,
      'feedback_response',
      'Răspuns la feedback-ul tău',
      LEFT(NEW.admin_response, 100),
      '/feedback',
      jsonb_build_object('feedback_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_feedback_responded
  AFTER UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feedback_responded();

-- Updated_at trigger
CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
