
CREATE OR REPLACE FUNCTION public.compute_idearank()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  d FLOAT := 0.85;
  total_entities INT;
  iteration INT;
  max_iterations INT := 30;
  -- PVS MVP weights
  w_activation FLOAT := 0.30;
  w_growth FLOAT := 0.20;
  w_centrality FLOAT := 0.20;
  w_authority FLOAT := 0.15;
  w_economic FLOAT := 0.15;
  -- Emergence weights
  ew_novelty FLOAT := 0.25;
  ew_acceleration FLOAT := 0.20;
  ew_connectivity FLOAT := 0.15;
  ew_centrality_delta FLOAT := 0.15;
  ew_authority FLOAT := 0.15;
  ew_economic FLOAT := 0.10;
  -- Emergence threshold (percentile 95 approximation)
  emergence_threshold FLOAT;
BEGIN
  SELECT COUNT(*) INTO total_entities FROM entities WHERE is_published = true;
  IF total_entities = 0 THEN RETURN; END IF;

  -- ═══════════════════════════════════════════
  -- PHASE 0: Snapshot previous state for deltas
  -- ═══════════════════════════════════════════
  INSERT INTO idea_metrics (node_id)
    SELECT id FROM entities WHERE is_published = true
  ON CONFLICT (node_id) DO NOTHING;

  DELETE FROM idea_metrics WHERE node_id NOT IN (SELECT id FROM entities WHERE is_published = true);

  -- Save previous values for delta computation
  UPDATE idea_metrics SET
    previous_pagerank = pagerank_score,
    previous_activation = activation_score,
    previous_degree = COALESCE((
      SELECT COUNT(*) FROM entity_relations 
      WHERE source_entity_id = idea_metrics.node_id OR target_entity_id = idea_metrics.node_id
    ), 0);

  -- ═══════════════════════════════════════════
  -- PHASE 1: PageRank (Centrality component)
  -- ═══════════════════════════════════════════
  UPDATE entities SET idea_rank = 1.0 / total_entities WHERE is_published = true;

  FOR iteration IN 1..max_iterations LOOP
    UPDATE entities e SET idea_rank = (1.0 - d) / total_entities + d * COALESCE((
      SELECT SUM(
        src.idea_rank * 
        CASE r.relation_type
          WHEN 'DERIVED_FROM' THEN 1.0
          WHEN 'SUPPORTS' THEN 0.8
          WHEN 'EXTENDS' THEN 0.7
          WHEN 'APPLIES_TO' THEN 0.6
          WHEN 'REFERENCES' THEN 0.5
          WHEN 'MENTIONS' THEN 0.4
          WHEN 'INSPIRES' THEN 0.7
          WHEN 'CONTRADICTS' THEN 0.3
          WHEN 'RELATES_TO' THEN 0.5
          WHEN 'PART_OF' THEN 0.6
          ELSE 0.5
        END
        / GREATEST(1, (SELECT COUNT(*) FROM entity_relations WHERE source_entity_id = r.source_entity_id))
      )
      FROM entity_relations r
      JOIN entities src ON src.id = r.source_entity_id AND src.is_published = true
      WHERE r.target_entity_id = e.id
    ), 0)
    WHERE e.is_published = true;
  END LOOP;

  -- ═══════════════════════════════════════════
  -- PHASE 2: Compute per-node metrics
  -- ═══════════════════════════════════════════

  -- ACTIVATION
  UPDATE idea_metrics m SET activation_score = LEAST(1.0,
    e.idea_rank * total_entities
    * LN(1 + COALESCE(e.evidence_count, 0) + 1)
    * GREATEST(0.1, COALESCE(e.confidence_score, 0.5))
  )
  FROM entities e WHERE e.id = m.node_id AND e.is_published = true;

  UPDATE idea_metrics SET activation_score = activation_score / GREATEST(0.001,
    (SELECT MAX(activation_score) FROM idea_metrics));

  -- PAGERANK normalized
  UPDATE idea_metrics m SET pagerank_score = e.idea_rank * total_entities
  FROM entities e WHERE e.id = m.node_id;
  UPDATE idea_metrics SET pagerank_score = pagerank_score / GREATEST(0.001,
    (SELECT MAX(pagerank_score) FROM idea_metrics));

  -- BETWEENNESS approximation
  UPDATE idea_metrics m SET betweenness_score = LEAST(1.0,
    (SELECT COUNT(*) FROM entity_relations WHERE target_entity_id = m.node_id)::float
    * (SELECT COUNT(*) FROM entity_relations WHERE source_entity_id = m.node_id)::float
    / GREATEST(1, total_entities)
  );

  -- MULTI-HOP INFLUENCE
  UPDATE idea_metrics m SET multi_hop_influence = LEAST(1.0,
    (SELECT COUNT(DISTINCT r2.target_entity_id)
     FROM entity_relations r1
     JOIN entity_relations r2 ON r2.source_entity_id = r1.target_entity_id
     WHERE r1.source_entity_id = m.node_id
    )::float / GREATEST(1, total_entities)
  );

  -- AUTHORITY
  UPDATE idea_metrics m SET authority_score = LEAST(1.0,
    GREATEST(0.1, COALESCE(e.confidence_score, 0.5))
    * LN(1 + COALESCE(e.evidence_count, 0) + 1) / 5.0
  )
  FROM entities e WHERE e.id = m.node_id;

  -- ECONOMIC CONVERSION
  UPDATE idea_metrics m SET economic_conversion_score = LEAST(1.0,
    LN(1 + COALESCE(e.reuse_count, 0) + 1) / 5.0
  )
  FROM entities e WHERE e.id = m.node_id;

  -- GROWTH = delta activation
  UPDATE idea_metrics SET growth_score = LEAST(1.0, GREATEST(0,
    activation_score - previous_activation
  ));

  -- ACCELERATION = delta growth (growth of growth)
  UPDATE idea_metrics SET acceleration_score = LEAST(1.0, GREATEST(0,
    growth_score - GREATEST(0, previous_activation - 0) -- approximation for first runs
  ));

  -- NOVELTY = inverse density in relation space
  UPDATE idea_metrics m SET novelty_score = GREATEST(0, 1.0 - LEAST(1.0,
    (SELECT COUNT(*) FROM entity_relations WHERE source_entity_id = m.node_id OR target_entity_id = m.node_id)::float
    / GREATEST(1, (SELECT AVG(cnt) FROM (SELECT COUNT(*) as cnt FROM entity_relations GROUP BY source_entity_id) sub))
  ));

  -- DECAY RISK
  UPDATE idea_metrics m SET decay_risk_score = LEAST(1.0,
    (1.0 - LEAST(1.0, COALESCE(e.evidence_count, 0)::float / 5.0)) * 0.4
    + (1.0 - LEAST(1.0, COALESCE(e.reuse_count, 0)::float / 5.0)) * 0.3
    + LEAST(1.0, EXTRACT(EPOCH FROM (now() - COALESCE(e.updated_at, e.created_at))) / (86400 * 90)) * 0.3
  )
  FROM entities e WHERE e.id = m.node_id;

  -- ═══════════════════════════════════════════
  -- PHASE 3: PVS MVP Formula
  -- ═══════════════════════════════════════════
  UPDATE idea_metrics SET propagation_value_score =
    w_activation * activation_score
    + w_growth * growth_score
    + w_centrality * (0.5 * pagerank_score + 0.3 * betweenness_score + 0.2 * multi_hop_influence)
    + w_authority * authority_score
    + w_economic * economic_conversion_score;

  -- AMPLIFICATION PROBABILITY (sigmoid)
  UPDATE idea_metrics SET amplification_probability =
    1.0 / (1.0 + EXP(-10.0 * (propagation_value_score - 0.5)));

  -- ═══════════════════════════════════════════
  -- PHASE 4: Emergence Detection Engine
  -- ═══════════════════════════════════════════

  -- CONNECTIVITY GROWTH = current degree - previous degree
  UPDATE idea_metrics m SET connectivity_growth = GREATEST(0,
    (SELECT COUNT(*) FROM entity_relations
     WHERE source_entity_id = m.node_id OR target_entity_id = m.node_id
    ) - m.previous_degree
  )::float / GREATEST(1, total_entities::float / 10.0);

  -- CENTRALITY DELTA = current pagerank - previous pagerank
  UPDATE idea_metrics SET centrality_delta = GREATEST(0,
    pagerank_score - previous_pagerank
  );

  -- STRUCTURAL RARITY = 1 / frequency of entity's insight_family cluster
  UPDATE idea_metrics m SET structural_rarity = LEAST(1.0,
    1.0 / GREATEST(1, (
      SELECT COUNT(*) FROM entities e2
      WHERE e2.is_published = true
        AND e2.insight_family = (SELECT insight_family FROM entities WHERE id = m.node_id)
        AND e2.insight_family IS NOT NULL
    ))::float * 10.0
  );

  -- For nodes without insight_family, use entity_type rarity
  UPDATE idea_metrics m SET structural_rarity = LEAST(1.0,
    1.0 / GREATEST(1, (
      SELECT COUNT(*) FROM entities e2
      WHERE e2.is_published = true
        AND e2.entity_type = (SELECT entity_type FROM entities WHERE id = m.node_id)
    ))::float * 10.0
  )
  WHERE structural_rarity = 0;

  -- EMERGENCE SCORE
  -- EmergenceScore = 0.25·Novelty + 0.20·Acceleration + 0.15·ConnectivityGrowth
  --                + 0.15·CentralityDelta + 0.15·Authority + 0.10·EconomicSignal
  UPDATE idea_metrics SET emergence_score =
    ew_novelty * novelty_score
    + ew_acceleration * acceleration_score
    + ew_connectivity * LEAST(1.0, connectivity_growth)
    + ew_centrality_delta * LEAST(1.0, centrality_delta * 10.0)
    + ew_authority * authority_score
    + ew_economic * economic_conversion_score;

  -- Determine emergence threshold (p95)
  SELECT COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY emergence_score), 0.5)
    INTO emergence_threshold
    FROM idea_metrics;

  -- Flag emerging ideas
  UPDATE idea_metrics SET is_emerging = (emergence_score >= emergence_threshold);

  -- Update metadata
  UPDATE idea_metrics SET model_version = 'pvs-emergence-v1', computed_at = now();

  -- ═══════════════════════════════════════════
  -- PHASE 5: Write back to entities
  -- ═══════════════════════════════════════════
  UPDATE entities e SET importance_score = m.propagation_value_score * 100.0
  FROM idea_metrics m WHERE m.node_id = e.id;

END;
$function$;
