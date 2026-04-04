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
  _rec jsonb;
BEGIN
  _component := TG_TABLE_NAME;

  IF TG_OP = 'DELETE' THEN
    _rec := to_jsonb(OLD);
  ELSE
    _rec := to_jsonb(NEW);
  END IF;

  _label := COALESCE(
    _rec ->> 'title',
    _rec ->> 'name',
    _rec ->> 'slug',
    _rec ->> 'email',
    _rec ->> 'key',
    _rec ->> 'id'
  );

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