import React from 'react';
import PolicyLayout, { Section, Bullets, Steps, ContactBlock } from '../../components/PolicyLayout';

const DeliPolicy = () => (
  <PolicyLayout
    title="Delivery Policy"
    subtitle="Applicable to the e-commerce website: EnglishOnComputer.com"
    seoTitle="Delivery Policy | EnglishOnComputer"
    seoDescription="How digital products and services are delivered on EnglishOnComputer.com."
    path="/deli-policy"
  >
    <p className="text-gray-700 mb-7">
      This Shipping and Delivery Policy outlines how products and services are delivered on EnglishOnComputer.com.
    </p>

    <Section title="1. Delivery Method / Service Provision">
      <p className="font-semibold text-gray-900">
        📱 All products offered on the Website are digital products, including mock tests and practice exercises with audio
        components.
      </p>
      <p>
        Upon successful payment, customers will be granted access to the purchased materials via their registered account or
        email.
      </p>
    </Section>

    <Section title="2. Delivery Time">
      <p className="font-semibold text-gray-900">⚡ Digital Products</p>
      <p>Access is provided immediately after successful payment, typically <strong>within 1 minute</strong>.</p>
    </Section>

    <Section title="3. Delivery Scope">
      <p className="font-semibold text-gray-900">🌍 Digital Products</p>
      <p>Our services are available <strong>worldwide</strong>. Customers only need a valid email address to receive access.</p>
    </Section>

    <Section title="4. Responsibilities and Proof of Delivery">
      <p className="font-semibold text-gray-900">For digital products:</p>
      <Bullets
        items={[
          'The system automatically records transaction and access history',
          'A confirmation email is sent after successful payment',
          <>These records serve as <strong>proof of delivery</strong></>,
        ]}
      />
    </Section>

    <Section title="5. Delays or Issues">
      <p>In case of any delay or issue with access:</p>
      <Bullets
        items={[
          'Customers will be notified promptly',
          'We will take immediate steps to resolve the issue',
        ]}
      />
      <p>
        If delivery is not completed within the stated timeframe, customers may request support and resolution in accordance
        with our policies.
      </p>
    </Section>

    <Section title="6. Digital Product Delivery Process">
      <Steps
        steps={[
          { title: 'Step 1: Successful Payment', text: 'Payment is securely processed via a trusted third-party payment provider, and the transaction is confirmed.' },
          { title: 'Step 2: Access Granted', text: 'The system automatically unlocks access to the purchased materials.' },
          { title: 'Step 3: Use the Product', text: 'Customers log in to their account or check their email to access and use the materials.' },
        ]}
      />
    </Section>

    <Section title="7. Contact & Support">
      <ContactBlock
        intro="If you experience any delivery issues or need assistance, please contact us:"
        hours="08:00 – 22:00 (Monday – Sunday)"
      />
    </Section>
  </PolicyLayout>
);

export default DeliPolicy;
