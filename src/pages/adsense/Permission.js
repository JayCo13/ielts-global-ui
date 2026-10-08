import React from 'react';
import PolicyLayout, { EmailLink, WhatsAppLink } from '../../components/PolicyLayout';

const Row = ({ label, children }) => (
  <div className="py-4 border-b border-gray-100 last:border-b-0 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="font-semibold text-gray-900">{label}</dt>
    <dd className="mt-1 sm:mt-0 sm:col-span-2 text-gray-700">{children}</dd>
  </div>
);

const Permission = () => (
  <PolicyLayout
    title="Business Information"
    seoTitle="Business Owner Details | EnglishOnComputer"
    seoDescription="Business owner details and contact information for EnglishOnComputer, an AI-powered online learning platform."
    path="/permission"
  >
    <dl>
      <Row label="Owner">NGUYEN THI MAI ANH</Row>
      <Row label="Tax ID">
        <span className="block text-sm text-gray-500">Tax Identification Number:</span>
        030195007851
      </Row>
      <Row label="Contact">
        <p><span className="font-medium">Email:</span> <EmailLink /></p>
        <p className="mt-1"><span className="font-medium">WhatsApp:</span> <WhatsAppLink /></p>
      </Row>
      <Row label="Industry">AI-powered online learning platform</Row>
    </dl>
    <p className="mt-8 text-center text-sm text-gray-500">© 2026 EnglishOnComputer</p>
  </PolicyLayout>
);

export default Permission;
