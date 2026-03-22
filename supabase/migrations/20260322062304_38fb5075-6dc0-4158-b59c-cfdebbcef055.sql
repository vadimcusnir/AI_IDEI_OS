
-- Auto-queue embedding generation when neurons are created or updated
CREATE OR REPLACE FUNCTION public.auto_embed_neuron()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO neuron_jobs (neuron_id, author_id, worker_type, status, priority)
  VALUES (NEW.id, NEW.author_id, 'embed-neurons', 'pending', 5)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_embed_neuron_insert ON neurons;
CREATE TRIGGER trg_auto_embed_neuron_insert
  AFTER INSERT ON neurons
  FOR EACH ROW
  EXECUTE FUNCTION auto_embed_neuron();

DROP TRIGGER IF EXISTS trg_auto_embed_neuron_update ON neurons;
CREATE TRIGGER trg_auto_embed_neuron_update
  AFTER UPDATE OF title, score ON neurons
  FOR EACH ROW
  WHEN (OLD.title IS DISTINCT FROM NEW.title)
  EXECUTE FUNCTION auto_embed_neuron();
