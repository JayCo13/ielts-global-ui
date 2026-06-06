import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FileText, ShoppingCart, RefreshCw, Shield, Users, DollarSign, Settings, AlertTriangle } from 'lucide-react';
import Seo from '../../components/Seo';

const CompPolicy = () => {
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
        title="Terms and Conditions | ieltscomputertest.com"
        description="The terms and conditions governing the use of ieltscomputertest.com IELTS practice services."
        path="/comp-policy"
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
              <h1 className="text-4xl sm:text-3xl text-center font-bold text-gray-900 mb-2">Terms and Conditions</h1>
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
                These Terms and Conditions govern the purchase and use of products and services on <span className="font-bold">ieltscomputertest.com</span>.
              </p>

              {/* Section 1: Scope of Service */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  1. Scope of Service
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    We provide English test preparation materials designed for use on our website, including mock tests and practice exercises with audio components.
                  </p>
                  <p className="text-gray-700 mb-2">
                    All materials are intended for study and reference purposes only and do not constitute official materials from any authorized examination board.
                  </p>
                  <p className="text-gray-700">
                    Our services are delivered digitally and are accessible worldwide.
                  </p>
                </div>
              </div>

              {/* Section 2: Access to Products */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-orange-600" />
                  2. Access to Products
                </h2>
                <div className="space-y-2 text-gray-700 ml-2">
                  <p className="flex items-start">
                    <span className="mr-2">•</span> Upon successful payment, customers will be granted access to purchased materials via their account or email.
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span> Access is provided immediately and remains valid for the duration specified in each product or course package.
                  </p>
                  <p className="flex items-start">
                    <span className="mr-2">•</span> All payments are securely processed by Lemon Squeezy, which acts as the Merchant of Record.
                  </p>
                </div>
              </div>

              {/* Section 3: Refund Policy */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5 text-green-600" />
                  3. Refund Policy
                </h2>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-3">
                    Due to the nature of digital products, all purchases are generally non-refundable once access has been granted.
                  </p>
                  <p className="text-gray-700 mb-2">Refunds may only be considered if all of the following conditions are met:</p>
                  <ul className="space-y-2 text-gray-700 mb-3 ml-4">
                    <li className="list-disc">The product is inaccessible due to a technical issue</li>
                    <li className="list-disc">The issue persists for more than three (3) consecutive days</li>
                    <li className="list-disc">The issue is verified to originate from our system</li>
                  </ul>
                  <p className="text-gray-700 mb-2">In such cases, we reserve the right to:</p>
                  <ul className="space-y-2 text-gray-700 ml-4">
                    <li className="list-disc">Extend access time; or</li>
                    <li className="list-disc">Issue a refund in accordance with our Refund Policy</li>
                  </ul>
                </div>
              </div>

              {/* Section 4: Product Nature */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-purple-600" />
                  4. Product Nature
                </h2>
                <div className="space-y-2 text-gray-700 ml-2">
                  <p className="flex items-start">
                    <span className="mr-2">•</span> All products are delivered digitally. No physical goods are shipped, and no physical warranties apply.
                  </p>
                </div>
              </div>

              {/* Section 5: Service Delivery Process */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5 text-indigo-600" />
                  5. Service Delivery Process
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">1</span>
                      <span className="font-semibold text-gray-900">Step 1: Select Product</span>
                    </div>
                    <p className="text-gray-700 text-sm">Customer selects a product.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
                      <span className="font-semibold text-gray-900">Step 2: Checkout</span>
                    </div>
                    <p className="text-gray-700 text-sm">Customer completes secure checkout.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
                      <span className="font-semibold text-gray-900">Step 3: Payment Confirmation</span>
                    </div>
                    <p className="text-gray-700 text-sm">Payment is confirmed.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">4</span>
                      <span className="font-semibold text-gray-900">Step 4: Access Granted</span>
                    </div>
                    <p className="text-gray-700 text-sm">Access to materials is automatically granted.</p>
                  </div>
                </div>
              </div>

              {/* Section 6: Obligations of the Parties */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-red-600" />
                  6. Obligations of the Parties
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Seller obligations:</h3>
                    <ul className="space-y-2 text-gray-700 ml-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">Provide products and services as described</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">Protect customer data in accordance with the Privacy Policy</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">Provide reasonable support when required</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Customer obligations:</h3>
                    <ul className="space-y-2 text-gray-700 ml-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">Provide accurate information</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">Complete full payment</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm">Not copy, distribute, or commercially exploit materials without authorization</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 7: Fees and Pricing */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-yellow-600" />
                  7. Fees and Pricing
                </h2>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    All prices are listed in USD and include applicable taxes (if any).
                  </p>
                  <p className="text-gray-700">
                    No additional fees will be charged unless clearly disclosed prior to payment.
                  </p>
                </div>
              </div>

              {/* Section 8: Intellectual Property */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-blue-600" />
                  8. Intellectual Property
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    All content, materials, and platform features are the intellectual property of the Website and may not be reproduced, distributed, or used without prior written consent.
                  </p>
                </div>
              </div>

              {/* Section 9: Limitation of Liability */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-gray-600" />
                  9. Limitation of Liability
                </h2>
                <p className="text-gray-700 mb-2">We shall not be liable for:</p>
                <ul className="space-y-2 text-gray-700 mb-3 ml-4">
                  <li className="list-disc">Any indirect or consequential losses</li>
                  <li className="list-disc">User performance outcomes (e.g., test results)</li>
                  <li className="list-disc">Issues arising from external factors beyond our control</li>
                </ul>
              </div>

              {/* Section 10: Disclaimer */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                  10. Disclaimer
                </h2>
                <p className="text-gray-700">
                  This Website is independently developed and is not affiliated with, endorsed by, or officially connected to any test provider or examination organization.
                </p>
              </div>

              {/* Section 11: Termination */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
                  11. Termination
                </h2>
                <p className="text-gray-700">
                  We reserve the right to suspend or terminate user access in cases of violation of these Terms.
                </p>
              </div>

              {/* Contact Information */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center">
                  12. Contact Information
                </h2>
                <p className="text-gray-700 text-sm">
                  For any questions regarding these Terms, please contact:
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Email:</span> <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a>
                  </p>
                  <p>
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

export default CompPolicy;