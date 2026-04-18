import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'AI-IDEI OS'

interface CriticalAlertProps {
  title?: string
  description?: string
  serviceKey?: string
  providerKey?: string
  errorSignal?: string
  recommendedAction?: string
  impactScope?: string
  occurrences?: number
  firstSeen?: string
  alertId?: string
}

const CriticalAlertEmail = ({
  title = 'Critical alert',
  description,
  serviceKey,
  providerKey,
  errorSignal,
  recommendedAction,
  impactScope,
  occurrences,
  firstSeen,
  alertId,
}: CriticalAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🚨 CRITICAL — {title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={badge}>
          <Text style={badgeText}>🚨 CRITICAL ALERT</Text>
        </Section>
        <Heading style={h1}>{title}</Heading>

        {description && <Text style={text}>{description}</Text>}

        <Section style={meta}>
          {serviceKey && <Text style={metaRow}><strong>Service:</strong> {serviceKey}</Text>}
          {providerKey && <Text style={metaRow}><strong>Provider:</strong> {providerKey}</Text>}
          {impactScope && <Text style={metaRow}><strong>Impact:</strong> {impactScope}</Text>}
          {typeof occurrences === 'number' && <Text style={metaRow}><strong>Occurrences:</strong> ×{occurrences}</Text>}
          {firstSeen && <Text style={metaRow}><strong>First seen:</strong> {firstSeen}</Text>}
        </Section>

        {errorSignal && (
          <Section style={signalBox}>
            <Text style={signalLabel}>Error signal</Text>
            <Text style={signalText}>{errorSignal}</Text>
          </Section>
        )}

        {recommendedAction && (
          <Section style={actionBox}>
            <Text style={actionLabel}>→ Recommended action</Text>
            <Text style={actionText}>{recommendedAction}</Text>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          {alertId && <span>Alert ID: {alertId}<br /></span>}
          Open the Admin → Alert Center to acknowledge or resolve.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CriticalAlertEmail,
  subject: (d: Record<string, any>) => `🚨 [${SITE_NAME}] CRITICAL — ${d.title ?? 'system alert'}`,
  displayName: 'Critical system alert',
  previewData: {
    title: 'Stripe webhook signature verification failing',
    description: 'Multiple webhook deliveries rejected in last 5 minutes.',
    serviceKey: 'payment',
    providerKey: 'stripe',
    errorSignal: 'stripe-webhook::SignatureError::Invalid sig',
    recommendedAction: 'Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard.',
    impactScope: 'All incoming payments',
    occurrences: 12,
    firstSeen: '2026-04-18T10:23:00Z',
    alertId: 'demo-alert-id',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const badge = { backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '8px 12px', margin: '0 0 16px' }
const badgeText = { color: '#dc2626', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }
const h1 = { fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 16px' }
const meta = { backgroundColor: '#f9fafb', borderRadius: '6px', padding: '12px 16px', margin: '0 0 16px' }
const metaRow = { fontSize: '13px', color: '#374151', margin: '4px 0' }
const signalBox = { backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '12px 16px', margin: '0 0 16px' }
const signalLabel = { fontSize: '11px', color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' as const, margin: '0 0 4px' }
const signalText = { fontSize: '12px', color: '#111827', fontFamily: 'monospace', margin: 0, wordBreak: 'break-all' as const }
const actionBox = { backgroundColor: '#eff6ff', borderLeft: '3px solid #2563eb', padding: '12px 16px', margin: '0 0 16px' }
const actionLabel = { fontSize: '12px', color: '#1e40af', fontWeight: 'bold', margin: '0 0 4px' }
const actionText = { fontSize: '13px', color: '#1e3a8a', margin: 0, lineHeight: '1.5' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const footer = { fontSize: '11px', color: '#9ca3af', margin: 0, lineHeight: '1.5' }
