
-- Function to auto-log changes to changes_raw
CREATE OR REPLACE FUNCTION public.auto_log_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _diff text;
  _component text;
BEGIN
  _component := TG_TABLE_NAME;
  
  IF TG_OP = 'INSERT' THEN
    _diff := 'New ' || _component || ': ' || COALESCE(NEW.title, NEW.name, NEW.id::text);
  ELSIF TG_OP = 'UPDATE' THEN
    _diff := 'Updated ' || _component || ': ' || COALESCE(NEW.title, NEW.name, NEW.id::text);
  ELSIF TG_OP = 'DELETE' THEN
    _diff := 'Removed ' || _component || ': ' || COALESCE(OLD.title, OLD.name, OLD.id::text);
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
$$;

-- Triggers on key user-facing tables
CREATE TRIGGER trg_changelog_entities
  AFTER INSERT ON public.entities
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_change();

CREATE TRIGGER trg_changelog_knowledge_assets
  AFTER INSERT OR UPDATE ON public.knowledge_assets
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_change();

CREATE TRIGGER trg_changelog_artifacts
  AFTER INSERT ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_change();

CREATE TRIGGER trg_changelog_episodes
  AFTER INSERT ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_change();

CREATE TRIGGER trg_changelog_neurons
  AFTER INSERT ON public.neurons
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_change();
