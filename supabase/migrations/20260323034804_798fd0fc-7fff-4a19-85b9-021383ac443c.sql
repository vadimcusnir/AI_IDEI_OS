-- Drop the oldest/redundant award_xp overload that conflicts
-- Keep the most complete version (with _quality_multiplier) and the 5-param version
DROP FUNCTION IF EXISTS public.award_xp(uuid, integer, text, text);

-- Now recreate the trigger function with explicit cast to avoid ambiguity
CREATE OR REPLACE FUNCTION public.award_xp_on_neuron()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM award_xp(
    NEW.author_id, 
    25, 
    'neuron_created'::text, 
    ('Created neuron: ' || COALESCE(NEW.title, 'untitled'))::text, 
    false::boolean
  );
  PERFORM record_daily_activity(NEW.author_id);
  RETURN NEW;
END;
$$;