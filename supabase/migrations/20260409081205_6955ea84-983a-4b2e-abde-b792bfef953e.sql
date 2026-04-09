
-- Mark stale running jobs as error (stuck for >24h)
UPDATE public.neuron_jobs 
SET status = 'error', 
    error_message = 'Job timed out — stuck in running state for >24h',
    completed_at = now()
WHERE status = 'running' 
  AND created_at < now() - interval '24 hours';

-- Mark old pending jobs as error (waiting >3 days)  
UPDATE public.neuron_jobs 
SET status = 'error', 
    error_message = 'Auto-cancelled: pending for >3 days',
    completed_at = now()
WHERE status = 'pending' 
  AND created_at < now() - interval '3 days';
