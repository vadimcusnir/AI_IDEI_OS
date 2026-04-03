
-- T9.2: Release Gate — automated validation function
CREATE OR REPLACE FUNCTION public.validate_service_release(p_service_unit_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit RECORD;
  v_prompt RECORD;
  v_dup_count INT;
  v_atomicity BOOLEAN;
  v_dedup BOOLEAN;
  v_schema BOOLEAN;
  v_monetization BOOLEAN;
  v_root2 BOOLEAN;
  v_score_ok BOOLEAN;
  v_total_score NUMERIC;
  v_neurons_cost INT;
  v_digit_root INT;
  v_all_pass BOOLEAN;
BEGIN
  -- Load service unit
  SELECT * INTO v_unit FROM service_units WHERE id = p_service_unit_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Service unit not found');
  END IF;

  -- 1. Atomicity check
  v_atomicity := (
    v_unit.single_output IS NOT NULL AND v_unit.single_output != '' AND
    v_unit.single_function IS NOT NULL AND v_unit.single_function != '' AND
    v_unit.single_decision IS NOT NULL AND v_unit.single_decision != ''
  );

  -- 2. Deduplication check
  SELECT COUNT(*) INTO v_dup_count
  FROM service_units
  WHERE name = v_unit.name AND id != p_service_unit_id AND status = 'active';
  v_dedup := (v_dup_count = 0);

  -- 3. Schema check (prompt_vault entry exists)
  SELECT * INTO v_prompt FROM prompt_vault WHERE service_unit_id = p_service_unit_id LIMIT 1;
  v_schema := (v_prompt IS NOT NULL AND v_prompt.input_schema IS NOT NULL AND v_prompt.output_schema IS NOT NULL);

  -- 4. Monetization check
  v_neurons_cost := COALESCE((v_unit.cost_json->>'neurons_cost')::INT, 0);
  v_monetization := (v_neurons_cost > 0);

  -- 5. Root2 check (digit sum = 2)
  IF v_neurons_cost > 0 THEN
    v_digit_root := 0;
    DECLARE
      v_temp INT := v_neurons_cost;
    BEGIN
      WHILE v_temp > 0 LOOP
        v_digit_root := v_digit_root + (v_temp % 10);
        v_temp := v_temp / 10;
      END LOOP;
      -- Reduce to single digit
      WHILE v_digit_root > 9 LOOP
        DECLARE
          v_temp2 INT := v_digit_root;
          v_sum INT := 0;
        BEGIN
          WHILE v_temp2 > 0 LOOP
            v_sum := v_sum + (v_temp2 % 10);
            v_temp2 := v_temp2 / 10;
          END LOOP;
          v_digit_root := v_sum;
        END;
      END LOOP;
    END;
    v_root2 := (v_digit_root = 2);
  ELSE
    v_root2 := FALSE;
  END IF;

  -- 6. Score check (total_score from score_json)
  v_total_score := COALESCE((v_unit.score_json->>'total_score')::NUMERIC, 0);
  v_score_ok := (v_total_score >= 0.65);

  -- All pass?
  v_all_pass := v_atomicity AND v_dedup AND v_schema AND v_monetization AND v_root2 AND v_score_ok;

  -- Log to service_release_log
  INSERT INTO service_release_log (
    service_unit_id, atomicity_check, duplication_check, schema_check,
    monetization_check, root2_check, total_score, approval_status
  ) VALUES (
    p_service_unit_id, v_atomicity, v_dedup, v_schema,
    v_monetization, v_root2, v_total_score,
    CASE WHEN v_all_pass THEN 'approved' ELSE 'rejected' END
  );

  RETURN jsonb_build_object(
    'service_unit_id', p_service_unit_id,
    'atomicity', v_atomicity,
    'deduplication', v_dedup,
    'schema', v_schema,
    'monetization', v_monetization,
    'root2', v_root2,
    'score_ok', v_score_ok,
    'total_score', v_total_score,
    'all_pass', v_all_pass,
    'approval_status', CASE WHEN v_all_pass THEN 'approved' ELSE 'rejected' END
  );
END;
$$;

-- T9.3: i18n coverage check function
CREATE OR REPLACE FUNCTION public.check_i18n_coverage(p_service_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_en_exists BOOLEAN;
  v_ro_exists BOOLEAN;
  v_ru_exists BOOLEAN;
  v_all_covered BOOLEAN;
BEGIN
  -- Check i18n_translations table for EN/RO/RU coverage
  SELECT EXISTS(SELECT 1 FROM i18n_translations WHERE key LIKE '%' || p_service_key || '%' AND locale = 'en') INTO v_en_exists;
  SELECT EXISTS(SELECT 1 FROM i18n_translations WHERE key LIKE '%' || p_service_key || '%' AND locale = 'ro') INTO v_ro_exists;
  SELECT EXISTS(SELECT 1 FROM i18n_translations WHERE key LIKE '%' || p_service_key || '%' AND locale = 'ru') INTO v_ru_exists;

  v_all_covered := v_en_exists AND v_ro_exists AND v_ru_exists;

  RETURN jsonb_build_object(
    'service_key', p_service_key,
    'en', v_en_exists,
    'ro', v_ro_exists,
    'ru', v_ru_exists,
    'all_covered', v_all_covered
  );
END;
$$;
