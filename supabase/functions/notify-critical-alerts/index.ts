/**
 * Wave 7 — notify-critical-alerts
 * Cron job (every 5 min) that emails admins for unacknowledged critical alerts.
 * Uses send-transactional-email with the 'critical-alert' template.
 * Marks `notified_at` to prevent re-sending.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { getCorsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  try {
    // 1) Fetch unnotified critical alerts (cap 20 per run to avoid bursts)
    const { data: alerts, error: alertsErr } = await supabase
      .from('admin_alerts')
      .select('id, title, description, service_key, provider_key, error_signal, recommended_action, impact_scope, occurrences, first_seen')
      .eq('severity', 'critical')
      .is('notified_at', null)
      .is('resolved_at', null)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: true })
      .limit(20)

    if (alertsErr) throw alertsErr
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // 2) Get admin emails (single fetch reused for all alerts)
    const { data: admins, error: adminErr } = await supabase.rpc('get_admin_emails')
    if (adminErr) throw adminErr
    const adminEmails: string[] = (admins ?? []).map((a: any) => a.email).filter(Boolean)

    if (adminEmails.length === 0) {
      console.warn('[notify-critical-alerts] No admin emails found — marking notified to skip')
      await supabase
        .from('admin_alerts')
        .update({ notified_at: new Date().toISOString() })
        .in('id', alerts.map(a => a.id))
      return new Response(JSON.stringify({ ok: true, processed: 0, reason: 'no_admins' }), {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    // 3) Send one email per (alert × admin) — ONE recipient per invoke
    let sent = 0
    let failed = 0
    for (const alert of alerts) {
      let alertOk = true
      for (const email of adminEmails) {
        try {
          const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'critical-alert',
              recipientEmail: email,
              idempotencyKey: `critical-alert-${alert.id}-${email}`,
              templateData: {
                title: alert.title,
                description: alert.description,
                serviceKey: alert.service_key,
                providerKey: alert.provider_key,
                errorSignal: alert.error_signal,
                recommendedAction: alert.recommended_action,
                impactScope: alert.impact_scope,
                occurrences: alert.occurrences,
                firstSeen: alert.first_seen,
                alertId: alert.id,
              },
            },
          })
          if (sendErr) { alertOk = false; failed++; console.error('send fail', email, sendErr) }
          else sent++
        } catch (e) {
          alertOk = false; failed++
          console.error('invoke threw', email, e)
        }
      }
      if (alertOk) {
        await supabase
          .from('admin_alerts')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', alert.id)
      }
    }

    return new Response(JSON.stringify({ ok: true, alerts: alerts.length, admins: adminEmails.length, sent, failed }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[notify-critical-alerts] error', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
