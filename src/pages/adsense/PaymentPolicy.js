import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { CreditCard } from 'lucide-react';

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
                <span className="font-bold">ieltscomputertest.com</span> provides convenient and secure payment methods
                to ensure the best shopping experience for our customers.
              </p>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                  1. Accepted Payment Methods
                </h2>
                <p className="text-gray-700 mb-4">
                  Currently, we only support payment via <strong>PayPal</strong>.
                </p>

                {/* PayPal Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-5 mr-2" />
                    PayPal
                  </h3>
                  <p className="text-gray-700 text-sm">
                    Secure international payment via PayPal. Supports credit/debit cards and PayPal balance.
                  </p>
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
                      <p className="text-gray-900 font-medium">Select Product</p>
                      <p className="text-gray-700 text-sm">Customers choose products and place an order on the website.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Order Confirmation</p>
                      <p className="text-gray-700 text-sm">The system sends an order confirmation along with payment details.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Make Payment</p>
                      <p className="text-gray-700 text-sm">Customers complete the payment according to the provided instructions.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                      4
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">Receive Product</p>
                      <p className="text-gray-700 text-sm">After receiving the payment, we will confirm via the system/phone and proceed to provide access to the purchased product.</p>
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
                      Customers are advised to keep their payment receipt/transaction proof for verification if needed.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      An order is considered complete only after full payment has been received.
                    </li>
                    <li className="flex items-start">
                      <span className="text-yellow-600 mr-2">⚠️</span>
                      If payment is not received within 24 hours after placing the order, the order may be automatically canceled.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  If you have any questions regarding payment methods, please contact us via:
                </p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  <p><span className="font-medium">Email:</span> ieltscomputertestglobal@gmail.com</p>
                  <p><span className="font-medium">WhatsApp:</span> +84 964 996 195</p>
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