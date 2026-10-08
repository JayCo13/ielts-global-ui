import React from 'react';
import PolicyLayout, { Section, Bullets, Steps, ContactBlock, EmailLink } from '../../components/PolicyLayout';

const RefundPolicy = () => (
  <PolicyLayout
    title="Refund Policy"
    subtitle="Applicable to the e-commerce website: EnglishOnComputer.com"
    seoTitle="Refund Policy | EnglishOnComputer"
    seoDescription="Refund policy for digital products purchased on EnglishOnComputer.com."
    path="/refund-policy"
  >
    <Section title="1. General Policy">
      <p>
        Due to the nature of digital products, all sales are generally final and non-refundable once access has been granted.
      </p>
      <p>
        However, refunds may be considered in specific cases where technical issues significantly affect the customer's ability
        to access or use the product.
      </p>
    </Section>

    <Section title="2. Eligible Refund Cases">
      <p>Customers may be eligible for a refund if:</p>
      <Bullets
        items={[
          'The product is inaccessible or unusable due to technical issues, and',
          'The issue persists for more than 3 consecutive days, and',
          'The issue is confirmed to originate from our system',
        ]}
      />
      <p>In such cases, we may:</p>
      <Bullets
        items={[
          'Extend the access period, or',
          'Provide a full or partial refund, depending on the situation',
        ]}
      />
    </Section>

    <Section title="3. Technical Support">
      <p>If you experience any issues (e.g., inaccessible content, system errors), please contact us:</p>
      <p><span className="font-medium">Email:</span> <EmailLink /></p>
      <p>
        Our support team will respond within <strong>5 business days</strong> and work to resolve the issue as quickly as
        possible.
      </p>
    </Section>

    <Section title="4. Refund Request Process">
      <Steps
        steps={[
          { title: 'Step 1: Contact us via email with a detailed description of the issue.' },
          { title: 'Step 2: Our team reviews your request within 5 business days.' },
          { title: 'Step 3: If approved, the refund will be processed via the trusted third-party payment provider to your original payment method.' },
        ]}
      />
    </Section>

    <Section title="5. Refund Processing Time">
      <p>Once approved, refunds are processed by <strong>a trusted third-party payment provider</strong>.</p>
      <p>
        Depending on your payment provider, it may take <strong>5–10 business days</strong> for the refunded amount to appear in
        your account.
      </p>
    </Section>

    <Section title="6. Contact Information">
      <ContactBlock intro="For refund inquiries, please contact us:" />
    </Section>
  </PolicyLayout>
);

export default RefundPolicy;
