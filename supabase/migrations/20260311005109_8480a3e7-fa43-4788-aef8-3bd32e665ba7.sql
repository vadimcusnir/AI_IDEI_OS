
-- P0 FIX: Remove dangerous user_credits policies that allow direct balance manipulation
-- All credit operations must go through spend_credits() and add_credits() SECURITY DEFINER functions

-- Users should NOT be able to update their own credit balance directly
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

-- Users should NOT be able to insert their own credit records directly
-- (handle_new_user_credits trigger + add_credits function handle this)
DROP POLICY IF EXISTS "Users can insert own credits" ON public.user_credits;
