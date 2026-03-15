-- Performance indexes for forum, gamification, and high-traffic tables

-- Forum: threads sorted by activity
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_activity ON public.forum_threads (category_id, last_activity_at DESC);

-- Forum: flags by status for admin moderation
CREATE INDEX IF NOT EXISTS idx_forum_flags_status ON public.forum_flags (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_flags_target ON public.forum_flags (target_type, target_id);

-- Forum: posts sorted by creation (thread view)
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread_created ON public.forum_posts (thread_id, created_at ASC);

-- Gamification: challenge progress lookup
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON public.challenge_progress (user_id, completed);

-- Team challenges: contributions lookup
CREATE INDEX IF NOT EXISTS idx_team_contrib_challenge ON public.team_challenge_contributions (challenge_id);
CREATE INDEX IF NOT EXISTS idx_team_contrib_user ON public.team_challenge_contributions (user_id);

-- Notifications: user + unread for bell count  
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

-- Knowledge assets: marketplace browsing
CREATE INDEX IF NOT EXISTS idx_knowledge_assets_published ON public.knowledge_assets (is_published, asset_type, created_at DESC) WHERE is_published = true;

-- Asset transactions: buyer/seller lookups
CREATE INDEX IF NOT EXISTS idx_asset_tx_buyer ON public.asset_transactions (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_tx_seller ON public.asset_transactions (seller_id, created_at DESC);

-- User karma: leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_user_karma_karma ON public.user_karma (karma DESC);

-- XP: leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_user_xp_level ON public.user_xp (level DESC, total_xp DESC);

-- Entities: type + published for listing pages
CREATE INDEX IF NOT EXISTS idx_entities_type_published ON public.entities (entity_type, is_published) WHERE is_published = true;

-- Entity relations: graph traversal
CREATE INDEX IF NOT EXISTS idx_entity_relations_target ON public.entity_relations (target_entity_id, relation_type);

-- Artifacts: job lookup for pipeline
CREATE INDEX IF NOT EXISTS idx_artifacts_job ON public.artifacts (job_id) WHERE job_id IS NOT NULL;