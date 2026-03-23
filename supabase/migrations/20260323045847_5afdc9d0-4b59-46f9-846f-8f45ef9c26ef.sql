-- P0 SECURITY FIX: Remove overly permissive public read policies
-- profiles: drop "Public profiles readable" (qual: true) — keep "Users can read own profile"
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

-- user_karma: drop "Anyone can read karma" (qual: true) — keep "Users read own karma" and "Admin read all karma"
DROP POLICY IF EXISTS "Anyone can read karma" ON public.user_karma;

-- Add authenticated-only read for profiles (needed for community features like displaying names)
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Add authenticated-only read for karma (community leaderboards)
CREATE POLICY "Authenticated users can read karma"
ON public.user_karma FOR SELECT TO authenticated
USING (true);