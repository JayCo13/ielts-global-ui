import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Permission = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      {/* Custom Footer with Business Information */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">© 2026 ieltscomputertest.com</h3>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-400 mb-3">Business Information</h4>
                  <p className="text-gray-300">
                    <span className="font-medium">Owner:</span><br />
                    Nguyen Thi Mai Anh
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-green-400 mb-3">Tax ID</h4>
                  <p className="text-gray-300">
                    <span className="font-medium">Tax Identification Number:</span><br />
                    030195007851
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-400 mb-3">Contact</h4>
                  <p className="text-gray-300">
                    <span className="font-medium">Email:</span><br />
                    <a href="mailto:ieltscomputertestglobal@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                      ieltscomputertestglobal@gmail.com
                    </a>
                  </p>
                  <p className="text-gray-300 mt-1">
                    <span className="font-medium">WhatsApp:</span><br />
                    <a href="https://wa.me/84964996195" className="text-blue-400 hover:text-blue-300 transition-colors">
                      +84 964 996 195
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-400 mb-3">Industry</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Online IELTS preparation materials provider
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-600">
                <p className="text-xs text-gray-400 leading-relaxed max-w-4xl mx-auto">
                  Not classified as a conditional business under the Investment Law.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Original Footer Component */}
      <Footer />
    </div>
  );
};

export default Permission;