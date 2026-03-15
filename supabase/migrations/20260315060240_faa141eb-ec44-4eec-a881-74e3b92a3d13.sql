
-- Add digest preference columns if not exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'weekly_digest'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN weekly_digest boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'notification_preferences' AND column_name = 'monthly_digest'
  ) THEN
    ALTER TABLE public.notification_preferences ADD COLUMN monthly_digest boolean NOT NULL DEFAULT false;
  END IF;
END $$;
