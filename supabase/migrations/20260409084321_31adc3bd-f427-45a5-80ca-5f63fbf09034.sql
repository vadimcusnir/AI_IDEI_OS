
-- Populate related_post_ids for posts missing them (same-category matching)
UPDATE blog_posts AS target
SET related_post_ids = (
  SELECT COALESCE(array_agg(related.id ORDER BY related.published_at DESC), '{}')
  FROM (
    SELECT id, published_at
    FROM blog_posts
    WHERE status = 'published'
      AND category = target.category
      AND id != target.id
    ORDER BY published_at DESC
    LIMIT 3
  ) related
)
WHERE status = 'published'
  AND (related_post_ids IS NULL OR related_post_ids = '{}');

-- Also fill ai-strategy and digital-economics posts that have 0 same-category peers
-- by linking to knowledge-extraction posts as fallback
UPDATE blog_posts AS target
SET related_post_ids = (
  SELECT COALESCE(array_agg(related.id ORDER BY related.published_at DESC), '{}')
  FROM (
    SELECT id, published_at
    FROM blog_posts
    WHERE status = 'published'
      AND id != target.id
    ORDER BY published_at DESC
    LIMIT 3
  ) related
)
WHERE status = 'published'
  AND (related_post_ids IS NULL OR related_post_ids = '{}');
