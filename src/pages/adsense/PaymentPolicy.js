import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CreditCard } from 'lucide-react';
import Seo from '../../components/Seo';

const PaymentPolicy = () => {
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
        title="Payment Policy | ieltscomputertest.com"
        description="Payment terms for ieltscomputertest.com VIP plans and IELTS practice subscriptions."
        path="/payment-policy"
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
              <h1 className="text-4xl sm:text-3xl text-center font-bold text-gray-900 mb-2">Payment Policy</h1>
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
                <span className="font-bold">ieltscomputertest.com</span> provides secure and convenient payment methods to ensure a smooth purchasing experience for our customers.
              </p>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                  1. Accepted Payment Methods
                </h2>
                <p className="text-gray-700 mb-4">
                  We accept payments via <strong>Lemon Squeezy</strong>.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                    Lemon Squeezy
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Secure international payments</li>
                    <li>• Supports major credit/debit cards and other local payment methods (depending on availability)</li>
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Payment Process</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Step 1: Select Product</p>
                      <p className="text-gray-700 text-sm">Customers choose a product and place an order on the website.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Step 2: Checkout</p>
                      <p className="text-gray-700 text-sm">Customers are redirected to a secure checkout page provided by Lemon Squeezy.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Step 3: Make Payment</p>
                      <p className="text-gray-700 text-sm">Customers complete the payment using the available payment methods.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Step 4: Receive Product</p>
                      <p className="text-gray-700 text-sm">Once payment is successfully processed, access to the purchased product will be granted automatically via the user account or email.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Important Notes</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      Customers are advised to keep their payment receipt or transaction confirmation email for verification if necessary.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      Orders are considered complete only after successful payment confirmation from Lemon Squeezy.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      If a payment attempt fails or is not completed, the order will not be processed.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Payment Processing</h2>
                <p className="text-gray-700">
                  All payments are securely processed by Lemon Squeezy, which acts as the Merchant of Record. This means Lemon Squeezy handles payment processing, tax calculation, and compliance on our behalf.
                </p>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Contact Information</h2>
                <p className="text-sm text-gray-600">
                  If you have any questions regarding payments, please contact us:
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Email:</span> <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-500 hover:underline">ieltscomputertestglobal@gmail.com</a></p>
                  <p><span className="font-medium">WhatsApp:</span> <a href="https://wa.me/84964996195" className="text-blue-500 hover:underline">+84 964 996 195</a></p>
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

export default PaymentPolicy;