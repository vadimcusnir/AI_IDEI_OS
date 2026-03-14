
-- T1.3: Decision Ledger Append-Only Hardening

-- 1. Add hash_chain column for cryptographic integrity
ALTER TABLE public.decision_ledger ADD COLUMN IF NOT EXISTS entry_hash text;
ALTER TABLE public.decision_ledger ADD COLUMN IF NOT EXISTS prev_hash text;

-- 2. Trigger to prevent UPDATE on decision_ledger
CREATE OR REPLACE FUNCTION public.prevent_ledger_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Decision ledger is append-only. Updates are not allowed.';
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_prevent_ledger_update
  BEFORE UPDATE ON public.decision_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_update();

-- 3. Trigger to prevent DELETE on decision_ledger
CREATE OR REPLACE FUNCTION public.prevent_ledger_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Decision ledger is append-only. Deletions are not allowed.';
  RETURN NULL;
END;
$$;

CREATE OR REPLACE TRIGGER trg_prevent_ledger_delete
  BEFORE DELETE ON public.decision_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_ledger_delete();

-- 4. Trigger to auto-compute hash chain on INSERT
CREATE OR REPLACE FUNCTION public.ledger_hash_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_hash text;
  payload text;
BEGIN
  -- Get the hash of the most recent entry
  SELECT entry_hash INTO last_hash
  FROM public.decision_ledger
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_hash IS NULL THEN
    last_hash := 'GENESIS';
  END IF;

  NEW.prev_hash := last_hash;

  -- Build payload from key fields
  payload := concat_ws('|',
    NEW.id::text,
    NEW.event_type,
    COALESCE(NEW.actor_id::text, ''),
    COALESCE(NEW.target_resource, ''),
    COALESCE(NEW.verdict, ''),
    COALESCE(NEW.reason, ''),
    NEW.created_at::text,
    last_hash
  );

  NEW.entry_hash := encode(digest(payload, 'sha256'), 'hex');

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_ledger_hash_chain
  BEFORE INSERT ON public.decision_ledger
  FOR EACH ROW
  EXECUTE FUNCTION public.ledger_hash_chain();
