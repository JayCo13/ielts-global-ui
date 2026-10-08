import React from 'react';
import PolicyLayout, { Section, Bullets, Steps, ContactBlock } from '../../components/PolicyLayout';

const CompPolicy = () => (
  <PolicyLayout
    title="Terms and Conditions"
    subtitle="Applicable to the e-commerce website: EnglishOnComputer.com"
    seoTitle="Terms and Conditions | EnglishOnComputer"
    seoDescription="Terms and Conditions governing the purchase and use of products and services on EnglishOnComputer.com."
    path="/comp-policy"
  >
    <p className="text-gray-700 mb-7">
      These Terms and Conditions govern the purchase and use of products and services on <strong>EnglishOnComputer.com</strong>
    </p>

    <Section title="1. Scope of Service">
      <p>
        We provide English test preparation materials designed for use on our website, including mock tests and practice
        exercises with audio components.
      </p>
      <p>
        All materials are intended for study and reference purposes only and do not constitute official materials from any
        authorized examination board.
      </p>
      <p>Our services are delivered digitally and are accessible worldwide.</p>
    </Section>

    <Section title="2. Access to Products">
      <Bullets
        items={[
          'Upon successful payment, customers will be granted access to purchased materials via their account or email.',
          'Access is provided immediately and remains valid for the duration specified in each product or course package.',
          'All payments are securely processed by a trusted third-party payment provider, which acts as the Merchant of Record.',
        ]}
      />
    </Section>

    <Section title="3. Refund Policy">
      <p>Due to the nature of digital products, all purchases are generally non-refundable once access has been granted.</p>
      <p>Refunds may only be considered if all of the following conditions are met:</p>
      <Bullets
        items={[
          'The product is inaccessible due to a technical issue',
          'The issue persists for more than three (3) consecutive days',
          'The issue is verified to originate from our system',
        ]}
      />
      <p>In such cases, we reserve the right to:</p>
      <Bullets items={['Extend access time; or', 'Issue a refund in accordance with our Refund Policy']} />
    </Section>

    <Section title="4. Product Nature">
      <Bullets items={['All products are delivered digitally. No physical goods are shipped, and no physical warranties apply.']} />
    </Section>

    <Section title="5. Service Delivery Process">
      <Steps
        steps={[
          { title: 'Step 1: Select Product', text: 'Customer selects a product.' },
          { title: 'Step 2: Checkout', text: 'Customer completes secure checkout.' },
          { title: 'Step 3: Payment Confirmation', text: 'Payment is confirmed.' },
          { title: 'Step 4: Access Granted', text: 'Access to materials is automatically granted.' },
        ]}
      />
    </Section>

    <Section title="6. Obligations of the Parties">
      <p className="font-semibold text-gray-900">Seller obligations:</p>
      <Bullets
        items={[
          'Provide products and services as described',
          'Protect customer data in accordance with the Privacy Policy',
          'Provide reasonable support when required',
        ]}
      />
      <p className="font-semibold text-gray-900">Customer obligations:</p>
      <Bullets
        items={[
          'Provide accurate information',
          'Complete full payment',
          'Not copy, distribute, or commercially exploit materials without authorization',
        ]}
      />
    </Section>

    <Section title="7. Fees and Pricing">
      <p>All prices are listed in USD and include applicable taxes (if any).</p>
      <p>No additional fees will be charged unless clearly disclosed prior to payment.</p>
    </Section>

    <Section title="8. Intellectual Property">
      <p>
        All content, materials, and platform features are the intellectual property of the Website and may not be reproduced,
        distributed, or used without prior written consent.
      </p>
    </Section>

    <Section title="9. Limitation of Liability">
      <p>We shall not be liable for:</p>
      <Bullets
        items={[
          'Any indirect or consequential losses',
          'User performance outcomes (e.g., results)',
          'Issues arising from external factors beyond our control',
        ]}
      />
    </Section>

    <Section title="10. Disclaimer">
      <p>
        This website is independently developed and is not affiliated with, endorsed by, or officially connected to any
        educational organization.
      </p>
    </Section>

    <Section title="11. Termination">
      <p>We reserve the right to suspend or terminate user access in cases of violation of these Terms.</p>
    </Section>

    <Section title="12. Contact Information">
      <ContactBlock intro="For any questions regarding these Terms, please contact:" />
    </Section>
  </PolicyLayout>
);

export default CompPolicy;
