import React from 'react';
import PolicyLayout, { Section, Bullets, Steps, ContactBlock } from '../../components/PolicyLayout';

const PaymentPolicy = () => (
  <PolicyLayout
    title="Payment Policy"
    subtitle="Applicable to the e-commerce website: EnglishOnComputer.com"
    seoTitle="Payment Policy | EnglishOnComputer"
    seoDescription="Accepted payment methods and the payment process on EnglishOnComputer.com."
    path="/payment-policy"
  >
    <p className="text-gray-700 mb-7">
      <strong>EnglishOnComputer.com</strong> provides secure and convenient payment methods to ensure a smooth purchasing
      experience for our customers.
    </p>

    <Section title="1. Accepted Payment Methods">
      <p>We accept payments via <strong>a trusted third-party payment provider</strong></p>
      <Bullets
        items={[
          'Secure international payments',
          'Supports major credit/debit cards and other local payment methods (depending on availability)',
        ]}
      />
    </Section>

    <Section title="2. Payment Process">
      <Steps
        steps={[
          { title: 'Step 1: Select Product', text: 'Customers choose a product and place an order on the website.' },
          { title: 'Step 2: Checkout', text: 'Customers are redirected to a secure checkout page provided by a trusted third-party payment provider' },
          { title: 'Step 3: Make Payment', text: 'Customers complete the payment using the available payment methods.' },
          { title: 'Step 4: Receive Product', text: 'Once payment is successfully processed, access to the purchased product will be granted automatically via the user account or email.' },
        ]}
      />
    </Section>

    <Section title="3. Important Notes">
      <Bullets
        items={[
          '⚠️ Customers are advised to keep their payment receipt or transaction confirmation email for verification if necessary.',
          '⚠️ Orders are considered complete only after successful payment confirmation from a trusted third-party payment provider.',
          '⚠️ If a payment attempt fails or is not completed, the order will not be processed.',
        ]}
      />
    </Section>

    <Section title="4. Payment Processing">
      <p>
        All payments are securely processed by a trusted third-party payment provider, which acts as the Merchant of Record.
        This means the trusted third-party payment provider handles payment processing, tax calculation, and compliance on our
        behalf.
      </p>
    </Section>

    <Section title="5. Contact Information">
      <ContactBlock intro="If you have any questions regarding payments, please contact us:" />
    </Section>
  </PolicyLayout>
);

export default PaymentPolicy;
