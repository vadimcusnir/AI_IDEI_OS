
-- ═══════════════════════════════════════════
-- I18N ENFORCEMENT LAYER — Core translations table
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'ui',
  language text NOT NULL CHECK (language IN ('en', 'ro', 'ru')),
  content text NOT NULL DEFAULT '',
  title text,
  version integer NOT NULL DEFAULT 1,
  is_auto_translated boolean NOT NULL DEFAULT false,
  source_language text,
  semantic_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, language)
);

-- Index for fast lookups
CREATE INDEX idx_translations_entity ON public.translations(entity_id);
CREATE INDEX idx_translations_type_lang ON public.translations(entity_type, language);

-- RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read translations"
ON public.translations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert translations"
ON public.translations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update translations"
ON public.translations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════
-- Validation function: check all 3 languages exist
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_translation_completeness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _lang_count integer;
BEGIN
  SELECT COUNT(DISTINCT language) INTO _lang_count
  FROM translations WHERE entity_id = NEW.entity_id;
  
  -- We don't block inserts (translations are added one by one),
  -- but we log incomplete translations for monitoring
  IF _lang_count < 3 THEN
    INSERT INTO compliance_log (actor_id, action_type, target_type, target_id, description, severity)
    VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'),
      'i18n_incomplete',
      'translation',
      NEW.entity_id::text,
      'Translation incomplete: ' || _lang_count || '/3 languages for entity ' || NEW.entity_id,
      'warning'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_translation_completeness
AFTER INSERT OR UPDATE ON public.translations
FOR EACH ROW EXECUTE FUNCTION public.check_translation_completeness();

-- ═══════════════════════════════════════════
-- Auto-increment version on content change
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.translation_version_bump()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.version := OLD.version + 1;
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_translation_version_bump
BEFORE UPDATE ON public.translations
FOR EACH ROW EXECUTE FUNCTION public.translation_version_bump();

-- ═══════════════════════════════════════════
-- I18N coverage monitoring function
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.i18n_coverage_report()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_entities', (SELECT COUNT(DISTINCT entity_id) FROM translations),
    'fully_translated', (
      SELECT COUNT(*) FROM (
        SELECT entity_id FROM translations GROUP BY entity_id HAVING COUNT(DISTINCT language) = 3
      ) sub
    ),
    'missing_translations', (
      SELECT COUNT(*) FROM (
        SELECT entity_id FROM translations GROUP BY entity_id HAVING COUNT(DISTINCT language) < 3
      ) sub
    ),
    'coverage_by_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT entity_type,
          COUNT(DISTINCT entity_id) as total_entities,
          COUNT(DISTINCT CASE WHEN language = 'en' THEN entity_id END) as en_count,
          COUNT(DISTINCT CASE WHEN language = 'ro' THEN entity_id END) as ro_count,
          COUNT(DISTINCT CASE WHEN language = 'ru' THEN entity_id END) as ru_count
        FROM translations GROUP BY entity_type
      ) t
    ),
    'auto_translated_pct', (
      SELECT ROUND(COUNT(*) FILTER (WHERE is_auto_translated) * 100.0 / GREATEST(1, COUNT(*)), 1) FROM translations
    ),
    'last_updated', (SELECT MAX(updated_at) FROM translations)
  ) INTO _result;
  
  RETURN _result;
END;
$$;
