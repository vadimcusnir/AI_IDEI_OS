/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface CreditsNotificationProps {
  type: 'low' | 'topup'
  balance: number
  amount?: number
}

export const CreditsNotificationEmail = ({
  type,
  balance,
  amount,
}: CreditsNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {type === 'low'
        ? `Your NEURONS balance is running low (${balance} remaining)`
        : `Top-up confirmed: +${amount} NEURONS`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://ai-idei-os.lovable.app/favicon.gif" width="40" height="40" alt="AI-IDEI" style={logo} />
        <Heading style={h1}>
          {type === 'low' ? 'Credits Running Low ⚠' : 'Top-Up Confirmed ✓'}
        </Heading>

        {type === 'low' ? (
          <>
            <Text style={text}>
              Your NEURONS balance has dropped to <strong style={{ color: 'hsl(0, 72%, 51%)' }}>{balance}</strong>. You may not be able to run services until you top up.
            </Text>
            <Button style={button} href="https://ai-idei-os.lovable.app/credits">
              Top Up Now
            </Button>
          </>
        ) : (
          <>
            <Text style={text}>
              Your account has been credited with <strong style={{ color: 'hsl(25, 95%, 53%)' }}>+{amount} NEURONS</strong>.
            </Text>
            <Text style={statBox}>
              New balance: <strong>{balance} NEURONS</strong>
            </Text>
            <Button style={button} href="https://ai-idei-os.lovable.app/credits">
              View Balance
            </Button>
          </>
        )}

        <Text style={footer}>
          — The AI-IDEI Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default CreditsNotificationEmail

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
const statBox = {
  fontSize: '16px',
  color: 'hsl(220, 20%, 10%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
  padding: '16px',
  backgroundColor: 'hsl(220, 16%, 96%)',
  borderRadius: '8px',
  textAlign: 'center' as const,
}
const button = {
  backgroundColor: 'hsl(25, 95%, 53%)',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '32px 0 0', opacity: '0.7' }
