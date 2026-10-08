import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import Seo from './Seo';

// Contact details shared by every About / Policy page (EnglishOnComputer).
export const CONTACT_EMAIL = 'EnglishOnComputer.global@gmail.com';
export const WHATSAPP_DISPLAY = '+84 964 996 195';
export const WHATSAPP_URL = 'https://wa.me/84964996195';

export const EmailLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#0096b1] hover:underline break-all">{CONTACT_EMAIL}</a>
);

export const WhatsAppLink = () => (
  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[#0096b1] hover:underline">{WHATSAPP_DISPLAY}</a>
);

export const Section = ({ title, children }) => (
  <section className="mb-7">
    <h2 className="text-xl font-semibold text-[#2b5356] mb-3">{title}</h2>
    <div className="text-gray-700 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const Bullets = ({ items }) => (
  <ul className="list-disc pl-6 space-y-1.5">
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);

export const Steps = ({ steps }) => (
  <ol className="space-y-3">
    {steps.map((s, i) => (
      <li key={i} className="flex gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-[#0096b1] text-white font-bold grid place-items-center">{i + 1}</span>
        <div>
          <p className="font-semibold text-gray-900">{s.title}</p>
          {s.text && <p className="text-gray-700">{s.text}</p>}
        </div>
      </li>
    ))}
  </ol>
);

export const ContactBlock = ({ intro, hours }) => (
  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-1.5">
    {intro && <p>{intro}</p>}
    <p><span className="font-medium">Email:</span> <EmailLink /></p>
    <p><span className="font-medium">WhatsApp:</span> <WhatsAppLink /></p>
    {hours && <p><span className="font-medium">Support hours:</span> {hours}</p>}
  </div>
);

/**
 * Shared shell for the About / Policy pages: Seo + Navbar + titled card + Footer.
 */
const PolicyLayout = ({ title, subtitle, seoTitle, seoDescription, path, children }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <Seo title={seoTitle || `${title} | EnglishOnComputer`} description={seoDescription} path={path} />
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full"
        >
          <div className="px-6 sm:px-10 pt-8 pb-5 border-b border-gray-100">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2b5356] text-center">{title}</h1>
            {subtitle && <p className="text-gray-500 text-sm text-center mt-2">{subtitle}</p>}
          </div>
          <div className="px-6 sm:px-10 py-8">{children}</div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PolicyLayout;
