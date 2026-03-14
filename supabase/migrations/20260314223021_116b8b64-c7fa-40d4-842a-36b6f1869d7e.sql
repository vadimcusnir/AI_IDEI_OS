
-- Trigger: auto-create profile + notification prefs + credits for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

CREATE OR REPLACE TRIGGER on_auth_user_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_tokens();

-- Trigger: notify on job status change
CREATE OR REPLACE TRIGGER on_job_status_change
  AFTER UPDATE ON public.neuron_jobs
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_status();

-- Trigger: notify on artifact created
CREATE OR REPLACE TRIGGER on_artifact_created
  AFTER INSERT ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.notify_artifact_created();

-- Trigger: notify on credits low
CREATE OR REPLACE TRIGGER on_credits_low
  AFTER UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.notify_credits_low();

-- Trigger: check achievements on neuron creation
CREATE OR REPLACE TRIGGER on_neuron_achievement
  AFTER INSERT ON public.neurons
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();

-- Trigger: check achievements on job completion
CREATE OR REPLACE TRIGGER on_job_achievement
  AFTER UPDATE ON public.neuron_jobs
  FOR EACH ROW EXECUTE FUNCTION public.check_job_achievements();

-- Trigger: notify on version created
CREATE OR REPLACE TRIGGER on_version_created
  AFTER INSERT ON public.neuron_versions
  FOR EACH ROW EXECUTE FUNCTION public.notify_version_created();

-- Trigger: notify on feedback submitted
CREATE OR REPLACE TRIGGER on_feedback_submitted
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_submitted();

-- Trigger: notify on feedback response
CREATE OR REPLACE TRIGGER on_feedback_responded
  AFTER UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_feedback_responded();

-- Trigger: notify on changelog published
CREATE OR REPLACE TRIGGER on_changelog_published
  AFTER UPDATE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION public.notify_changelog_published();

-- Trigger: send push notification
CREATE OR REPLACE TRIGGER on_notification_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_send_push();

-- Trigger: update updated_at on neurons
CREATE OR REPLACE TRIGGER set_updated_at_neurons
  BEFORE UPDATE ON public.neurons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update updated_at on episodes
CREATE OR REPLACE TRIGGER set_updated_at_episodes
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update updated_at on artifacts
CREATE OR REPLACE TRIGGER set_updated_at_artifacts
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
