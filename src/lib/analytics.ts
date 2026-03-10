/**
 * GA4 Custom Event Helper
 * Sends events via gtag() when available (respects Consent Mode v2).
 */

type GA4Event =
  | { name: "neuron_created"; params: { neuron_id: number; neuron_number: number } }
  | { name: "neurons_extracted"; params: { episode_id: string; neurons_count: number; credits_spent?: number } }
  | { name: "transcript_uploaded"; params: { source_type: string; episode_id?: string } }
  | { name: "service_executed"; params: { service_key: string; job_id?: string; credits_cost?: number } };

export function trackEvent(event: GA4Event) {
  if (typeof window.gtag === "function") {
    window.gtag("event", event.name, event.params);
  }
}
