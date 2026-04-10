
-- Create safe view for push_subscriptions (masks cryptographic keys)
CREATE OR REPLACE VIEW public.push_subscriptions_safe
WITH (security_invoker = on) AS
SELECT
  id,
  user_id,
  LEFT(endpoint, 40) || '...' AS endpoint_masked,
  user_agent,
  created_at
FROM public.push_subscriptions;

-- Grant access
GRANT SELECT ON public.push_subscriptions_safe TO authenticated;

COMMENT ON VIEW public.push_subscriptions_safe IS 'Client-safe view of push subscriptions. Hides p256dh, auth_key, and full endpoint URL.';
