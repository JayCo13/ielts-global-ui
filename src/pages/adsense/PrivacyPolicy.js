import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import Seo from '../../components/Seo';

const PrivacyPolicy = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      <Seo
        title="Privacy Policy | ieltscomputertest.com"
        description="How ieltscomputertest.com collects, uses and protects your personal data when you practice IELTS online."
        path="/privacy-policy"
      />
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden w-full"
        >
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
            {/* Header */}
            <div className="px-4 sm:px-6 pb-4">
              <h1 className="text-4xl sm:text-3xl text-center font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-gray-500 text-sm">
                Last updated: April 2, 2026
              </p>
            </div>

            <div className="flex flex-col lg:flex-row w-full">
              {/* Left content column */}
              <div className="w-full lg:w-7/12 px-4 sm:px-6 pb-6">
                <p className="text-gray-700 mb-6">
                  <span className="font-bold">ieltscomputertest.com</span> is committed to protecting the privacy and personal information of our users. This policy explains how we collect, use, and safeguard your information when you use our website and services.
                </p>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Purpose of Collecting Personal Information</h2>
                  <p className="text-gray-700 mb-2">We collect personal information for the following purposes:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• To process orders and provide products/services to customers</li>
                    <li>• To contact and support customers during service usage</li>
                    <li>• To provide updates on products and promotions (with customer consent)</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Scope of Information Usage</h2>
                  <p className="text-gray-700 mb-2">Customer personal information is used only for the following purposes:</p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Managing user accounts and orders</li>
                    <li>• Delivering digital products via email or online learning accounts</li>
                    <li>• Verifying transaction information and handling complaints</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Retention Period</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Personal information is stored until the customer requests deletion</li>
                    <li>• If no request is made, data will be stored for a maximum of 5 years from the last transaction</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Entities That May Access the Information</h2>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Order management staff and customer service team of ieltscomputertest.com</li>
                    <li>• Competent state authorities upon legal request</li>
                    <li>• Trusted third-party service providers (such as payment processors and analytics tools) who assist in operating our platform</li>
                    <li>• We do not sell, exchange, or share customer personal information with third parties beyond what is necessary for service delivery.</li>
                  </ul>
                </div>
              </div>

              {/* Right illustration column */}
              <div className="w-full lg:w-5/12 p-4 sm:p-6 flex items-center justify-center">
                <Player
                  autoplay
                  loop
                  src="/edu.json"
                  className="w-full h-64 md:h-80"
                  background="transparent"
                  speed={1}
                />
              </div>
            </div>

            {/* Additional sections */}
            <div className="px-4 sm:px-6 pb-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Information Controller Details</h2>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Business owner:</strong> Le Tiet An</li>
                  <li><strong>Address:</strong> 105, Street 5B, Quarter 3, Hoa Phu Ward, Thu Dau Mot City, Binh Duong, Vietnam</li>
                  <li><strong>Email:</strong> <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a></li>
                  <li><strong>WhatsApp:</strong> <a href="https://wa.me/84964996195" className="text-blue-500 hover:underline">+84 964 996 195</a></li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Customer Rights Regarding Personal Data</h2>
                <p className="text-gray-700 mb-2">Customers have the right to:</p>
                <ul className="space-y-2 text-gray-700">
                  <li>• Review, update, or modify their personal data</li>
                  <li>• Request deletion of their personal data at any time</li>
                </ul>
                <p className="text-gray-700 mt-2">Requests can be sent via:</p>
                <ul className="space-y-2 text-gray-700">
                  <li>• <strong>Email:</strong> <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a></li>
                  <li>• <strong>WhatsApp:</strong> <a href="https://wa.me/84964996195" className="text-blue-500 hover:underline">+84 964 996 195</a></li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Complaint Handling Mechanism</h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• If customers detect misuse of their personal information, please contact us immediately</li>
                  <li>• We are committed to resolving complaints within 7 working days from the date of receipt</li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Data Protection Commitment</h2>
                <ul className="space-y-2 text-gray-700">
                  <li>• We implement appropriate technical and organizational measures to protect personal data from unauthorized access, loss, misuse, or alteration.</li>
                  <li>• All payment transactions are processed through secure systems and comply with the security standards of our payment partners and applicable legal regulations.</li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Advertising and Google AdSense</h2>
                <p className="text-gray-700 mb-2">We use Google AdSense, a third-party advertising service provided by Google.</p>
                <p className="text-gray-700">
                  Google uses cookies (including the DoubleClick cookie) to serve ads based on users’ visits to this and other websites. Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Disclaimer</h2>
                <p className="text-gray-700">
                  This website is not affiliated with, endorsed by, or officially connected to IELTS, Cambridge, or any official test provider.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
