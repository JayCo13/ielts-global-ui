import React from 'react';
import PolicyLayout, { Section, Bullets, EmailLink, WhatsAppLink } from '../../components/PolicyLayout';

const PrivacyPolicy = () => (
  <PolicyLayout
    title="Privacy Policy"
    seoTitle="Privacy Policy | EnglishOnComputer"
    seoDescription="How EnglishOnComputer.com collects, uses, and safeguards your personal information."
    path="/privacy-policy"
  >
    <p className="text-gray-700 mb-7">
      <strong>EnglishOnComputer.com</strong> is committed to protecting the privacy and personal information of our users. This
      policy explains how we collect, use, and safeguard your information when you use our website and services.
    </p>

    <Section title="1. Purpose of Collecting Personal Information">
      <p>We collect personal information for the following purposes:</p>
      <Bullets
        items={[
          'To process orders and provide products/services to customers',
          'To contact and support customers during service usage',
          'To provide updates on products and promotions (with customer consent)',
        ]}
      />
    </Section>

    <Section title="2. Scope of Information Usage">
      <p>Customer personal information is used only for the following purposes:</p>
      <Bullets
        items={[
          'Managing user accounts and orders',
          'Delivering digital products via email or online learning accounts',
          'Verifying transaction information and handling complaints',
        ]}
      />
    </Section>

    <Section title="3. Data Retention Period">
      <Bullets
        items={[
          'Personal information is stored until the customer requests deletion',
          'If no request is made, data will be stored for a maximum of 5 years from the last transaction',
        ]}
      />
    </Section>

    <Section title="4. Entities That May Access the Information">
      <Bullets
        items={[
          'Order management staff and customer service team of EnglishOnComputer.com',
          'Competent state authorities upon legal request',
          'Trusted third-party service providers (such as payment processors and analytics tools) who assist in operating our platform',
          'We do not sell, exchange, or share customer personal information with third parties beyond what is necessary for service delivery.',
        ]}
      />
    </Section>

    <Section title="5. Information Controller Details">
      <Bullets
        items={[
          <><strong>Business owner:</strong> NGUYEN THI MAI ANH</>,
          <><strong>Address:</strong> 105, Street 5B, Quarter 3, Hoa Phu Ward, Thu Dau Mot City, Binh Duong, Vietnam</>,
          <><strong>Email:</strong> <EmailLink /></>,
          <><strong>WhatsApp:</strong> <WhatsAppLink /></>,
        ]}
      />
    </Section>

    <Section title="6. Customer Rights Regarding Personal Data">
      <p>Customers have the right to:</p>
      <Bullets
        items={[
          'Review, update, or modify their personal data',
          'Request deletion of their personal data at any time',
        ]}
      />
      <p>Requests can be sent via:</p>
      <Bullets
        items={[
          <><strong>Email:</strong> <EmailLink /></>,
          <><strong>WhatsApp:</strong> <WhatsAppLink /></>,
        ]}
      />
    </Section>

    <Section title="7. Complaint Handling Mechanism">
      <Bullets
        items={[
          'If customers detect misuse of their personal information, please contact us immediately',
          'We are committed to resolving complaints within 7 working days from the date of receipt',
        ]}
      />
    </Section>

    <Section title="8. Data Protection Commitment">
      <Bullets
        items={[
          'We implement appropriate technical and organizational measures to protect personal data from unauthorized access, loss, misuse, or alteration.',
          'All payment transactions are processed through secure systems and comply with the security standards of our payment partners and applicable legal regulations.',
        ]}
      />
    </Section>

    <Section title="9. Advertising and Google AdSense">
      <p>We use Google AdSense, a third-party advertising service provided by Google.</p>
      <p>
        Google uses cookies (including the DoubleClick cookie) to serve ads based on users' visits to this and other websites.
        Users may opt out of personalized advertising by visiting{' '}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#0096b1] hover:underline">
          Google Ads Settings
        </a>.
      </p>
    </Section>

    <Section title="10. Disclaimer">
      <p>This website is not affiliated with, endorsed by, or officially connected to any educational organization.</p>
    </Section>
  </PolicyLayout>
);

export default PrivacyPolicy;
