import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "AI-IDEI"

interface WelcomeProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Bine ai venit în {SITE_NAME} — Knowledge OS</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Bine ai venit, ${name}!` : `Bine ai venit în ${SITE_NAME}!`}
        </Heading>
        <Text style={text}>
          Contul tău a fost creat cu succes. Ai primit 500 NEURONS gratuit pentru a explora platforma.
        </Text>
        <Text style={text}>
          AI-IDEI transformă cunoștințele tale în active intelectuale structurate folosind inteligență artificială.
        </Text>
        <Button style={button} href="https://ai-idei.com/home">
          Începe acum →
        </Button>
        <Hr style={hr} />
        <Text style={footer}>Echipa {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Bine ai venit în AI-IDEI!',
  displayName: 'Welcome email',
  previewData: { name: 'Vadim' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#7c3aed', color: '#ffffff', padding: '12px 24px',
  borderRadius: '8px', fontSize: '15px', fontWeight: '600',
  textDecoration: 'none', display: 'inline-block', margin: '8px 0 24px',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '0' }
