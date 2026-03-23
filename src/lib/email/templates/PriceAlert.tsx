import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface PriceAlertProps {
  ingredientName: string;
  retailerName: string;
  oldPricePence: number;
  newPricePence: number;
  appUrl: string;
}

function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function PriceAlert({
  ingredientName,
  retailerName,
  oldPricePence,
  newPricePence,
  appUrl,
}: PriceAlertProps) {
  const saving = oldPricePence - newPricePence;

  return (
    <Html>
      <Head />
      <Preview>
        Price drop: {ingredientName} is now {formatPence(newPricePence)} at{' '}
        {retailerName} — save {formatPence(saving)}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>Loavish</Text>
          </Section>
          <Section style={content}>
            <Heading style={heading}>Price drop alert 📉</Heading>
            <Text style={paragraph}>
              Good news — the price of <strong>{ingredientName}</strong> has
              dropped at {retailerName}.
            </Text>

            <Section style={priceCard}>
              <Text style={ingredientLabel}>{ingredientName}</Text>
              <Text style={retailerLabel}>{retailerName}</Text>
              <Row>
                <Column style={priceColumn}>
                  <Text style={priceCaption}>Was</Text>
                  <Text style={oldPrice}>{formatPence(oldPricePence)}</Text>
                </Column>
                <Column style={arrowColumn}>
                  <Text style={arrow}>→</Text>
                </Column>
                <Column style={priceColumn}>
                  <Text style={priceCaption}>Now</Text>
                  <Text style={newPrice}>{formatPence(newPricePence)}</Text>
                </Column>
                <Column style={savingColumn}>
                  <Text style={savingBadge}>Save {formatPence(saving)}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={buttonSection}>
              <Button href={appUrl} style={ctaButton}>
                View in Loavish
              </Button>
            </Section>

            <Text style={footerNote}>
              You&apos;re receiving this because you track {ingredientName} in
              Loavish.
            </Text>
          </Section>
          <Section style={footerSection}>
            <Text style={footerText}>
              © 2025 Loavish. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default PriceAlert;

const NAVY = '#1E2D4E';
const TEAL = '#3DBFB8';
const CREAM = '#F7F5F2';
const CORAL = '#E8693A';

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
  backgroundColor: NAVY,
  padding: '28px 40px',
};

const logoText: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 800,
  letterSpacing: '-0.5px',
  margin: 0,
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
  margin: '0 0 24px',
};

const priceCard: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  margin: '0 0 28px',
  padding: '20px 24px',
};

const ingredientLabel: React.CSSProperties = {
  color: NAVY,
  fontSize: '17px',
  fontWeight: 700,
  margin: '0 0 4px',
};

const retailerLabel: React.CSSProperties = {
  color: '#6B7280',
  fontSize: '13px',
  margin: '0 0 16px',
};

const priceColumn: React.CSSProperties = {
  textAlign: 'center' as const,
  width: '100px',
};

const arrowColumn: React.CSSProperties = {
  textAlign: 'center' as const,
  width: '32px',
};

const savingColumn: React.CSSProperties = {
  textAlign: 'right' as const,
};

const priceCaption: React.CSSProperties = {
  color: '#9AA5B4',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.06em',
  margin: '0 0 4px',
  textTransform: 'uppercase',
};

const oldPrice: React.CSSProperties = {
  color: '#9AA5B4',
  fontSize: '20px',
  fontWeight: 700,
  margin: 0,
  textDecoration: 'line-through',
};

const newPrice: React.CSSProperties = {
  color: TEAL,
  fontSize: '20px',
  fontWeight: 800,
  margin: 0,
};

const arrow: React.CSSProperties = {
  color: '#CBD5E0',
  fontSize: '18px',
  margin: '20px 0 0',
};

const savingBadge: React.CSSProperties = {
  backgroundColor: `${CORAL}15`,
  border: `1px solid ${CORAL}30`,
  borderRadius: '6px',
  color: CORAL,
  fontSize: '12px',
  fontWeight: 700,
  margin: '16px 0 0',
  padding: '4px 10px',
};

const buttonSection: React.CSSProperties = {
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const ctaButton: React.CSSProperties = {
  backgroundColor: NAVY,
  borderRadius: '10px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 700,
  padding: '13px 28px',
  textDecoration: 'none',
};

const footerNote: React.CSSProperties = {
  color: '#9AA5B4',
  fontSize: '12px',
  margin: 0,
  textAlign: 'center' as const,
};

const footerSection: React.CSSProperties = {
  backgroundColor: CREAM,
  padding: '20px 40px',
};

const footerText: React.CSSProperties = {
  color: '#9AA5B4',
  fontSize: '12px',
  margin: 0,
  textAlign: 'center' as const,
};
