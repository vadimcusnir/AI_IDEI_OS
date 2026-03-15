
-- SECURITY DEFINER function for marketplace purchases
-- Handles: credit deduction, transaction recording, sales_count increment
CREATE OR REPLACE FUNCTION public.purchase_marketplace_asset(
  _buyer_id uuid,
  _asset_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _asset record;
  _price integer;
  _spent boolean;
BEGIN
  -- Get asset
  SELECT * INTO _asset FROM knowledge_assets
  WHERE id = _asset_id AND is_published = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found or not published');
  END IF;

  -- Can't buy own asset
  IF _asset.author_id = _buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot purchase your own asset');
  END IF;

  -- Check if already purchased
  IF EXISTS (
    SELECT 1 FROM asset_transactions
    WHERE asset_id = _asset_id AND buyer_id = _buyer_id AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already purchased');
  END IF;

  _price := COALESCE(_asset.price_neurons, 0);

  -- Spend credits if not free
  IF _price > 0 THEN
    SELECT spend_credits(_buyer_id, _price, 'Marketplace purchase: ' || _asset.title) INTO _spent;
    IF NOT _spent THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits', 'price', _price);
    END IF;
  END IF;

  -- Record transaction
  INSERT INTO asset_transactions (asset_id, buyer_id, seller_id, amount_neurons, amount_usd, status)
  VALUES (_asset_id, _buyer_id, _asset.author_id, _price, COALESCE(_asset.price_usd, 0), 'completed');

  -- Increment sales count
  UPDATE knowledge_assets
  SET sales_count = COALESCE(sales_count, 0) + 1, updated_at = now()
  WHERE id = _asset_id;

  RETURN jsonb_build_object('success', true, 'price', _price);
END;
$$;
