
-- Drop and recreate record_daily_activity with correct return type
DROP FUNCTION IF EXISTS public.record_daily_activity(uuid);

CREATE OR REPLACE FUNCTION public.record_daily_activity(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _streak record; _days_gap integer;
BEGIN
  SELECT * INTO _streak FROM user_streaks WHERE user_id = _user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date) VALUES (_user_id, 1, 1, CURRENT_DATE);
    RETURN;
  END IF;
  IF _streak.last_active_date = CURRENT_DATE THEN RETURN; END IF;
  _days_gap := (CURRENT_DATE - COALESCE(_streak.last_active_date, CURRENT_DATE - 1))::integer;
  IF _days_gap = 1 THEN
    UPDATE user_streaks SET current_streak = current_streak + 1, longest_streak = GREATEST(longest_streak, current_streak + 1), last_active_date = CURRENT_DATE, grace_period_used = false, grace_expires_at = NULL WHERE user_id = _user_id;
  ELSIF _days_gap <= 3 AND NOT COALESCE(_streak.grace_period_used, false) THEN
    UPDATE user_streaks SET current_streak = current_streak + 1, longest_streak = GREATEST(longest_streak, current_streak + 1), last_active_date = CURRENT_DATE, grace_period_used = true, grace_expires_at = NULL WHERE user_id = _user_id;
  ELSIF _days_gap <= 3 AND COALESCE(_streak.freeze_tokens, 0) > 0 THEN
    UPDATE user_streaks SET current_streak = current_streak + 1, longest_streak = GREATEST(longest_streak, current_streak + 1), last_active_date = CURRENT_DATE, freeze_tokens = freeze_tokens - 1, grace_expires_at = NULL WHERE user_id = _user_id;
  ELSE
    UPDATE user_streaks SET current_streak = 1, last_active_date = CURRENT_DATE, grace_period_used = false, grace_expires_at = NULL WHERE user_id = _user_id;
  END IF;
END; $$;

-- 50+ achievements (the tables/columns from previous failed migrations should already exist)
INSERT INTO public.achievements_registry (id, name, name_ro, description, description_ro, icon, category, tier, xp_reward, requirements, hidden) VALUES
  ('first_extraction', 'First Extraction', 'Prima Extracție', 'Complete your first extraction', 'Prima extracție', '🧬', 'extraction', 'bronze', 25, '{"type":"count","target":"extractions","value":1}'::jsonb, false),
  ('extract_10', 'Knowledge Hunter', 'Vânător Cunoștințe', '10 extractions', '10 extracții', '🎯', 'extraction', 'bronze', 50, '{"type":"count","target":"extractions","value":10}'::jsonb, false),
  ('extract_50', 'Extraction Master', 'Maestru Extracție', '50 extractions', '50 extracții', '⚡', 'extraction', 'silver', 150, '{"type":"count","target":"extractions","value":50}'::jsonb, false),
  ('extract_100', 'Centurion', 'Centurionul', '100 extractions', '100 extracții', '🏆', 'extraction', 'gold', 500, '{"type":"count","target":"extractions","value":100}'::jsonb, false),
  ('first_neuron', 'First Neuron', 'Primul Neuron', 'First neuron', 'Primul neuron', '🧠', 'neurons', 'bronze', 25, '{"type":"count","target":"neurons","value":1}'::jsonb, false),
  ('neuron_10', 'Neural Network', 'Rețea Neuronală', '10 neurons', '10 neuroni', '🌐', 'neurons', 'bronze', 50, '{"type":"count","target":"neurons","value":10}'::jsonb, false),
  ('neuron_50', 'Synapse Builder', 'Constructor Sinapse', '50 neurons', '50 neuroni', '💡', 'neurons', 'silver', 150, '{"type":"count","target":"neurons","value":50}'::jsonb, false),
  ('neuron_100', 'Neural Architect', 'Arhitect Neural', '100 neurons', '100 neuroni', '🏗️', 'neurons', 'gold', 500, '{"type":"count","target":"neurons","value":100}'::jsonb, false),
  ('neuron_500', 'Neuron Legend', 'Legendă Neuroni', '500 neurons', '500 neuroni', '👑', 'neurons', 'platinum', 2000, '{"type":"count","target":"neurons","value":500}'::jsonb, false),
  ('first_service', 'Service Starter', 'Primul Serviciu', 'First service', 'Primul serviciu', '🚀', 'services', 'bronze', 25, '{"type":"count","target":"services","value":1}'::jsonb, false),
  ('service_10', 'Explorer', 'Explorator', '10 services', '10 servicii', '🔍', 'services', 'bronze', 50, '{"type":"count","target":"services","value":10}'::jsonb, false),
  ('service_50', 'Power User', 'Utilizator Avansat', '50 services', '50 servicii', '⚡', 'services', 'silver', 200, '{"type":"count","target":"services","value":50}'::jsonb, false),
  ('service_100', 'AI Maestro', 'Maestru AI', '100 services', '100 servicii', '🎭', 'services', 'gold', 500, '{"type":"count","target":"services","value":100}'::jsonb, false),
  ('try_5_services', 'Variety Seeker', 'Varietate', '5 different services', '5 servicii diferite', '🎲', 'services', 'bronze', 75, '{"type":"unique_count","target":"service_types","value":5}'::jsonb, false),
  ('streak_3', 'Three Day Streak', 'Streak 3 Zile', '3-day streak', '3 zile streak', '🔥', 'streaks', 'bronze', 30, '{"type":"streak","value":3}'::jsonb, false),
  ('streak_7', 'Weekly Warrior', 'Războinic Săptămânal', '7-day streak', '7 zile streak', '🔥', 'streaks', 'bronze', 75, '{"type":"streak","value":7}'::jsonb, false),
  ('streak_14', 'Two Week Titan', 'Titan 2 Săptămâni', '14-day streak', '14 zile streak', '🔥', 'streaks', 'silver', 150, '{"type":"streak","value":14}'::jsonb, false),
  ('streak_30', 'Monthly Master', 'Maestru Lunar', '30-day streak', '30 zile streak', '🔥', 'streaks', 'gold', 500, '{"type":"streak","value":30}'::jsonb, false),
  ('streak_90', 'Quarterly Legend', 'Legendă Trimestrială', '90-day streak', '90 zile streak', '🔥', 'streaks', 'platinum', 2000, '{"type":"streak","value":90}'::jsonb, true),
  ('first_topup', 'First Investment', 'Prima Investiție', 'First top-up', 'Primul top-up', '💰', 'economy', 'bronze', 50, '{"type":"event","target":"topup"}'::jsonb, false),
  ('spend_1000', 'Big Spender', 'Cheltuitor', '1000 NEURONS spent', '1000 NEURONI', '💸', 'economy', 'bronze', 75, '{"type":"total_spent","value":1000}'::jsonb, false),
  ('spend_5000', 'Whale', 'Balenă', '5000 NEURONS spent', '5000 NEURONI', '🐋', 'economy', 'silver', 200, '{"type":"total_spent","value":5000}'::jsonb, false),
  ('first_thread', 'Conversation Starter', 'Inițiator', 'First thread', 'Primul thread', '💬', 'community', 'bronze', 25, '{"type":"count","target":"threads","value":1}'::jsonb, false),
  ('first_reply', 'Helpful Hand', 'Mână Ajutor', 'First reply', 'Primul reply', '🤝', 'community', 'bronze', 15, '{"type":"count","target":"replies","value":1}'::jsonb, false),
  ('reply_50', 'Community Pillar', 'Stâlp Comunitate', '50 replies', '50 replies', '🏛️', 'community', 'silver', 200, '{"type":"count","target":"replies","value":50}'::jsonb, false),
  ('karma_100', 'Karma Master', 'Maestru Karma', '100 karma', '100 karma', '✨', 'community', 'silver', 150, '{"type":"karma","value":100}'::jsonb, false),
  ('first_artifact', 'First Creation', 'Prima Creație', 'First artifact', 'Primul artefact', '📄', 'content', 'bronze', 25, '{"type":"count","target":"artifacts","value":1}'::jsonb, false),
  ('artifact_25', 'Content Creator', 'Creator Conținut', '25 artifacts', '25 artefacte', '📚', 'content', 'bronze', 100, '{"type":"count","target":"artifacts","value":25}'::jsonb, false),
  ('artifact_100', 'Content Machine', 'Mașină Conținut', '100 artifacts', '100 artefacte', '🏭', 'content', 'silver', 300, '{"type":"count","target":"artifacts","value":100}'::jsonb, false),
  ('level_5', 'Rising Star', 'Stea', 'Level 5', 'Nivelul 5', '⭐', 'levels', 'bronze', 100, '{"type":"level","value":5}'::jsonb, false),
  ('level_10', 'Creator Elite', 'Elită', 'Level 10', 'Nivelul 10', '🌟', 'levels', 'silver', 250, '{"type":"level","value":10}'::jsonb, false),
  ('level_15', 'Master Mind', 'Minte Maestră', 'Level 15', 'Nivelul 15', '💎', 'levels', 'gold', 500, '{"type":"level","value":15}'::jsonb, false),
  ('level_20', 'Legendary', 'Legendar', 'Level 20', 'Nivelul 20', '🏆', 'levels', 'platinum', 2000, '{"type":"level","value":20}'::jsonb, true),
  ('first_transcript', 'First Transcript', 'Primul Transcript', 'First transcription', 'Prima transcriere', '🎙️', 'transcription', 'bronze', 25, '{"type":"count","target":"episodes","value":1}'::jsonb, false),
  ('transcript_10', 'Transcription Pro', 'Pro Transcriere', '10 transcriptions', '10 transcrieri', '🎤', 'transcription', 'bronze', 75, '{"type":"count","target":"episodes","value":10}'::jsonb, false),
  ('first_pipeline', 'Pipeline Pioneer', 'Pionier Pipeline', 'First pipeline', 'Primul pipeline', '🔄', 'pipeline', 'bronze', 50, '{"type":"count","target":"pipelines","value":1}'::jsonb, false),
  ('pipeline_full', 'Full Pipeline', 'Pipeline Complet', 'L0-L12 complete', 'L0-L12 complet', '🎆', 'pipeline', 'silver', 300, '{"type":"event","target":"full_pipeline"}'::jsonb, false),
  ('first_sale', 'First Sale', 'Prima Vânzare', 'First sale', 'Prima vânzare', '🛒', 'marketplace', 'silver', 200, '{"type":"count","target":"sales","value":1}'::jsonb, false),
  ('night_owl', 'Night Owl', 'Bufniță Noapte', 'Midnight jobs', 'Job-uri noaptea', '🦉', 'special', 'bronze', 50, '{"type":"time_range","start":0,"end":5,"count":5}'::jsonb, true),
  ('speed_demon', 'Speed Demon', 'Demon Viteză', '5 in 10min', '5 în 10min', '💨', 'special', 'silver', 150, '{"type":"speed_run","services":5,"minutes":10}'::jsonb, true),
  ('polyglot', 'Polyglot', 'Poliglot', '3 languages', '3 limbi', '🌍', 'special', 'silver', 200, '{"type":"unique_count","target":"languages","value":3}'::jsonb, true),
  ('early_adopter', 'Early Adopter', 'Adoptator Timpuriu', 'First 100', 'Primii 100', '🌱', 'special', 'gold', 500, '{"type":"user_rank","value":100}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;
