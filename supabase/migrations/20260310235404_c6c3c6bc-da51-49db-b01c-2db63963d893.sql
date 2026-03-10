
-- =============================================
-- TASK 1: Fix P0 credit system RLS vulnerabilities
-- =============================================

-- Remove dangerous policies that allow users to manipulate their own credits
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.credit_transactions;

-- Create SECURITY DEFINER function for spending credits
CREATE OR REPLACE FUNCTION public.spend_credits(
  _user_id uuid,
  _amount integer,
  _description text,
  _job_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check sufficient balance
  IF NOT EXISTS (
    SELECT 1 FROM user_credits WHERE user_id = _user_id AND balance >= _amount
  ) THEN
    RETURN false;
  END IF;

  -- Deduct balance
  UPDATE user_credits
  SET balance = balance - _amount,
      total_spent = total_spent + _amount,
      updated_at = now()
  WHERE user_id = _user_id AND balance >= _amount;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, job_id)
  VALUES (_user_id, -_amount, 'spend', _description, _job_id);

  RETURN true;
END;
$$;

-- Create SECURITY DEFINER function for adding credits (admin/system only)
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id uuid,
  _amount integer,
  _description text,
  _type text DEFAULT 'topup'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert user credits
  INSERT INTO user_credits (user_id, balance, total_earned)
  VALUES (_user_id, _amount, _amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + _amount,
      total_earned = user_credits.total_earned + _amount,
      updated_at = now();

  -- Log transaction
  INSERT INTO credit_transactions (user_id, amount, type, description)
  VALUES (_user_id, _amount, _type, _description);

  RETURN true;
END;
$$;

-- =============================================
-- TASK 3: Fix neuron_links RLS policy OR→AND
-- =============================================

DROP POLICY IF EXISTS "Links are viewable if either neuron is accessible" ON public.neuron_links;

CREATE POLICY "Links viewable if both neurons accessible"
ON public.neuron_links
FOR SELECT
TO public
USING (
  (EXISTS (
    SELECT 1 FROM neurons
    WHERE neurons.id = neuron_links.source_neuron_id
    AND (neurons.visibility = 'public' OR neurons.author_id = auth.uid())
  ))
  AND
  (EXISTS (
    SELECT 1 FROM neurons
    WHERE neurons.id = neuron_links.target_neuron_id
    AND (neurons.visibility = 'public' OR neurons.author_id = auth.uid())
  ))
);
