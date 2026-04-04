import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Truck, Clock, Globe, FileText, AlertTriangle } from 'lucide-react';

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
                This Shipping and Delivery Policy outlines the terms regarding the delivery of products and provision of services 
                on <span className="font-bold">ieltscomputertest.com</span>.
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
                    Digital Products (IELTS tests, PDF materials, audio, video)
                  </h3>
                  <p className="text-gray-700">
                    After successful payment, customers will be granted access to the materials via their registered account on the website.
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
                    Customers will receive access immediately after successful payment 
                    <span className="font-semibold text-green-700"> (within a maximum of 1 minute)</span>.
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
                    Available <span className="font-semibold text-purple-700">worldwide</span> 
                    {' '}(only a valid email address is required).
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
                  <p className="text-gray-700">
                    The system automatically records transaction history, and 
                    <span className="font-semibold"> confirmation emails serve as proof of delivery.</span>
                  </p>
                </div>
              </div>

              {/* Section 5: Delays or Issues */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
                  5. Delays or Issues
                </h2>
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        In case of delays in delivery or service provision, we will 
                        <span className="font-semibold"> promptly notify</span> customers.
                      </p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">
                        Customers have the right to <span className="font-semibold text-orange-700">cancel the transaction and request a refund</span> 
                        {' '}if the delivery does not meet the committed timeframe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Process Timeline */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Product Delivery Process</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  <div className="space-y-6">
                    <div className="relative flex items-start">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold relative z-10">1</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">Successful Payment</h4>
                        <p className="text-gray-600 text-sm">The system confirms the transaction.</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold relative z-10">2</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">Access Granted</h4>
                        <p className="text-gray-600 text-sm">The system automatically unlocks access to the materials via the customer's account.</p>
                      </div>
                    </div>
                    <div className="relative flex items-start">
                      <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold relative z-10">3</div>
                      <div className="ml-4">
                        <h4 className="font-semibold text-gray-900">Use the Product</h4>
                        <p className="text-gray-600 text-sm">Customers log in to their account to access and use the materials.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Contact & Support</h3>
                <p className="text-gray-700 text-sm">
                  If you experience any delivery issues or need assistance, please contact us:
                </p>
                <p className="text-gray-700 text-sm mt-1">
                  Email: <span className="text-blue-600">ieltscomputertestglobal@gmail.com</span> | 
                  WhatsApp: <span className="text-blue-600">+84 964 996 195</span>
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  Support hours: 08:00 – 22:00 (Monday – Sunday)
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

export default DeliPolicy;