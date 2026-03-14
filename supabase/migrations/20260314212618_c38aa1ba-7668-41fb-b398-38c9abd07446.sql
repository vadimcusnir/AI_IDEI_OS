
-- Phase 4.3: Root2 pricing utility function
CREATE OR REPLACE FUNCTION public.root2_validate(_price numeric)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  digit_sum integer;
  price_int integer;
BEGIN
  price_int := abs(_price::integer);
  IF price_int = 0 THEN RETURN false; END IF;
  
  -- Recursively sum digits until single digit or 2
  digit_sum := price_int;
  WHILE digit_sum > 9 LOOP
    DECLARE
      temp integer := 0;
      n integer := digit_sum;
    BEGIN
      WHILE n > 0 LOOP
        temp := temp + (n % 10);
        n := n / 10;
      END LOOP;
      digit_sum := temp;
    END;
  END LOOP;
  
  RETURN digit_sum = 2;
END;
$$;

-- Root2 nearest price finder
CREATE OR REPLACE FUNCTION public.root2_nearest(_price numeric)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  candidate integer;
BEGIN
  candidate := _price::integer;
  -- Search up to 20 in both directions
  FOR i IN 0..20 LOOP
    IF root2_validate(candidate + i) THEN RETURN candidate + i; END IF;
    IF i > 0 AND candidate - i > 0 AND root2_validate(candidate - i) THEN RETURN candidate - i; END IF;
  END LOOP;
  RETURN candidate; -- fallback
END;
$$;

-- Phase 4.1.4: Lifecycle pricing multipliers view
CREATE OR REPLACE VIEW public.neuron_lifecycle_pricing AS
SELECT 
  n.id as neuron_id,
  n.lifecycle,
  n.credits_cost as base_cost,
  CASE n.lifecycle
    WHEN 'ingested' THEN 1.0
    WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8
    WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END as lifecycle_multiplier,
  ROUND(n.credits_cost * CASE n.lifecycle
    WHEN 'ingested' THEN 1.0
    WHEN 'structured' THEN 0.9
    WHEN 'active' THEN 0.8
    WHEN 'capitalized' THEN 0.7
    WHEN 'compounded' THEN 0.5
  END) as adjusted_cost
FROM neurons n;
