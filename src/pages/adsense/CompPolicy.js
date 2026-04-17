import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FileText, ShoppingCart, RefreshCw, Shield, Users, DollarSign, Settings } from 'lucide-react';

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
                These Terms and Conditions govern the purchase and use of products/services
                on the website <span className="font-bold">ieltscomputertest.com</span>.
              </p>

              {/* Section 1: Scope of Service */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  1. Scope of Service
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 mb-2">
                    <strong>Products/services provided:</strong> IELTS preparation materials, mock tests, online courses
                    (digital files: PDF, audio, video).
                  </p>
                  <p className="text-gray-700 mb-2">
                    All products are intended for study and reference purposes only and are not official test materials from any authorized examination board.
                  </p>
                  <p className="text-gray-700">
                    <strong>Scope of service:</strong> Worldwide (delivered online).
                  </p>
                </div>
              </div>

              {/* Section 2: Conditions and Limitations */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-orange-600" />
                  2. Conditions and Limitations
                </h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">After completing payment via PayPal, customers will be granted access to the purchased materials immediately, within the validity period specified for each course package on the website.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Inspection, Return, and Refund Policy */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5 text-green-600" />
                  3. Inspection, Return, and Refund Policy
                </h2>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-3">
                    Due to the nature of digital products, refunds are not available once the customer has successfully registered for the course, unless there is a technical issue that significantly affects access to the course.
                  </p>
                  <p className="text-gray-700 mb-3">
                    If customers experience technical issues such as corrupted files or inaccessible content, they must contact us via email. Support will be provided within
                    <span className="font-semibold text-green-700">5 days</span> of receiving the request.
                  </p>
                  <p className="text-gray-700">
                    If the issue is confirmed to seriously affect the user's access to the course (i.e. the course is inaccessible for more than 3 consecutive days due to technical issues on our website), we will either extend the access period accordingly or issue a full refund.
                  </p>
                </div>
              </div>

              {/* Section 4: Product Warranty Policy */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-purple-600" />
                  4. Product Warranty Policy
                </h2>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    As these are digital products, no physical warranty is applicable.
                  </p>
                  <p className="text-gray-700">
                    <strong>For online courses:</strong> access accounts are valid for the duration specified in the product description.
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
                      <span className="font-semibold text-gray-900">Select Product</span>
                    </div>
                    <p className="text-gray-700 text-sm">Customers select the course and add them to the cart.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">2</span>
                      <span className="font-semibold text-gray-900">Choose Payment Method</span>
                    </div>
                    <p className="text-gray-700 text-sm">Select PayPal as the payment method.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">3</span>
                      <span className="font-semibold text-gray-900">Confirm Order</span>
                    </div>
                    <p className="text-gray-700 text-sm">Review and confirm the order.</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2">4</span>
                      <span className="font-semibold text-gray-900">Receive Product</span>
                    </div>
                    <p className="text-gray-700 text-sm">Upon successful payment, the system will unlock access to the registered course.</p>
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
                    <h3 className="font-semibold text-gray-900 mb-3">Seller's obligations:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Provide products/services as described.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Protect customer information in accordance with the Privacy Policy.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Handle complaints and provide technical support when issues arise.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Customer's obligations:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Provide accurate information when making a purchase.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Complete full payment for the order.</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-sm">Not copy, distribute, or commercially exploit the products without authorization.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 7: Fees */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-yellow-600" />
                  7. Fees
                </h2>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-3">
                    All prices are listed in <span className="font-semibold text-yellow-700">US dollars (USD)</span> and include applicable taxes (if any).
                  </p>
                  <p className="text-gray-700">
                    No additional fees will be charged beyond the listed price unless clearly stated prior to payment.
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                <p className="text-gray-700 text-sm">
                  If you have any questions regarding these Terms and Conditions, please contact us via:
                </p>
                <p className="text-gray-700 text-sm mt-1">
                  Email: <span className="text-blue-600">ieltscomputertestglobal@gmail.com</span> |
                  WhatsApp: <span className="text-blue-600">+84 964 996 195</span>
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

export default CompPolicy;