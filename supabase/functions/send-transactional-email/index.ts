import { createClient } from 'npm:@supabase/supabase-js@2'
import { render } from 'npm:@react-email/components@0.0.22'
import { ContactConfirmationEmail } from '../_shared/email-templates/contact-confirmation.tsx'
import { CreditsNotificationEmail } from '../_shared/email-templates/credits-notification.tsx'

import { getCorsHeaders } from '../_shared/cors.ts';

type TemplateType = 'contact_confirmation' | 'credits_low' | 'credits_topup'

interface SendRequest {
  template: TemplateType
  to: string
  data: Record<string, unknown>
}

function renderTemplate(template: TemplateType, data: Record<string, unknown>): { subject: string; html: string } {
  switch (template) {
    case 'contact_confirmation': {
      const html = render(ContactConfirmationEmail({
        name: String(data.name || 'there'),
        message: String(data.message || ''),
      }))
      return { subject: 'We received your message — AI-IDEI', html }
    }
    case 'credits_low': {
      const html = render(CreditsNotificationEmail({
        type: 'low',
        balance: Number(data.balance || 0),
      }))
      return { subject: `Credits Running Low — ${data.balance} NEURONS remaining`, html }
    }
    case 'credits_topup': {
      const html = render(CreditsNotificationEmail({
        type: 'topup',
        balance: Number(data.balance || 0),
        amount: Number(data.amount || 0),
      }))
      return { subject: `Top-Up Confirmed: +${data.amount} NEURONS`, html }
    }
    default:
      throw new Error(`Unknown template: ${template}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const body: SendRequest = await req.json()
    const { template, to, data } = body

    if (!template || !to) {
      return new Response(JSON.stringify({ error: 'Missing template or to' }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const validTemplates: TemplateType[] = ['contact_confirmation', 'credits_low', 'credits_topup']
    if (!validTemplates.includes(template)) {
      return new Response(JSON.stringify({ error: `Invalid template. Must be one of: ${validTemplates.join(', ')}` }), {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const { subject, html } = renderTemplate(template, data || {})
    const messageId = crypto.randomUUID()

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to,
        from: 'AI-IDEI <noreply@oh-no-no-no-reply.ai-idei.com>',
        sender_domain: 'oh-no-no-no-reply.ai-idei.com',
        subject,
        html,
        purpose: 'transactional',
        label: template,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('Failed to enqueue email', enqueueError)
      return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, message_id: messageId }), {
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('send-transactional-email error', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
