-- Enable realtime for artifacts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.artifacts;

-- Trigger: notify user when an artifact is auto-generated
CREATE OR REPLACE FUNCTION public.notify_artifact_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.author_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link, meta)
    VALUES (
      NEW.author_id,
      'artifact_created',
      'Artefact generat ✓',
      NEW.title,
      '/library/' || NEW.id,
      jsonb_build_object('artifact_id', NEW.id, 'artifact_type', NEW.artifact_type, 'service_key', NEW.service_key)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_artifact_created
  AFTER INSERT ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_artifact_created();