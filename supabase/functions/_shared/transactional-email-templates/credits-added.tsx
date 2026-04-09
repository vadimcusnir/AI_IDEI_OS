import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "AI-IDEI"

interface CreditsProps {
  neurons?: string
  reason?: string
}

const CreditsAddedEmail = ({ neurons, reason }: CreditsProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>+{neurons || '500'} NEURONS adăugați — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>NEURONS adăugați! 🎉</Heading>
        <Text style={text}>
          Ai primit <strong>{neurons || '500'} NEURONS</strong>
          {reason ? ` pentru: ${reason}` : ''}.
        </Text>
        <Text style={text}>
          Folosește-i pentru a rula servicii AI, a extrage cunoștințe și a genera conținut.
        </Text>
        <Button style={button} href="https://ai-idei.com/services-catalog">
          Explorează serviciile →
        </Button>
        <Hr style={hr} />
        <Text style={footer}>Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CreditsAddedEmail,
  subject: (data: Record<string, any>) => `+${data.neurons || '500'} NEURONS adăugați`,
  displayName: 'Credits added notification',
  previewData: { neurons: '10,000', reason: 'Abonament Pro activat' },
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
