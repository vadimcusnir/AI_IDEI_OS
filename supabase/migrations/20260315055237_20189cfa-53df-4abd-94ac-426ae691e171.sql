
-- Function for KB learning path stats (fixed column reference)
CREATE OR REPLACE FUNCTION public.kb_dashboard_stats(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_articles', (SELECT COUNT(*) FROM knowledge_items WHERE status = 'published'),
    'total_categories', (SELECT COUNT(DISTINCT category) FROM knowledge_items WHERE status = 'published'),
    'total_views', (SELECT COALESCE(SUM(view_count), 0) FROM knowledge_items WHERE status = 'published'),
    'articles_read', (SELECT COUNT(DISTINCT article_id) FROM kb_analytics WHERE user_id = _user_id AND event_type = 'view'),
    'paths_started', (SELECT COUNT(*) FROM learning_path_progress WHERE user_id = _user_id),
    'paths_completed', (SELECT COUNT(*) FROM learning_path_progress WHERE user_id = _user_id AND completed_at IS NOT NULL),
    'learning_paths', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT lp.id, lp.title, lp.slug, lp.description, lp.difficulty, lp.estimated_hours,
          (SELECT COUNT(*) FROM learning_path_items WHERE path_id = lp.id) as total_items,
          (SELECT array_length(completed_items, 1) FROM learning_path_progress WHERE path_id = lp.id AND user_id = _user_id) as completed_items
        FROM learning_paths lp WHERE lp.is_published = true ORDER BY lp.position
      ) t
    )
  ) INTO _result;
  RETURN _result;
END;
$$;

-- Function for data pipeline extended stats
CREATE OR REPLACE FUNCTION public.data_pipeline_stats()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN jsonb_build_object(
    'total_units', (SELECT COUNT(*) FROM cognitive_units),
    'validated_units', (SELECT COUNT(*) FROM cognitive_units WHERE is_validated = true),
    'llm_ready_units', (SELECT COUNT(*) FROM cognitive_units WHERE llm_ready = true),
    'avg_quality', (SELECT COALESCE(AVG(quality_score), 0) FROM cognitive_units),
    'avg_confidence', (SELECT COALESCE(AVG(confidence), 0) FROM cognitive_units),
    'categories', (SELECT COUNT(*) FROM cognitive_categories WHERE is_active = true),
    'datasets', (SELECT COUNT(*) FROM training_datasets),
    'total_samples', (SELECT COUNT(*) FROM training_samples),
    'validated_samples', (SELECT COUNT(*) FROM training_samples WHERE is_validated = true),
    'by_type', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT unit_type, COUNT(*) as count, AVG(quality_score) as avg_quality
        FROM cognitive_units GROUP BY unit_type ORDER BY count DESC
      ) t
    ),
    'recent_runs', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
        SELECT id, source_type, status, units_extracted, units_validated, created_at
        FROM collection_runs ORDER BY created_at DESC LIMIT 10
      ) t
    )
  );
END;
$$;
