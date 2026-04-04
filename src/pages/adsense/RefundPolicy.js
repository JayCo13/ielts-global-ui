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
                  Refund Terms
                </h2>
                <div className="bg-green-50 p-5 rounded-lg space-y-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      Due to the nature of digital products, <strong>refunds are not available</strong> once the customer has successfully registered for the course, unless there is a technical issue that significantly affects the customer's access to the course.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      If customers experience technical issues such as <strong>corrupted files or inaccessible content</strong>, they must contact us via email. Support will be provided within <span className="font-semibold text-green-700">5 days</span> of receiving the request.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">
                      If the issue is confirmed to seriously affect the user's access to the course, we will either <strong>extend the access period</strong> accordingly or <strong>issue a full refund</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* How to Request a Refund */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Request a Refund</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      1
                    </div>
                    <p className="text-gray-700">Contact us via email at <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a> describing the issue you encountered.</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <p className="text-gray-700">Our support team will review your request within 5 business days.</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <p className="text-gray-700">If approved, the refund will be processed via PayPal to your original payment method.</p>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                <p className="text-gray-700 text-sm">
                  For refund inquiries, please reach out to us:
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Email:</span> ieltscomputertestglobal@gmail.com
                  </p>
                  <p className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">WhatsApp:</span> +84 964 996 195
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
