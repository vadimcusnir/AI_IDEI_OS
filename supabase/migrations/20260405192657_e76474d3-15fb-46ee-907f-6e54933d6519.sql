-- 1. PSYCHOLOGICAL PROFILES: Restrict anon read to authenticated only
DROP POLICY IF EXISTS "Anyone can read psycho profiles of public guests" ON psychological_profiles;
CREATE POLICY "Authenticated can read psycho profiles of public guests"
  ON psychological_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM guest_profiles gp
    WHERE gp.id = psychological_profiles.guest_profile_id AND gp.is_public = true
  ));

-- 2. USER_INTEGRATIONS: Create safe view hiding auth_tokens
CREATE OR REPLACE VIEW public.user_integrations_safe AS
SELECT id, user_id, connector_id, status, settings, documents_imported,
       neurons_generated, last_sync_at, next_sync_at, sync_interval_hours,
       error_message, created_at, updated_at
FROM user_integrations;

-- 3. LEADERBOARD VIEWS: Expose only minimal columns
-- XP leaderboard
CREATE OR REPLACE VIEW public.leaderboard_xp AS
SELECT user_id, total_xp, level, rank_name
FROM user_xp;

-- Karma leaderboard
CREATE OR REPLACE VIEW public.leaderboard_karma AS
SELECT user_id, karma
FROM user_karma;

-- Streaks leaderboard
CREATE OR REPLACE VIEW public.leaderboard_streaks AS
SELECT user_id, current_streak, longest_streak
FROM user_streaks;

-- 4. Drop overly broad SELECT policies on gamification tables
DROP POLICY IF EXISTS "Users can read others streak for leaderboard" ON user_streaks;
DROP POLICY IF EXISTS "Authenticated users can read karma" ON user_karma;
DROP POLICY IF EXISTS "Users can read others XP for leaderboard" ON user_xp;