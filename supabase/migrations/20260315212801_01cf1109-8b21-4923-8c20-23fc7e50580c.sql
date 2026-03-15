
-- Secure RPC to get public profile + stats without exposing user_id
CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _profile RECORD;
  _neurons jsonb;
  _neuron_count integer;
BEGIN
  SELECT display_name, bio, avatar_url, username, created_at, user_id
  INTO _profile
  FROM profiles
  WHERE username = _username;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Count public neurons
  SELECT COUNT(*) INTO _neuron_count
  FROM neurons WHERE author_id = _profile.user_id AND visibility = 'public';

  -- Get top 12 public neurons (no author_id exposed)
  SELECT COALESCE(jsonb_agg(row_to_json(n)), '[]'::jsonb) INTO _neurons
  FROM (
    SELECT id, number, title, status, lifecycle, content_category, created_at, score
    FROM neurons
    WHERE author_id = _profile.user_id AND visibility = 'public'
    ORDER BY score DESC NULLS LAST
    LIMIT 12
  ) n;

  RETURN jsonb_build_object(
    'found', true,
    'display_name', _profile.display_name,
    'bio', _profile.bio,
    'avatar_url', _profile.avatar_url,
    'username', _profile.username,
    'created_at', _profile.created_at,
    'neurons_count', _neuron_count,
    'public_neurons', _neurons
  );
END;
$$;
