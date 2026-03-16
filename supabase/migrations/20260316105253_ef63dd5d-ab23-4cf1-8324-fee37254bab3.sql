
-- Enhanced multi-threshold low-balance notifications
CREATE OR REPLACE FUNCTION public.notify_credits_low()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _thresholds integer[] := ARRAY[100, 50, 20];
  _threshold integer;
  _severity text;
  _title text;
  _message text;
BEGIN
  FOREACH _threshold IN ARRAY _thresholds LOOP
    -- Only fire when crossing the threshold downward
    IF NEW.balance < _threshold AND (OLD.balance IS NULL OR OLD.balance >= _threshold) THEN
      _severity := CASE
        WHEN _threshold <= 20 THEN 'critical'
        WHEN _threshold <= 50 THEN 'warning'
        ELSE 'info'
      END;
      
      _title := CASE
        WHEN _threshold <= 20 THEN '🚨 Credite aproape epuizate!'
        WHEN _threshold <= 50 THEN '⚠️ Credite scăzute'
        ELSE '💡 Credite în scădere'
      END;
      
      _message := 'Balanța ta: ' || NEW.balance || ' NEURONS. ' ||
        CASE
          WHEN _threshold <= 20 THEN 'Reîncarcă acum pentru a continua analizele.'
          WHEN _threshold <= 50 THEN 'Consideră un top-up pentru a evita întreruperi.'
          ELSE 'Monitorizează consumul sau reîncarcă din timp.'
        END;

      INSERT INTO public.notifications (user_id, type, title, message, link, meta)
      VALUES (
        NEW.user_id,
        'credits_low',
        _title,
        _message,
        '/credits',
        jsonb_build_object('balance', NEW.balance, 'threshold', _threshold, 'severity', _severity)
      );

      -- For critical threshold, also enqueue an email notification
      IF _threshold <= 20 THEN
        BEGIN
          PERFORM enqueue_email('transactional_emails', jsonb_build_object(
            'template_name', 'credits-notification',
            'recipient_email', (SELECT email FROM auth.users WHERE id = NEW.user_id),
            'subject', _title,
            'data', jsonb_build_object(
              'balance', NEW.balance,
              'threshold', _threshold,
              'severity', _severity,
              'topup_url', 'https://ai-idei-os.lovable.app/credits'
            )
          ));
        EXCEPTION WHEN OTHERS THEN
          -- Email queue may not be set up; don't block the trigger
          NULL;
        END;
      END IF;

      -- Only fire for the first (highest) threshold crossed
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;
