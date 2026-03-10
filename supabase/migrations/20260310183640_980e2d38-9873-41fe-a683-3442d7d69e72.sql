
-- Replace compute_idearank with PVS MVP model
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
BEGIN
  SELECT COUNT(*) INTO total_entities FROM entities WHERE is_published = true;
  IF total_entities = 0 THEN RETURN; END IF;

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
  
  -- Upsert idea_metrics for all published entities
  INSERT INTO idea_metrics (node_id)
    SELECT id FROM entities WHERE is_published = true
  ON CONFLICT (node_id) DO NOTHING;

  -- Delete orphaned metrics
  DELETE FROM idea_metrics WHERE node_id NOT IN (SELECT id FROM entities WHERE is_published = true);

  -- ACTIVATION = normalized idea_rank × evidence × confidence
  UPDATE idea_metrics m SET activation_score = LEAST(1.0,
    e.idea_rank * total_entities  -- denormalize PageRank
    * LN(1 + COALESCE(e.evidence_count, 0) + 1)
    * GREATEST(0.1, COALESCE(e.confidence_score, 0.5))
  )
  FROM entities e WHERE e.id = m.node_id AND e.is_published = true;

  -- Normalize activation to [0,1]
  UPDATE idea_metrics SET activation_score = activation_score / GREATEST(0.001,
    (SELECT MAX(activation_score) FROM idea_metrics));

  -- CENTRALITY = pagerank (already computed, normalize to [0,1])
  UPDATE idea_metrics m SET pagerank_score = e.idea_rank * total_entities
  FROM entities e WHERE e.id = m.node_id;

  UPDATE idea_metrics SET pagerank_score = pagerank_score / GREATEST(0.001,
    (SELECT MAX(pagerank_score) FROM idea_metrics));

  -- BETWEENNESS approximation = inDegree × outDegree / total possible
  UPDATE idea_metrics m SET betweenness_score = LEAST(1.0,
    (SELECT COUNT(*) FROM entity_relations WHERE target_entity_id = m.node_id)::float
    * (SELECT COUNT(*) FROM entity_relations WHERE source_entity_id = m.node_id)::float
    / GREATEST(1, total_entities)
  );

  -- MULTI-HOP INFLUENCE = 2-hop reach count normalized
  UPDATE idea_metrics m SET multi_hop_influence = LEAST(1.0,
    (SELECT COUNT(DISTINCT r2.target_entity_id) 
     FROM entity_relations r1
     JOIN entity_relations r2 ON r2.source_entity_id = r1.target_entity_id
     WHERE r1.source_entity_id = m.node_id
    )::float / GREATEST(1, total_entities)
  );

  -- AUTHORITY = confidence_score × evidence density
  UPDATE idea_metrics m SET authority_score = LEAST(1.0,
    GREATEST(0.1, COALESCE(e.confidence_score, 0.5))
    * LN(1 + COALESCE(e.evidence_count, 0) + 1) / 5.0
  )
  FROM entities e WHERE e.id = m.node_id;

  -- ECONOMIC CONVERSION = reuse normalized
  UPDATE idea_metrics m SET economic_conversion_score = LEAST(1.0,
    LN(1 + COALESCE(e.reuse_count, 0) + 1) / 5.0
  )
  FROM entities e WHERE e.id = m.node_id;

  -- GROWTH = change from previous score (0 if first computation)
  -- For now, growth = difference between current activation and stored importance
  UPDATE idea_metrics m SET growth_score = LEAST(1.0, GREATEST(0,
    m.activation_score - COALESCE(e.importance_score, 0) / 100.0
  ))
  FROM entities e WHERE e.id = m.node_id;

  -- NOVELTY = inverse of relation density (sparse = novel)
  UPDATE idea_metrics m SET novelty_score = GREATEST(0, 1.0 - LEAST(1.0,
    (SELECT COUNT(*) FROM entity_relations WHERE source_entity_id = m.node_id OR target_entity_id = m.node_id)::float
    / GREATEST(1, (SELECT AVG(cnt) FROM (SELECT COUNT(*) as cnt FROM entity_relations GROUP BY source_entity_id) sub))
  ));

  -- DECAY RISK = low evidence + low reuse + old
  UPDATE idea_metrics m SET decay_risk_score = LEAST(1.0,
    (1.0 - LEAST(1.0, COALESCE(e.evidence_count, 0)::float / 5.0)) * 0.4
    + (1.0 - LEAST(1.0, COALESCE(e.reuse_count, 0)::float / 5.0)) * 0.3
    + LEAST(1.0, EXTRACT(EPOCH FROM (now() - COALESCE(e.updated_at, e.created_at))) / (86400 * 90)) * 0.3
  )
  FROM entities e WHERE e.id = m.node_id;

  -- ═══════════════════════════════════════════
  -- PHASE 3: PVS MVP Formula
  -- ═══════════════════════════════════════════
  -- PVS = 0.30·Activation + 0.20·Growth + 0.20·Centrality + 0.15·Authority + 0.15·EconomicUse
  UPDATE idea_metrics SET propagation_value_score = 
    w_activation * activation_score
    + w_growth * growth_score
    + w_centrality * (0.5 * pagerank_score + 0.3 * betweenness_score + 0.2 * multi_hop_influence)
    + w_authority * authority_score
    + w_economic * economic_conversion_score;

  -- AMPLIFICATION PROBABILITY (sigmoid)
  UPDATE idea_metrics SET amplification_probability = 
    1.0 / (1.0 + EXP(-10.0 * (propagation_value_score - 0.5)));

  -- Update model metadata
  UPDATE idea_metrics SET model_version = 'pvs-mvp-v1', computed_at = now();

  -- ═══════════════════════════════════════════
  -- PHASE 4: Write back to entities for SEO/display
  -- ═══════════════════════════════════════════
  UPDATE entities e SET importance_score = m.propagation_value_score * 100.0
  FROM idea_metrics m WHERE m.node_id = e.id;

END;
$function$;
