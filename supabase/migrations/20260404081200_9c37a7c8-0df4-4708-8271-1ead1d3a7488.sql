CREATE OR REPLACE FUNCTION public.auto_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _diff text;
  _component text;
  _label text;
BEGIN
  _component := TG_TABLE_NAME;

  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    _label := COALESCE(
      CASE WHEN to_jsonb(NEW) ? 'title' THEN NEW.title ELSE NULL END,
      CASE WHEN to_jsonb(NEW) ? 'slug' THEN NEW.slug ELSE NULL END,
      CASE WHEN to_jsonb(NEW) ? 'email' THEN NEW.email ELSE NULL END,
      CASE WHEN to_jsonb(NEW) ? 'key' THEN NEW.key ELSE NULL END,
      NEW.id::text
    );
  ELSE
    _label := COALESCE(
      CASE WHEN to_jsonb(OLD) ? 'title' THEN OLD.title ELSE NULL END,
      CASE WHEN to_jsonb(OLD) ? 'slug' THEN OLD.slug ELSE NULL END,
      CASE WHEN to_jsonb(OLD) ? 'email' THEN OLD.email ELSE NULL END,
      CASE WHEN to_jsonb(OLD) ? 'key' THEN OLD.key ELSE NULL END,
      OLD.id::text
    );
  END IF;

  IF TG_OP = 'INSERT' THEN
    _diff := 'New ' || _component || ': ' || _label;
  ELSIF TG_OP = 'UPDATE' THEN
    _diff := 'Updated ' || _component || ': ' || _label;
  ELSIF TG_OP = 'DELETE' THEN
    _diff := 'Removed ' || _component || ': ' || _label;
  END IF;

  INSERT INTO public.changes_raw (source, component, diff_summary, impact_level, metadata)
  VALUES (
    'auto_trigger',
    _component,
    _diff,
    'user',
    jsonb_build_object('op', TG_OP, 'table', TG_TABLE_NAME)
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;