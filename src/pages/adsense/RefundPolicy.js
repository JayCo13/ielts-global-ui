import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { RefreshCw, Mail, MessageCircle } from 'lucide-react';

const RefundPolicy = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
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
              <h1 className="text-4xl sm:text-3xl text-center font-bold text-gray-900 mb-2">Refund Policy</h1>
              <p className="text-gray-500 text-sm">
                Applicable to the e-commerce website: ieltscomputertest.com
              </p>
              <p className="text-gray-500 text-sm">
                Last updated: April 2, 2026
              </p>
            </div>

            {/* Full width content */}
            <div className="w-full px-4 sm:px-6 pb-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5 text-green-600" />
                  1. General Policy
                </h2>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    Due to the nature of digital products, all sales are generally final and non-refundable once access has been granted.
                  </p>
                  <p className="text-gray-700">
                    However, refunds may be considered in specific cases where technical issues significantly affect the customer's ability to access or use the product.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Eligible Refund Cases</h2>
                <p className="text-gray-700 mb-2">Customers may be eligible for a refund if:</p>
                <ul className="space-y-2 text-gray-700 mb-4 ml-2">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p>The product is inaccessible or unusable due to technical issues, and</p>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p>The issue persists for more than 3 consecutive days, and</p>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p>The issue is confirmed to originate from our system</p>
                  </li>
                </ul>
                <p className="text-gray-700 mb-2">In such cases, we may:</p>
                <ul className="space-y-2 text-gray-700 ml-2">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p>Extend the access period, or</p>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p>Provide a full or partial refund, depending on the situation</p>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Technical Support</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-700 mb-2">
                    If you experience any issues (e.g., inaccessible content, system errors), please contact us:
                  </p>
                  <p className="text-gray-700 mb-2 font-medium">Email: <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a></p>
                  <p className="text-gray-700">
                    Our support team will respond within <span className="font-semibold">5 business days</span> and work to resolve the issue as quickly as possible.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Refund Request Process</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      1
                    </div>
                    <p className="text-gray-700"><span className="font-medium text-gray-900">Step 1:</span> Contact us via email with a detailed description of the issue.</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <p className="text-gray-700"><span className="font-medium text-gray-900">Step 2:</span> Our team reviews your request within 5 business days.</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <p className="text-gray-700"><span className="font-medium text-gray-900">Step 3:</span> If approved, the refund will be processed via Lemon Squeezy to your original payment method.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Refund Processing Time</h2>
                <p className="text-gray-700 mb-2">Once approved, refunds are processed by <span className="font-semibold">Lemon Squeezy</span>.</p>
                <p className="text-gray-700">Depending on your payment provider, it may take <span className="font-semibold">5–10 business days</span> for the refunded amount to appear in your account.</p>
              </div>

              {/* Contact */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Contact Information</h2>
                <p className="text-gray-700 text-sm">
                  For refund inquiries, please contact us:
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Email:</span> <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">WhatsApp:</span> <a href="https://wa.me/84964996195" className="text-blue-500 hover:underline">+84 964 996 195</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
