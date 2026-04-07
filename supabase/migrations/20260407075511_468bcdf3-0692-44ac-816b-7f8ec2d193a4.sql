-- Revoke sensitive columns from client roles
REVOKE SELECT (secret) ON public.webhook_endpoints FROM authenticated, anon;
REVOKE SELECT (webhook_key) ON public.incoming_webhooks FROM authenticated, anon;
REVOKE SELECT (auth_key, p256dh) ON public.push_subscriptions FROM authenticated, anon;
REVOKE SELECT (key_hash) ON public.api_keys FROM authenticated, anon;