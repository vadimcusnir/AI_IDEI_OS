INSERT INTO public.wallet_state (user_id, available, staked, locked)
VALUES ('aa08fe29-8dcb-4f3d-9756-8b78beafe4ca', 50000, 0, 0)
ON CONFLICT (user_id) DO UPDATE SET available = wallet_state.available + 50000, updated_at = now();