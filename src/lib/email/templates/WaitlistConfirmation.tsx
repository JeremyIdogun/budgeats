import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WaitlistConfirmationProps {
  email: string;
  logoSrc: string;
}

export function WaitlistConfirmation({ email, logoSrc }: WaitlistConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the Loavish waitlist — we&apos;ll let you know the moment we launch.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Img
              src={logoSrc}
              alt="Loavish — Eat well. Spend wisely."
              width={190}
              height={58}
            />
          </Section>
          <Section style={content}>
            <Heading style={heading}>You&apos;re on the list 🎉</Heading>
            <Text style={paragraph}>
              Thanks for signing up! We&apos;ve got your email address:
            </Text>
            <Text style={emailDisplay}>{email}</Text>
            <Text style={paragraph}>
              We&apos;ll let you know the moment Loavish launches. Early access
              users get free premium features during our beta period — so
              you&apos;re already ahead of the curve.
            </Text>
            <Text style={paragraph}>
              Talk soon,
              <br />
              The Loavish team
            </Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              © 2025 Loavish. All rights reserved.
              <br />
              You received this email because you joined the Loavish waitlist.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default WaitlistConfirmation;

const NAVY = '#1E2D4E';
const TEAL = '#3DBFB8';
const CREAM = '#F7F5F2';

const body: React.CSSProperties = {
  backgroundColor: CREAM,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: '40px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  margin: '0 auto',
  maxWidth: '520px',
  overflow: 'hidden',
};

const header: React.CSSProperties = {
  backgroundColor: CREAM,
  borderBottom: `3px solid ${NAVY}`,
  padding: '24px 40px',
};


const content: React.CSSProperties = {
  padding: '40px 40px 32px',
};

const heading: React.CSSProperties = {
  color: NAVY,
  fontSize: '28px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  lineHeight: 1.2,
  margin: '0 0 20px',
};

const paragraph: React.CSSProperties = {
  color: '#4A5568',
  fontSize: '15px',
  lineHeight: 1.6,
  margin: '0 0 16px',
};

const emailDisplay: React.CSSProperties = {
  backgroundColor: '#F0FAFA',
  border: `1px solid ${TEAL}33`,
  borderRadius: '8px',
  color: NAVY,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 20px',
  padding: '12px 16px',
};

const footer: React.CSSProperties = {
  backgroundColor: CREAM,
  padding: '24px 40px',
};

const footerText: React.CSSProperties = {
  color: '#9AA5B4',
  fontSize: '12px',
  lineHeight: 1.6,
  margin: 0,
  textAlign: 'center',
};
