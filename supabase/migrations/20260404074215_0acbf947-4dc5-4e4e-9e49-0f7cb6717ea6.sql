
-- §32: Eligibility Engine
CREATE OR REPLACE FUNCTION public.check_profile_eligibility(
  _user_id uuid,
  _episode_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  neuron_count integer;
  signal_density numeric;
  avg_confidence numeric;
  eligible boolean;
  reason text;
BEGIN
  -- Count neurons for this episode or all user neurons
  IF _episode_id IS NOT NULL THEN
    SELECT count(*), coalesce(avg(score), 0)
    INTO neuron_count, avg_confidence
    FROM neurons
    WHERE author_id = _user_id AND episode_id = _episode_id;
  ELSE
    SELECT count(*), coalesce(avg(score), 0)
    INTO neuron_count, avg_confidence
    FROM neurons
    WHERE author_id = _user_id;
  END IF;

  -- Normalize confidence to 0-1
  avg_confidence := least(avg_confidence / 100.0, 1.0);

  -- Signal density = neuron_count / 50 (target density)
  signal_density := least(neuron_count::numeric / 50.0, 1.0);

  -- Check thresholds
  IF neuron_count < 25 THEN
    eligible := false;
    reason := format('Insufficient neurons: %s/25 required', neuron_count);
  ELSIF signal_density < 0.3 THEN
    eligible := false;
    reason := format('Low signal density: %s (min 0.3)', round(signal_density, 2));
  ELSIF avg_confidence < 0.7 THEN
    eligible := false;
    reason := format('Low confidence score: %s (min 0.7)', round(avg_confidence, 2));
  ELSE
    eligible := true;
    reason := 'Eligible for profile generation';
  END IF;

  RETURN jsonb_build_object(
    'eligible', eligible,
    'reason', reason,
    'neuron_count', neuron_count,
    'signal_density', round(signal_density, 2),
    'avg_confidence', round(avg_confidence, 2),
    'episode_id', _episode_id
  );
END;
$$;

-- §42/§64: Profile Management RPCs

-- Approve profile → published
CREATE OR REPLACE FUNCTION public.approve_profile(
  _profile_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT visibility_status INTO current_status
  FROM intelligence_profiles WHERE id = _profile_id;

  IF current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF current_status NOT IN ('draft', 'pending_user') THEN
    RETURN jsonb_build_object('success', false, 'error', format('Cannot approve from status: %s', current_status));
  END IF;

  UPDATE intelligence_profiles
  SET visibility_status = 'published', updated_at = now()
  WHERE id = _profile_id;

  INSERT INTO intelligence_profile_state_transitions (profile_id, from_status, to_status, triggered_by, reason_code)
  VALUES (_profile_id, current_status, 'published', _user_id, 'USER_APPROVED');

  INSERT INTO profile_audit_log (profile_id, action, actor, details)
  VALUES (_profile_id, 'approved', _user_id, jsonb_build_object('from_status', current_status));

  RETURN jsonb_build_object('success', true, 'new_status', 'published');
END;
$$;

-- Reject/block profile
CREATE OR REPLACE FUNCTION public.reject_profile(
  _profile_id uuid,
  _user_id uuid,
  _reason text DEFAULT 'User rejected'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT visibility_status INTO current_status
  FROM intelligence_profiles WHERE id = _profile_id;

  IF current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  UPDATE intelligence_profiles
  SET visibility_status = 'blocked', updated_at = now()
  WHERE id = _profile_id;

  INSERT INTO intelligence_profile_state_transitions (profile_id, from_status, to_status, triggered_by, reason_code)
  VALUES (_profile_id, current_status, 'blocked', _user_id, 'USER_REJECTED');

  INSERT INTO profile_audit_log (profile_id, action, actor, details)
  VALUES (_profile_id, 'rejected', _user_id, jsonb_build_object('reason', _reason));

  RETURN jsonb_build_object('success', true, 'new_status', 'blocked');
END;
$$;

-- Rollback profile to previous version
CREATE OR REPLACE FUNCTION public.rollback_profile(
  _profile_id uuid,
  _target_version integer,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  snapshot jsonb;
  current_ver integer;
BEGIN
  SELECT data_snapshot INTO snapshot
  FROM profile_versions
  WHERE profile_id = _profile_id AND version = _target_version;

  IF snapshot IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Version not found');
  END IF;

  SELECT coalesce(max(version), 0) INTO current_ver
  FROM profile_versions WHERE profile_id = _profile_id;

  -- Create new version with rollback data
  INSERT INTO profile_versions (profile_id, version, data_snapshot, change_summary, created_by)
  VALUES (_profile_id, current_ver + 1, snapshot, format('Rollback to v%s', _target_version), _user_id);

  -- Update profile fields from snapshot
  UPDATE intelligence_profiles SET
    extracted_indicators = coalesce((snapshot->>'indicators')::jsonb, extracted_indicators),
    cognitive_patterns = coalesce((snapshot->>'patterns')::jsonb, cognitive_patterns),
    synthesis_text = coalesce(snapshot->>'summary', synthesis_text),
    updated_at = now()
  WHERE id = _profile_id;

  INSERT INTO profile_audit_log (profile_id, action, actor, details)
  VALUES (_profile_id, 'rollback', _user_id, jsonb_build_object('to_version', _target_version, 'new_version', current_ver + 1));

  RETURN jsonb_build_object('success', true, 'new_version', current_ver + 1);
END;
$$;

-- Reprocess profile (mark for re-generation)
CREATE OR REPLACE FUNCTION public.reprocess_profile(
  _profile_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
BEGIN
  SELECT visibility_status INTO current_status
  FROM intelligence_profiles WHERE id = _profile_id;

  IF current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  UPDATE intelligence_profiles
  SET visibility_status = 'draft', updated_at = now()
  WHERE id = _profile_id;

  INSERT INTO intelligence_profile_state_transitions (profile_id, from_status, to_status, triggered_by, reason_code)
  VALUES (_profile_id, current_status, 'draft', _user_id, 'REPROCESS_REQUESTED');

  INSERT INTO profile_audit_log (profile_id, action, actor, details)
  VALUES (_profile_id, 'reprocess_requested', _user_id, jsonb_build_object('from_status', current_status));

  -- Create a new job for reprocessing
  INSERT INTO profile_jobs (profile_id, user_id, job_type, status, input_params)
  VALUES (_profile_id, _user_id, 'reprocess', 'created', jsonb_build_object('reason', 'manual_reprocess'));

  RETURN jsonb_build_object('success', true, 'status', 'queued_for_reprocess');
END;
$$;

-- §39: Trust Score Computation
CREATE OR REPLACE FUNCTION public.compute_profile_trust(
  _profile_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scores record;
  trust_level text;
  trust_score numeric;
BEGIN
  SELECT * INTO scores FROM profile_scores WHERE profile_id = _profile_id;

  IF scores IS NULL THEN
    RETURN jsonb_build_object('trust_level', 'UNKNOWN', 'trust_score', 0);
  END IF;

  trust_score := (
    coalesce(scores.data_volume, 0) * 0.25 +
    coalesce(scores.consistency, 0) * 0.30 +
    coalesce(scores.validation_score, 0) * 0.25 +
    coalesce(scores.prediction_accuracy, 0) * 0.20
  );

  IF trust_score >= 0.7 THEN
    trust_level := 'HIGH';
  ELSIF trust_score >= 0.4 THEN
    trust_level := 'MEDIUM';
  ELSE
    trust_level := 'LOW';
  END IF;

  UPDATE profile_scores SET overall = trust_score WHERE profile_id = _profile_id;

  RETURN jsonb_build_object(
    'trust_level', trust_level,
    'trust_score', round(trust_score, 3),
    'components', jsonb_build_object(
      'data_volume', round(coalesce(scores.data_volume, 0)::numeric, 3),
      'consistency', round(coalesce(scores.consistency, 0)::numeric, 3),
      'validation', round(coalesce(scores.validation_score, 0)::numeric, 3),
      'prediction', round(coalesce(scores.prediction_accuracy, 0)::numeric, 3)
    )
  );
END;
$$;
