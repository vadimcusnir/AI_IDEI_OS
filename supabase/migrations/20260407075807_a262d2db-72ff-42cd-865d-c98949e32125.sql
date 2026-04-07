-- 1. VIP war room members: block client writes, service_role only
DROP POLICY IF EXISTS "vip_war_room_members_insert_own" ON public.vip_war_room_members;
DROP POLICY IF EXISTS "vip_war_room_members_update_own" ON public.vip_war_room_members;
DROP POLICY IF EXISTS "vip_war_room_members_delete_own" ON public.vip_war_room_members;

-- 2. Team challenge contributions: block client writes
DROP POLICY IF EXISTS "team_challenge_contributions_insert_own" ON public.team_challenge_contributions;
DROP POLICY IF EXISTS "team_challenge_contributions_update_own" ON public.team_challenge_contributions;
DROP POLICY IF EXISTS "team_challenge_contributions_delete_own" ON public.team_challenge_contributions;
DROP POLICY IF EXISTS "System can insert contributions" ON public.team_challenge_contributions;