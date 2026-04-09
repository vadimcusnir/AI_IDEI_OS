import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "AI-IDEI"

interface PaymentProps {
  amount?: string
  plan?: string
  neurons?: string
}

const PaymentConfirmationEmail = ({ amount, plan, neurons }: PaymentProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Plata ta a fost confirmată — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Plată confirmată ✓</Heading>
        {plan && <Text style={text}>Plan: <strong>{plan}</strong></Text>}
        {amount && <Text style={text}>Sumă: <strong>${amount}</strong></Text>}
        {neurons && <Text style={text}>NEURONS creditați: <strong>{neurons}</strong></Text>}
        <Text style={text}>
          Creditul tău a fost actualizat automat. Poți verifica balanța în dashboard.
        </Text>
        <Button style={button} href="https://ai-idei.com/credits">
          Vezi balanța →
        </Button>
        <Hr style={hr} />
        <Text style={footer}>Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentConfirmationEmail,
  subject: (data: Record<string, any>) => `Plată confirmată${data.plan ? ` — ${data.plan}` : ''}`,
  displayName: 'Payment confirmation',
  previewData: { amount: '47', plan: 'Pro', neurons: '10,000' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 12px' }
const button = {
  backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', fontSize: '15px', fontWeight: '600',
  textDecoration: 'none', display: 'inline-block', margin: '8px 0 24px',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '0' }
