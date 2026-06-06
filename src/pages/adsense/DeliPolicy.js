import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Truck, Clock, Globe, FileText, AlertTriangle } from 'lucide-react';
import Seo from '../../components/Seo';

const DeliPolicy = () => {
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
        title="Delivery Policy | ieltscomputertest.com"
        description="Delivery policy for ieltscomputertest.com digital IELTS practice subscriptions and services."
        path="/deli-policy"
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
              <h1 className="text-4xl sm:text-3xl text-center font-bold text-gray-900 mb-2">Delivery Policy</h1>
              <p className="text-gray-500 text-sm">
                Applicable to the e-commerce website: ieltscomputertest.com
              </p>
              <p className="text-gray-500 text-sm">
                Last updated: April 2, 2026
              </p>
            </div>

            {/* Full width content */}
            <div className="w-full px-4 sm:px-6 pb-6">
              <p className="text-gray-700 mb-6">
                This Shipping and Delivery Policy outlines how products and services are delivered on ieltscomputertest.com.
              </p>

              {/* Section 1: Delivery Method */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-blue-600" />
                  1. Delivery Method / Service Provision
                </h2>

                {/* Digital Products */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">📱</span>
                    All products offered on the Website are digital products, including mock tests and practice exercises with audio components.
                  </h3>
                  <p className="text-gray-700">
                    Upon successful payment, customers will be granted access to the purchased materials via their registered account or email.
                  </p>
                </div>
              </div>

              {/* Section 2: Delivery Time */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-green-600" />
                  2. Delivery Time
                </h2>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">⚡</span>
                    <span className="font-semibold text-gray-900">Digital Products</span>
                  </div>
                  <p className="text-gray-700">
                    Access is provided immediately after successful payment, typically <span className="font-semibold text-green-700">within 1 minute</span>.
                  </p>
                </div>
              </div>

              {/* Section 3: Delivery Scope */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-purple-600" />
                  3. Delivery Scope
                </h2>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">🌍</span>
                    Digital Products
                  </h3>
                  <p className="text-gray-700">
                    Our services are available <span className="font-semibold text-purple-700">worldwide</span>. Customers only need a valid email address to receive access.
                  </p>
                </div>
              </div>

              {/* Section 4: Responsibilities and Proof of Delivery */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-indigo-600" />
                  4. Responsibilities and Proof of Delivery
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">For digital products:</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>The system automatically records transaction and access history</p>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>A confirmation email is sent after successful payment</p>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p>These records serve as <span className="font-semibold">proof of delivery</span></p>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 5: Delays or Issues */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
                  5. Delays or Issues
                </h2>
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                  <p className="text-gray-900 font-medium mb-2">In case of any delay or issue with access:</p>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">Customers will be notified promptly</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">We will take immediate steps to resolve the issue</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">If delivery is not completed within the stated timeframe, customers may request support and resolution in accordance with our policies.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Digital Product Delivery Process */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Digital Product Delivery Process</h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  <div className="space-y-6">
                    <div className="relative flex items-start">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold relative z-10">1</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">Step 1: Successful Payment</h4>
                        <p className="text-gray-600 text-sm">Payment is securely processed via Lemon Squeezy, and the transaction is confirmed.</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold relative z-10">2</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">Step 2: Access Granted</h4>
                        <p className="text-gray-600 text-sm">The system automatically unlocks access to the purchased materials.</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold relative z-10">3</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">Step 3: Use the Product</h4>
                        <p className="text-gray-600 text-sm">Customers log in to their account or check their email to access and use the materials.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7: Contact & Support */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Contact & Support</h2>
                <p className="text-gray-700 text-sm">
                  If you experience any delivery issues or need assistance, please contact us:
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Email:</span> <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a></p>
                  <p><span className="font-medium">WhatsApp:</span> <a href="https://wa.me/84964996195" className="text-blue-500 hover:underline">+84 964 996 195</a></p>
                  <p><span className="font-medium">Support hours:</span> 08:00 – 22:00 (Monday – Sunday)</p>
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

export default DeliPolicy;