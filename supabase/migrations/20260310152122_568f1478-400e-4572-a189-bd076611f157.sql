CREATE OR REPLACE FUNCTION public.notify_changelog_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  u RECORD;
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    FOR u IN SELECT DISTINCT user_id FROM public.notification_preferences
    LOOP
      INSERT INTO public.notifications (user_id, type, title, message, link, meta)
      VALUES (
        u.user_id,
        'changelog',
        'Noutăți: ' || NEW.title,
        COALESCE(LEFT(NEW.description, 120), ''),
        '/changelog',
        jsonb_build_object('changelog_id', NEW.id, 'version', NEW.version, 'category', NEW.category)
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_changelog_published
  AFTER INSERT OR UPDATE ON public.changelog_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_changelog_published();