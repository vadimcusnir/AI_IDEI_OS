/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ContactConfirmationProps {
  name: string
  message: string
}

export const ContactConfirmationEmail = ({
  name,
  message,
}: ContactConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your message — AI-IDEI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://ai-idei-os.lovable.app/favicon.gif" width="40" height="40" alt="AI-IDEI" style={logo} />
        <Heading style={h1}>Thanks for reaching out, {name}!</Heading>
        <Text style={text}>
          We've received your message and will get back to you shortly.
        </Text>
        <Text style={quoteLabel}>Your message:</Text>
        <Text style={quote}>"{message}"</Text>
        <Text style={footer}>
          — The AI-IDEI Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ContactConfirmationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', system-ui, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { borderRadius: '50%', marginBottom: '20px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 20%, 10%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(220, 10%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const quoteLabel = {
  fontSize: '12px',
  color: 'hsl(220, 10%, 46%)',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const quote = {
  fontSize: '14px',
  color: 'hsl(220, 20%, 10%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
  padding: '12px 16px',
  borderLeft: '3px solid hsl(25, 95%, 53%)',
  backgroundColor: 'hsl(220, 16%, 96%)',
  borderRadius: '0 8px 8px 0',
}
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '32px 0 0', opacity: '0.7' }
