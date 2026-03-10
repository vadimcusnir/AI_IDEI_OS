
-- Fix: restrict INSERT to only service_role (triggers run as SECURITY DEFINER, bypassing RLS)
DROP POLICY "System insert notifications" ON public.notifications;

-- No INSERT policy needed for authenticated users — triggers bypass RLS via SECURITY DEFINER
-- If we need service-level inserts, they also bypass RLS
