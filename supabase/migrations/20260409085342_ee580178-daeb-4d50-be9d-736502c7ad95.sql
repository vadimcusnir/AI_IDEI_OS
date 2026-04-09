
ALTER VIEW public.user_integrations_safe SET (security_invoker = on);
ALTER VIEW public.webhook_endpoints_safe SET (security_invoker = on);
